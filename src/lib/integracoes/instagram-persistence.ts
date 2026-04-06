import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { InstagramMensagemNormalizada } from "./instagram-normalization";
import { mapearMensagemInstagramDbParaInbox } from "./instagram-normalization";

export type InstagramMensagemPreviewPersistida = {
  conversationId: string;
  conteudo: string | null;
  fromMe: boolean;
  kind: string;
  timestamp: number;
  hasMedia: boolean;
  mediaUrl: string | null;
};

export function erroTabelaInstagramMensagemAusente(erro: unknown) {
  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2021") {
    return true;
  }

  const mensagem = erro instanceof Error ? erro.message : String(erro);
  return mensagem.includes("InstagramMensagem") && mensagem.toLowerCase().includes("no such table");
}

export async function upsertMensagensInstagramNoBanco(
  tx: Prisma.TransactionClient | typeof prisma,
  input: {
    idEmpresa: string;
    idInstagramConta: string;
    mensagens: InstagramMensagemNormalizada[];
  },
) {
  if (input.mensagens.length === 0) {
    return { criadas: 0, duplicadas: 0, criadasIds: new Set<string>() };
  }

  const ids = input.mensagens.map((mensagem) => mensagem.messageId);
  const existentes = await tx.instagramMensagem.findMany({
    where: {
      id_instagram_conta: input.idInstagramConta,
      mensagem_id: { in: ids },
    },
    select: {
      mensagem_id: true,
    },
  });

  const idsExistentes = new Set(existentes.map((item: { mensagem_id: string }) => item.mensagem_id));
  const paraCriar = input.mensagens
    .filter((mensagem) => !idsExistentes.has(mensagem.messageId))
    .map((mensagem) => ({
      id: randomUUID(),
      id_empresa: input.idEmpresa,
      id_instagram_conta: input.idInstagramConta,
      conversation_id: mensagem.conversationId,
      mensagem_id: mensagem.messageId,
      participant_id: mensagem.participantId,
      participant_name: mensagem.participantName,
      participant_username: mensagem.participantUsername,
      from_me: mensagem.fromMe,
      tipo: mensagem.kind,
      conteudo: mensagem.text,
      timestamp: mensagem.timestamp,
      payload_json: JSON.stringify({ attachments: mensagem.attachments }),
      erro: null,
    }));

  if (paraCriar.length > 0) {
    await tx.instagramMensagem.createMany({ data: paraCriar });
  }

  return {
    criadas: paraCriar.length,
    duplicadas: input.mensagens.length - paraCriar.length,
    criadasIds: new Set(paraCriar.map((mensagem) => mensagem.mensagem_id)),
  };
}

export async function listarMensagensInstagramDoBanco(input: {
  idInstagramConta: string;
  conversationId: string;
  limite: number;
}) {
  const registros = await prisma.instagramMensagem.findMany({
    where: {
      id_instagram_conta: input.idInstagramConta,
      conversation_id: input.conversationId,
    },
    orderBy: { timestamp: "desc" },
    take: input.limite,
  });

  return registros
    .slice()
    .reverse()
    .map(mapearMensagemInstagramDbParaInbox);
}

export async function listarUltimasMensagensInstagramDoBanco(input: {
  idInstagramConta: string;
  conversationIds: string[];
}) {
  if (input.conversationIds.length === 0) {
    return new Map<string, InstagramMensagemPreviewPersistida>();
  }

  const registros = await prisma.instagramMensagem.findMany({
    where: {
      id_instagram_conta: input.idInstagramConta,
      conversation_id: { in: input.conversationIds },
    },
    orderBy: [
      { conversation_id: "asc" },
      { timestamp: "desc" },
    ],
  });

  const previews = new Map<string, InstagramMensagemPreviewPersistida>();

  for (const registro of registros) {
    if (previews.has(registro.conversation_id)) {
      continue;
    }

    const mensagem = mapearMensagemInstagramDbParaInbox(registro);
    previews.set(registro.conversation_id, {
      conversationId: registro.conversation_id,
      conteudo: registro.conteudo,
      fromMe: registro.from_me,
      kind: registro.tipo,
      timestamp: registro.timestamp,
      hasMedia: mensagem.attachments.length > 0,
      mediaUrl: mensagem.attachments[0]?.url ?? null,
    });
  }

  return previews;
}
