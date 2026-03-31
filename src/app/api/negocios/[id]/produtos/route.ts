import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirSessao, whereNegociosPorPerfil } from "@/lib/permissoes";
import { esquemaAnexarProdutoNegocio } from "@/lib/validacoes";
import { badRequest, notFound, ok } from "@/lib/api/http";
import { parseJson, validateBody } from "@/lib/api/route-validation";
import { obterNegocioPorId } from "@/lib/negocios";

const negocioProdutoComProdutoArgs = Prisma.validator<Prisma.NegocioProdutoDefaultArgs>()({
  include: {
    Produto: {
      select: {
        id: true,
        nome: true,
        slug: true,
        ativo: true,
      },
    },
  },
});

type NegocioProdutoPayload = Prisma.NegocioProdutoGetPayload<typeof negocioProdutoComProdutoArgs>;

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

  const produtos: NegocioProdutoPayload[] = await prisma.negocioProduto.findMany({
    where: { id_empresa: auth.sessao.id_empresa, id_negocio: id },
    include: negocioProdutoComProdutoArgs.include,
    orderBy: { criado_em: "desc" },
  });

  return ok({ produtos });
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id } = await params;
  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = validateBody(esquemaAnexarProdutoNegocio, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const dados = validacao.data;
  const wherePermitido = await whereNegociosPorPerfil(auth.sessao);

  const [negocio, produto] = await Promise.all([
    obterNegocioPorId({
      idEmpresa: auth.sessao.id_empresa,
      idNegocio: id,
      whereExtra: wherePermitido,
    }),
    prisma.produto.findFirst({
      where: { id: dados.id_produto, id_empresa: auth.sessao.id_empresa, ativo: true },
      select: {
        id: true,
        nome: true,
        schema_layout: true,
      },
    }),
  ]);

  if (!negocio) {
    return notFound("Negocio nao encontrado.");
  }

  if (!produto) {
    return badRequest("Produto invalido para a empresa.");
  }

  const negocioProduto: NegocioProdutoPayload = await prisma.negocioProduto.create({
    data: {
      id: randomUUID(),
      id_empresa: auth.sessao.id_empresa,
      id_negocio: id,
      id_produto: produto.id,
      nome_snapshot: produto.nome,
      schema_snapshot: produto.schema_layout,
      valores_layout: JSON.stringify(dados.valores_layout),
      observacoes: dados.observacoes ?? null,
    },
    include: negocioProdutoComProdutoArgs.include,
  });

  return ok({ produto: negocioProduto }, 201);
}
