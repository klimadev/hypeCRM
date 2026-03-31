import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, podeGerenciarRecursoNoPdv, whereNegociosPorPerfil } from "@/lib/permissoes";
import { badRequest, notFound } from "@/lib/api/http";
import { parseJson, validateBody } from "@/lib/api/route-validation";
import { esquemaAtualizarNegocio, esquemaRemoverNegocio } from "@/lib/validacoes";
import { atualizarNegocio, desativarNegocio, montarDtoNegocio, obterNegocioPorId } from "@/lib/negocios";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id } = await params;
  const wherePermitido = await whereNegociosPorPerfil(auth.sessao);

  const negocio = await obterNegocioPorId({
    idEmpresa: auth.sessao.id_empresa,
    idNegocio: id,
    whereExtra: wherePermitido,
  });

  if (!negocio) {
    return notFound("Negocio nao encontrado.");
  }

  return NextResponse.json({ negocio: montarDtoNegocio(negocio) });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id } = await params;
  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = validateBody(esquemaAtualizarNegocio, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const wherePermitido = await whereNegociosPorPerfil(auth.sessao);
  const negocio = await obterNegocioPorId({
    idEmpresa: auth.sessao.id_empresa,
    idNegocio: id,
    whereExtra: wherePermitido,
  });

  if (!negocio) {
    return notFound("Negocio nao encontrado.");
  }

  const dados = validacao.data;

  if (dados.id_funcionario) {
    const funcionarioDestino = await prisma.funcionario.findFirst({
      where: {
        id: dados.id_funcionario,
        id_empresa: auth.sessao.id_empresa,
        ativo: true,
      },
      select: { id: true, id_pdv: true },
    });

    if (!funcionarioDestino) {
      return badRequest("Funcionario invalido.");
    }

    if (!podeGerenciarRecursoNoPdv(auth.sessao, funcionarioDestino.id_pdv)) {
      return badRequest("Sem permissao para atribuir negocio a este colaborador.");
    }
  }

  try {
    const atualizado = await atualizarNegocio({
      idEmpresa: auth.sessao.id_empresa,
      idNegocio: negocio.id,
      titulo: dados.titulo,
      valorEstimado: dados.valor_estimado,
      valorFechado: dados.valor_fechado,
      probabilidade: dados.probabilidade,
      motivoPerda: dados.motivo_perda,
      idFuncionario: dados.id_funcionario,
      idFunil: dados.id_funil,
      idEstagio: dados.id_estagio,
      status: dados.status,
      observacoesComerciais: dados.observacoes_comerciais,
    });

    if (!atualizado) {
      return notFound("Negocio nao encontrado.");
    }

    return NextResponse.json({ negocio: montarDtoNegocio(atualizado) });
  } catch (erro) {
    return badRequest(erro instanceof Error ? erro.message : "Erro ao atualizar negocio.");
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = validateBody(esquemaRemoverNegocio, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const { id } = await params;
  const wherePermitido = await whereNegociosPorPerfil(auth.sessao);
  const negocio = await obterNegocioPorId({
    idEmpresa: auth.sessao.id_empresa,
    idNegocio: id,
    whereExtra: wherePermitido,
  });

  if (!negocio) {
    return notFound("Negocio nao encontrado.");
  }

  const resultado = await prisma.$transaction(async (tx) => {
    return desativarNegocio({
      idEmpresa: auth.sessao.id_empresa,
      idNegocio: negocio.id,
      removerLeadsVinculados: validacao.data.remover_leads_vinculados,
      client: tx,
    });
  });

  if (!resultado) {
    return notFound("Negocio nao encontrado.");
  }

  return NextResponse.json({
    sucesso: true,
    leads_removidos: validacao.data.remover_leads_vinculados ? resultado.leadsVinculados.length : 0,
  });
}
