import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exigirSessao,
  podeAdicionarColaboradorNoPdv,
  podeAdicionarFuncionario,
  podeExecutarAcoesEmLote,
  podeGerenciarRecursoNoPdv,
  podeVerEquipe,
  respostaSemPermissao,
} from "@/lib/permissoes";
import {
  normalizarBuscaFuncionarios,
  schemaAcaoLoteFuncionarios,
  schemaListarFuncionarios,
} from "@/lib/validacoes";
import { badRequest, notFound } from "@/lib/api/http";
import { parseJson, validateBody, validateQuery } from "@/lib/api/route-validation";
import { processarAcaoLoteFuncionarios } from "./route.batch";
import type {
  DestinoInativacaoFuncionario,
  FiltrosFuncionariosRoute,
  FuncionarioAcaoLoteItem,
  FuncionarioListagemItem,
  PayloadAcaoLoteFuncionarios,
  PayloadCriacaoFuncionarioBruto,
  SessaoFuncionariosRoute,
} from "./route.types";
import {
  criarOrderByFuncionarios,
  criarWhereBaseFuncionarios,
  criarWhereFuncionarios,
  deveBloquearFiltroPdvGerente,
  obterIdPdvRestritoPorSessao,
  validarPayloadCriacaoFuncionario,
  validarPrecondicoesAcaoLoteFuncionario,
} from "./route.utils";

function responderGerenteForaDoPdv() {
  return NextResponse.json(
    { erro: "Gerentes podem adicionar apenas colaboradores no proprio PDV." },
    { status: 403 },
  );
}

function responderMovimentacaoPdvNegada() {
  return NextResponse.json(
    { erro: "Gerentes nao podem mover colaboradores para outro PDV." },
    { status: 403 },
  );
}

function responderAlteracaoCargoNegada() {
  return NextResponse.json(
    { erro: "Gerentes podem definir apenas o cargo COLABORADOR." },
    { status: 403 },
  );
}

