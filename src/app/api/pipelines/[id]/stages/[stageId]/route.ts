import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, podePersonalizarEstagio, respostaSemPermissao } from "@/lib/permissoes";
import { EsquemaAtualizarEstagio } from "@/lib/validacoes.crm";
import { badRequest, notFound } from "@/lib/api/http";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id: pipelineId, stageId } = await params;
  const sessao = auth.sessao;

  const permissao = await podePersonalizarEstagio(sessao, stageId);
  if (!permissao.pode) {
    return respostaSemPermissao();
  }

  const estagio = await prisma.estagioFunil.findUnique({
    where: { id: stageId },
  });

  if (!estagio || estagio.id_funil !== pipelineId) {
    return notFound("Estágio não encontrado.");
  }

  const body = await request.json();
  const resultado = EsquemaAtualizarEstagio.safeParse(body);

  if (!resultado.success) {
    const primeiroErro = resultado.error.issues[0];
    const mensagem = primeiroErro?.message || "Dados inválidos.";
    return badRequest(mensagem);
  }

  const { nome, tipo } = resultado.data;

  const atualizado = await prisma.estagioFunil.update({
    where: { id: stageId },
    data: {
      nome: nome ?? estagio.nome,
      tipo: tipo ?? estagio.tipo,
      atualizado_em: new Date(),
    },
  });

  return NextResponse.json({ estagio: atualizado });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const sessao = auth.sessao;
  const permissao = await podePersonalizarEstagio(sessao, (await params).stageId);
  if (!permissao.pode) {
    return respostaSemPermissao();
  }

  const { id: pipelineId, stageId } = await params;

  const estagio = await prisma.estagioFunil.findUnique({
    where: { id: stageId },
  });

  if (!estagio || estagio.id_funil !== pipelineId) {
    return notFound("Estágio não encontrado.");
  }

  const qtdNegocios = await prisma.negocio.count({
    where: { id_estagio: stageId },
  });

  if (qtdNegocios > 0) {
    return badRequest(
      `Este estágio possui ${qtdNegocios} negócio(s) vinculado(s). Remova ou mova os negócios antes de excluir.`
    );
  }

  await prisma.estagioFunil.delete({
    where: { id: stageId },
  });

  return NextResponse.json({ sucesso: true });
}