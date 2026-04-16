import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, podePersonalizarEstagio, respostaSemPermissao } from "@/lib/permissoes";
import { EsquemaAtualizarEstilosEstagio } from "@/lib/validacoes.crm";
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
  const resultado = EsquemaAtualizarEstilosEstagio.safeParse(body);

  if (!resultado.success) {
    const primeiroErro = resultado.error.issues[0];
    const mensagem = primeiroErro?.message || "Dados inválidos.";
    return badRequest(mensagem);
  }

  const estilosAtuais = estagio.estilos ? JSON.parse(estagio.estilos) : {};
  const novosEstilos = { ...estilosAtuais, ...resultado.data };
  const estilosJson = JSON.stringify(novosEstilos);

  const atualizado = await prisma.estagioFunil.update({
    where: { id: stageId },
    data: {
      estilos: estilosJson,
      atualizado_em: new Date(),
    },
  });

  return NextResponse.json({ estagio: atualizado });
}