import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/permissoes";
import { esquemaAtualizarProduto } from "@/lib/validacoes";
import { badRequest, notFound, ok } from "@/lib/api/http";
import { parseJson, validateBody } from "@/lib/api/route-validation";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id } = await params;

  const produto = await prisma.produto.findFirst({
    where: { id, id_empresa: auth.sessao.id_empresa },
    select: {
      id: true,
      id_empresa: true,
      nome: true,
      slug: true,
      descricao: true,
      ativo: true,
      criado_em: true,
      atualizado_em: true,
    },
  });

  if (!produto) {
    return notFound("Produto nao encontrado.");
  }

  return ok({ produto });
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

  const validacao = validateBody(esquemaAtualizarProduto, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const produtoExistente = await prisma.produto.findFirst({
    where: { id, id_empresa: auth.sessao.id_empresa },
    select: { id: true },
  });

  if (!produtoExistente) {
    return notFound("Produto nao encontrado.");
  }

  const dados = validacao.data;
  const data: {
    nome?: string;
    descricao?: string | null;
    ativo?: boolean;
  } = {};

  if (dados.nome !== undefined) data.nome = dados.nome;
  if (dados.descricao !== undefined) data.descricao = dados.descricao ?? null;
  if (dados.ativo !== undefined) data.ativo = dados.ativo;

  const produto = await prisma.produto.update({
    where: { id },
    data,
    select: {
      id: true,
      id_empresa: true,
      nome: true,
      slug: true,
      descricao: true,
      ativo: true,
      criado_em: true,
      atualizado_em: true,
    },
  });

  if (!produto) {
    return badRequest("Nao foi possivel atualizar o produto.");
  }

  return ok({ produto });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id } = await params;
  const produto = await prisma.produto.findFirst({
    where: { id, id_empresa: auth.sessao.id_empresa },
    select: { id: true },
  });

  if (!produto) {
    return notFound("Produto nao encontrado.");
  }

  await prisma.$transaction([
    prisma.negocio.updateMany({
      where: { id_empresa: auth.sessao.id_empresa, id_produto_principal: id },
      data: { id_produto_principal: null },
    }),
    prisma.leadProduto.deleteMany({
      where: { id_empresa: auth.sessao.id_empresa, id_produto: id },
    }),
    prisma.negocioProduto.deleteMany({
      where: { id_empresa: auth.sessao.id_empresa, id_produto: id },
    }),
    prisma.produto.delete({
      where: { id },
    }),
  ]);

  return ok({ ok: true });
}
