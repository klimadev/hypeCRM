import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, podeGerenciarRecursoNoPdv, whereLeadsPorPerfil } from "@/lib/permissoes";
import { esquemaCriarLead, mensagemErroValidacao } from "@/lib/validacoes";
import { badRequest, forbidden } from "@/lib/api/http";
import { handleRouteError } from "@/lib/api/route-errors";
import { parseJson, validateBody } from "@/lib/api/route-validation";
import { criarLeadContato, listarLeadsContato } from "@/lib/leads";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const whereLeads = await whereLeadsPorPerfil(auth.sessao);

  const [leads, funcionarios, pdvs] = await Promise.all([
    listarLeadsContato({
      idEmpresa: auth.sessao.id_empresa,
      where: whereLeads,
    }),
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

  return NextResponse.json({
    leads,
    funcionarios,
    pdvs,
  });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = validateBody(esquemaCriarLead, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const dados = validacao.data;
  const idFuncionario = auth.sessao.perfil === "COLABORADOR"
    ? auth.sessao.id_usuario
    : dados.id_funcionario;

  const funcionario = await prisma.funcionario.findFirst({
    where: {
      id: idFuncionario,
      id_empresa: auth.sessao.id_empresa,
      ativo: true,
    },
    select: { id: true, id_pdv: true },
  });

  if (!funcionario) {
    return badRequest("Funcionario invalido.");
  }

  if (!podeGerenciarRecursoNoPdv(auth.sessao, funcionario.id_pdv)) {
    return forbidden("Sem permissao para atribuir lead a este colaborador.");
  }

  try {
    const lead = await criarLeadContato({
      idEmpresa: auth.sessao.id_empresa,
      idFuncionario,
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email,
      fonte: dados.fonte,
      empresaOrigem: dados.empresa_origem,
      observacoes: dados.observacoes,
      origem: dados.origem,
      anuncioTitulo: dados.anuncio_titulo,
      anuncioDescricao: dados.anuncio_descricao,
      anuncioUrl: dados.anuncio_url,
      dadosExtras: dados.dados_extras,
    });

    if (!lead) {
      return badRequest("Nao foi possivel criar o lead.");
    }

    return NextResponse.json({ lead });
  } catch (erro) {
    return handleRouteError(erro, "Erro ao criar lead.", "Erro ao criar lead:");
  }
}
