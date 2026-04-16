import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, podeGerenciarEmpresa, respostaSemPermissao } from "@/lib/permissoes";
import { EsquemaReordenarEstagios } from "@/lib/validacoes.crm";
import { badRequest, notFound } from "@/lib/api/http";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  if (!podeGerenciarEmpresa(auth.sessao)) {
    return respostaSemPermissao();
  }

  const { id: pipelineId } = await params;

  const pipeline = await prisma.funil.findFirst({
    where: { id: pipelineId, id_empresa: auth.sessao.id_empresa, ativo: true },
    select: { id: true },
  });

  if (!pipeline) {
    return notFound("Pipeline não encontrado.");
  }

  const body = await request.json().catch(() => ({}));
  const validacao = EsquemaReordenarEstagios.safeParse(body);
  if (!validacao.success) {
    const primeiroErro = validacao.error.issues[0];
    const mensagem = primeiroErro?.message || "Dados inválidos.";
    return badRequest(mensagem);
  }

  const estagios = validacao.data.estagios;

  if (estagios.length === 0) {
    return badRequest("Informe os estágios para reordenação.");
  }

  const idsRecebidos = estagios.map((item) => item.id);
  const estagiosDoFunil = await prisma.estagioFunil.findMany({
    where: { id_funil: pipelineId },
    select: { id: true },
  });

  const idsDoFunil = new Set(estagiosDoFunil.map((item) => item.id));
  const idsForaDoFunil = idsRecebidos.filter((id) => !idsDoFunil.has(id));

  if (idsForaDoFunil.length > 0) {
    return badRequest("Um ou mais estágios não pertencem a este funil.");
  }

  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < estagios.length; index += 1) {
      const item = estagios[index];
      await tx.estagioFunil.update({
        where: { id: item.id },
        data: { ordem: BigInt(item.ordem) },
      });
    }
  });

  return NextResponse.json({ sucesso: true });
}