function responderDestinoInativacaoNegado() {
  return NextResponse.json(
    { erro: "Destino de inativacao precisa estar no mesmo PDV do gerente." },
    { status: 403 },
  );
}

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  if (!podeVerEquipe(auth.sessao)) {
    return respostaSemPermissao();
  }

  const params = request.nextUrl.searchParams;
  const validacaoQuery = validateQuery(schemaListarFuncionarios, {
    busca: params.get("busca") ?? undefined,
    status: (params.get("status") ?? "TODOS").toUpperCase(),
    cargo: (params.get("cargo") ?? "TODOS").toUpperCase(),
    id_pdv: params.get("id_pdv") ?? undefined,
    ordenar_por: params.get("ordenar_por") ?? undefined,
    direcao: params.get("direcao") ?? undefined,
    pagina: params.get("pagina") ?? undefined,
    por_pagina: params.get("por_pagina") ?? undefined,
  });

  if (!validacaoQuery.ok) {
    return validacaoQuery.response;
  }

  const filtros = validacaoQuery.data as FiltrosFuncionariosRoute;
  const busca = normalizarBuscaFuncionarios(filtros.busca);

  const sessao = auth.sessao as SessaoFuncionariosRoute;
  const idPdvSessao = obterIdPdvRestritoPorSessao(sessao);
  if (auth.sessao.perfil === "GERENTE") {
    if (!idPdvSessao) {
      return respostaSemPermissao();
    }

    if (deveBloquearFiltroPdvGerente(idPdvSessao, filtros.id_pdv)) {
      return respostaSemPermissao();
    }
  }

  const whereBase = criarWhereBaseFuncionarios({
    idEmpresa: auth.sessao.id_empresa,
    cargo: filtros.cargo,
    busca,
    idPdvSessao,
    idPdvFiltroEmpresa: auth.sessao.perfil === "EMPRESA" ? filtros.id_pdv ?? null : null,
  });
  const where = criarWhereFuncionarios(whereBase, filtros.status);
  const orderBy = criarOrderByFuncionarios(filtros.ordenar_por, filtros.direcao);
  const skip = (filtros.pagina - 1) * filtros.por_pagina;

  const [total, funcionarios, ativos, inativos, gerentes, colaboradores] = await Promise.all([
    prisma.funcionario.count({ where }),
    prisma.funcionario.findMany({
      where,
      orderBy: orderBy as never,
      skip,
      take: filtros.por_pagina,
        include: {
          Pdv: { select: { id: true, nome: true } },
        },
    }) as unknown as FuncionarioListagemItem[],
    prisma.funcionario.count({ where: { ...whereBase, ativo: true } }),
    prisma.funcionario.count({ where: { ...whereBase, ativo: false } }),
    prisma.funcionario.count({ where: { ...whereBase, cargo: "GERENTE" } }),
    prisma.funcionario.count({ where: { ...whereBase, cargo: "COLABORADOR" } }),
  ]);

  return NextResponse.json({
    funcionarios,
    paginacao: {
      pagina: filtros.pagina,
      por_pagina: filtros.por_pagina,
      total,
      total_paginas: Math.max(1, Math.ceil(total / filtros.por_pagina)),
    },
    kpis: {
      total: ativos + inativos,
      ativos,
      inativos,
      gerentes,
      colaboradores,
    },
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  if (!podeVerEquipe(auth.sessao)) {
    return respostaSemPermissao();
  }

  const permissao = podeAdicionarFuncionario(auth.sessao);
  if (!permissao.pode) {
    return respostaSemPermissao();
  }

  const bodyResult = await parseJson<PayloadCriacaoFuncionarioBruto>(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }
  const payloadCriacao = validarPayloadCriacaoFuncionario(bodyResult.data);
  if (!payloadCriacao.ok) {
    return badRequest(payloadCriacao.erro);
  }
  const { nome, email, senha, cargo } = payloadCriacao.data;
  let { id_pdv } = payloadCriacao.data;

  if (auth.sessao.perfil === "GERENTE") {
    if (!auth.sessao.id_pdv || !podeAdicionarColaboradorNoPdv(auth.sessao, cargo, id_pdv)) {
      return responderGerenteForaDoPdv();
    }
  }

  if (permissao.idPdvPermitido) {
    id_pdv = permissao.idPdvPermitido;
  }

  if (!["COLABORADOR", "GERENTE", "ADMINISTRADOR"].includes(cargo)) {
    return NextResponse.json({ erro: "Cargo invalido." }, { status: 400 });
  }

  const pdv = await prisma.pdv.findFirst({
    where: { id: id_pdv, id_empresa: auth.sessao.id_empresa },
  });

  if (!pdv) {
    return notFound("PDV nao encontrado.");
  }

  const emailExistente = await prisma.funcionario.findFirst({
    where: { email, id_empresa: auth.sessao.id_empresa },
    select: { id: true },
  });

  if (emailExistente) {
    return NextResponse.json({ erro: "Email ja cadastrado." }, { status: 409 });
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  try {
    const funcionario = await prisma.funcionario.create({
      data: {
        id: randomUUID(),
        id_empresa: auth.sessao.id_empresa,
        id_pdv,
        nome,
        email,
        senha_hash,
        cargo,
      },
      include: {
        Pdv: { select: { id: true, nome: true } },
      },
    }) as unknown as FuncionarioListagemItem;

    return NextResponse.json({
      funcionario,
      criado: {
        id: funcionario.id,
        id_pdv: funcionario.id_pdv,
        ativo: funcionario.ativo,
        cargo: funcionario.cargo,
        pdv: funcionario.Pdv,
      },
    });
  } catch (erro: unknown) {
    const prismaErro = erro as { code?: string };
    if (prismaErro.code === "P2002") {
      return NextResponse.json({ erro: "Email ja cadastrado." }, { status: 409 });
    }
    throw erro;
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  if (!podeExecutarAcoesEmLote(auth.sessao)) {
    return respostaSemPermissao();
  }

  const bodyResult = await parseJson<unknown>(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }
  const validacao = validateBody(schemaAcaoLoteFuncionarios, bodyResult.data);

  if (!validacao.ok) {
    return validacao.response;
  }

  const payload = validacao.data as PayloadAcaoLoteFuncionarios;
  const ids = [...new Set(payload.ids)];
  const precondicoes = validarPrecondicoesAcaoLoteFuncionario(payload);
  if (!precondicoes.ok) {
    return badRequest(precondicoes.erro);
  }

  if (payload.id_pdv) {
    const pdvExiste = await prisma.pdv.findFirst({
      where: { id: payload.id_pdv, id_empresa: auth.sessao.id_empresa },
      select: { id: true },
    });

    if (!pdvExiste) {
      return notFound("PDV nao encontrado.");
    }
  }

  const destinoInativacao = payload.id_funcionario_destino
    ? await prisma.funcionario.findFirst({
        where: {
          id: payload.id_funcionario_destino,
          id_empresa: auth.sessao.id_empresa,
          ativo: true,
        },
        select: { id: true, nome: true, id_pdv: true, cargo: true },
      })
    : null as DestinoInativacaoFuncionario | null;

  if (payload.acao === "INATIVAR" && !destinoInativacao) {
    return badRequest("Destino invalido para reatribuicao.");
  }

  const funcionarios = await prisma.funcionario.findMany({
    where: {
      id_empresa: auth.sessao.id_empresa,
      id: { in: ids },
    },
    select: {
      id: true,
      nome: true,
      cargo: true,
      id_pdv: true,
      ativo: true,
    },
  }) as FuncionarioAcaoLoteItem[];

  if (auth.sessao.perfil === "GERENTE") {
    if (!auth.sessao.id_pdv) {
      return respostaSemPermissao();
    }

    if (payload.acao === "ALTERAR_PDV" && payload.id_pdv && payload.id_pdv !== auth.sessao.id_pdv) {
      return responderMovimentacaoPdvNegada();
    }

    if (payload.acao === "ALTERAR_CARGO" && payload.cargo !== "COLABORADOR") {
      return responderAlteracaoCargoNegada();
    }

    if (payload.acao === "INATIVAR" && destinoInativacao && !podeGerenciarRecursoNoPdv(auth.sessao, destinoInativacao.id_pdv)) {
      return responderDestinoInativacaoNegado();
    }
  }

  const resultado = await processarAcaoLoteFuncionarios({
    sessao: auth.sessao as SessaoFuncionariosRoute,
    ids,
    payload,
    funcionarios,
    destinoInativacao,
  });

  return NextResponse.json({
    ok: resultado.falhas.length === 0,
    ...resultado,
  });
}
