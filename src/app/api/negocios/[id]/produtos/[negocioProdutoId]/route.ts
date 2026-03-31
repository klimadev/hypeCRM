import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirSessao, whereNegociosPorPerfil } from "@/lib/permissoes";
import { esquemaAtualizarProdutoNegocio } from "@/lib/validacoes";
import { notFound, ok } from "@/lib/api/http";
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

type Params = {
  params: Promise<{ id: string; negocioProdutoId: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id, negocioProdutoId } = await params;
  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = validateBody(esquemaAtualizarProdutoNegocio, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const wherePermitido = await whereNegociosPorPerfil(auth.sessao);
  const negocioPermitido = await obterNegocioPorId({
    idEmpresa: auth.sessao.id_empresa,
    idNegocio: id,
    whereExtra: wherePermitido,
  });

  if (!negocioPermitido) {
    return notFound("Negocio nao encontrado.");
  }

  const negocioProduto = await prisma.negocioProduto.findFirst({
    where: {
      id: negocioProdutoId,
      id_negocio: id,
      id_empresa: auth.sessao.id_empresa,
    },
    select: { id: true },
  });

  if (!negocioProduto) {
    return notFound("Produto vinculado ao negocio nao encontrado.");
  }

  const dados = validacao.data;
  const atualizado = await prisma.negocioProduto.update({
    where: { id: negocioProdutoId },
    data: {
      valores_layout: dados.valores_layout ? JSON.stringify(dados.valores_layout) : undefined,
      observacoes: dados.observacoes !== undefined ? dados.observacoes ?? null : undefined,
    },
    include: negocioProdutoComProdutoArgs.include,
  });

  return ok({ produto: atualizado });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id, negocioProdutoId } = await params;
  const wherePermitido = await whereNegociosPorPerfil(auth.sessao);

  const negocioPermitido = await obterNegocioPorId({
    idEmpresa: auth.sessao.id_empresa,
    idNegocio: id,
    whereExtra: wherePermitido,
  });

  if (!negocioPermitido) {
    return notFound("Negocio nao encontrado.");
  }

  const negocioProduto = await prisma.negocioProduto.findFirst({
    where: {
      id: negocioProdutoId,
      id_negocio: id,
      id_empresa: auth.sessao.id_empresa,
    },
    select: { id: true },
  });

  if (!negocioProduto) {
    return notFound("Produto vinculado ao negocio nao encontrado.");
  }

  await prisma.negocioProduto.delete({
    where: { id: negocioProdutoId },
  });

  return ok({ ok: true });
}
