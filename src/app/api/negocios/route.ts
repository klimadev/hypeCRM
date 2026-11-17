import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, podeGerenciarRecursoNoPdv, whereNegociosPorPerfil } from "@/lib/permissoes";
import { badRequest } from "@/lib/api/http";
import { handleRouteError } from "@/lib/api/route-errors";
import { garantirEstagiosFixosEmpresa } from "@/lib/estagios-fixos";
import {
  criarNegocio,
  listarFunisDaEmpresa,
  listarNegociosKanban,
  montarDtoNegocio,
} from "@/lib/negocios";
import { esquemaCriarNegocio } from "@/lib/validacoes";
import { parseJson, validateBody } from "@/lib/api/route-validation";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  await garantirEstagiosFixosEmpresa(auth.sessao.id_empresa);

  const searchParams = new URL(request.url).searchParams;
  const funis = await listarFunisDaEmpresa(auth.sessao.id_empresa);
  const idFunil = searchParams.get("funilId")?.trim()
    || searchParams.get("id_funil")?.trim()
    || searchParams.get("pipelineId")?.trim()
    || funis.find((funil) => funil.padrao)?.id
    || undefined;

  const whereNegocios = await whereNegociosPorPerfil(auth.sessao);

  const [{ funil, estagios, negocios }, funcionarios, pdvs] = await Promise.all([
    listarNegociosKanban({ sessao: auth.sessao, where: whereNegocios, idFunil }),
    prisma.funcionario.findMany({
      where: auth.sessao.perfil === "GERENTE" && auth.sessao.id_pdv
        ? { id_empresa: auth.sessao.id_empresa, ativo: true, id_pdv: auth.sessao.id_pdv }
        : { id_empresa: auth.sessao.id_empresa, ativo: true },
      select: { id: true, nome: true, id_pdv: true },
      orderBy: { nome: "asc" },
    }),
    auth.sessao.perfil === "EMPRESA"
      ? prisma.pdv.findMany({
          where: { id_empresa: auth.sessao.id_empresa },
          select: { id: true, nome: true },
          orderBy: { nome: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const versao = negocios.reduce((maisRecente, negocio) => {
    const atualizadoEm = negocio.atualizado_em instanceof Date ? negocio.atualizado_em : new Date(negocio.atualizado_em);
    return Math.max(maisRecente, atualizadoEm.getTime());
  }, 0);

  return NextResponse.json({
    funis,
    funilSelecionado: funil ? { ...funil, ordem: Number(funil.ordem) } : null,
    estagios: estagios.map((estagio) => ({ ...estagio, ordem: Number(estagio.ordem) })),
    negocios: negocios.map((negocio) => montarDtoNegocio(negocio)),
    funcionarios,
    pdvs,
    versao: versao > 0 ? new Date(versao).toISOString() : null,
  });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const body = await parseJson<Record<string, unknown>>(request);
  if (!body.ok) {
    return body.response;
  }

  const idFuncionario = auth.sessao.perfil === "COLABORADOR"
    ? auth.sessao.id_usuario
    : typeof body.data.id_funcionario === "string"
      ? body.data.id_funcionario
      : undefined;

  const validacao = validateBody(esquemaCriarNegocio, {
    titulo: typeof body.data.titulo === "string" ? body.data.titulo.trim() : undefined,
    valor_estimado: Number(body.data.valor_estimado ?? 0),
    id_funil: typeof body.data.id_funil === "string" ? body.data.id_funil.trim() : undefined,
    id_estagio: typeof body.data.id_estagio === "string" ? body.data.id_estagio.trim() : undefined,
    id_funcionario: idFuncionario,
    lead_ids: Array.isArray(body.data.lead_ids)
      ? body.data.lead_ids.filter((leadId): leadId is string => typeof leadId === "string").map((leadId) => leadId.trim()).filter(Boolean)
      : undefined,
    probabilidade: typeof body.data.probabilidade === "number" ? body.data.probabilidade : undefined,
    observacoes_comerciais: typeof body.data.observacoes_comerciais === "string" ? body.data.observacoes_comerciais.trim() : body.data.observacoes_comerciais === null ? null : undefined,
    motivo_perda: typeof body.data.motivo_perda === "string" ? body.data.motivo_perda.trim() : body.data.motivo_perda === null ? null : undefined,
  });

  if (!validacao.ok) {
    return validacao.response;
  }

  const dados = validacao.data;

  const funcionario = await prisma.funcionario.findFirst({
    where: {
      id: dados.id_funcionario,
      id_empresa: auth.sessao.id_empresa,
      ativo: true,
    },
    select: { id: true, id_pdv: true },
  });

  if (!funcionario) {
    return badRequest("Funcionario invalido.");
  }

  if (!podeGerenciarRecursoNoPdv(auth.sessao, funcionario.id_pdv)) {
    return badRequest("Sem permissao para atribuir negocio a este colaborador.");
  }

  try {
    const negocio = await criarNegocio({
      idEmpresa: auth.sessao.id_empresa,
      idFunil: dados.id_funil,
      idEstagio: dados.id_estagio,
      idFuncionario: dados.id_funcionario,
      titulo: dados.titulo,
      valorEstimado: dados.valor_estimado,
      leadIds: dados.lead_ids,
      probabilidade: dados.probabilidade,
      observacoesComerciais: dados.observacoes_comerciais,
      motivoPerda: dados.motivo_perda,
    });

    if (!negocio) {
      return badRequest("Nao foi possivel criar o negocio.");
    }

    return NextResponse.json({ negocio: montarDtoNegocio(negocio) });
  } catch (erro) {
    if (erro instanceof Error && erro.message.toLowerCase().includes("lead")) {
      return badRequest(erro.message);
    }
    return handleRouteError(erro, "Erro ao criar negocio.", "Erro ao criar negocio:");
  }
}
