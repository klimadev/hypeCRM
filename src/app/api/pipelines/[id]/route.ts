import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, podeGerenciarEmpresa, respostaSemPermissao } from "@/lib/permissoes";
import { EsquemaAtualizarPipeline } from "@/lib/validacoes.crm";
import { badRequest, notFound } from "@/lib/api/http";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id } = await params;

  const pipeline = await prisma.funil.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      slug: true,
      descricao: true,
      padrao: true,
      ordem: true,
      ativo: true,
    },
  });

  if (!pipeline || pipeline.ativo === false) {
    return notFound("Pipeline não encontrado.");
  }

  const estagios = await prisma.estagioFunil.findMany({
    where: { id_funil: id },
    orderBy: { ordem: "asc" },
    select: {
      id: true,
      nome: true,
      ordem: true,
      tipo: true,
      estilos: true,
    },
  });

  return NextResponse.json({ pipeline, estagios });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  if (!podeGerenciarEmpresa(auth.sessao)) {
    return respostaSemPermissao();
  }

  const { id } = await params;

  const pipeline = await prisma.funil.findUnique({
    where: { id },
  });

  if (!pipeline || pipeline.ativo === false) {
    return notFound("Pipeline não encontrado.");
  }

  const body = await request.json();
  const resultado = EsquemaAtualizarPipeline.safeParse(body);
  
  if (!resultado.success) {
    const primeiroErro = resultado.error.issues[0];
    const mensagem = primeiroErro?.message || "Dados inválidos.";
    return badRequest(mensagem);
  }

  const { nome, descricao, ordem } = resultado.data;

  const atualizado = await prisma.funil.update({
    where: { id },
    data: {
      nome: nome ?? pipeline.nome,
      descricao: descricao !== undefined ? descricao : pipeline.descricao,
      ordem: ordem ?? pipeline.ordem,
      atualizado_em: new Date(),
    },
  });

  return NextResponse.json({ pipeline: atualizado });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  if (!podeGerenciarEmpresa(auth.sessao)) {
    return respostaSemPermissao();
  }

  const { id } = await params;

  const pipeline = await prisma.funil.findUnique({
    where: { id },
  });

  if (!pipeline || pipeline.ativo === false) {
    return notFound("Pipeline não encontrado.");
  }

  const qtdNegocios = await prisma.negocio.count({
    where: { id_funil: id },
  });

  if (qtdNegocios > 0) {
    return badRequest(
      `Este pipeline possui ${qtdNegocios} negócio(s) vinculado(s). Remova ou mova os negócios antes de excluir.`
    );
  }

  await prisma.funil.update({
    where: { id },
    data: { ativo: false },
  });

  await prisma.estagioFunil.updateMany({
    where: { id_funil: id },
    data: { tipo: "" },
  });

  return NextResponse.json({ sucesso: true });
}