import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { MensagemNormalizada } from "./whatsapp-chat.types";
import { escolherStatusMaisForte, mapearStatusMensagem } from "./whatsapp-chat.normalization";

export async function upsertMensagensNoBanco(
  tx: Prisma.TransactionClient | typeof prisma,
  params: {
    idEmpresa: string;
    idLead: string;
    idWhatsappInstancia: string;
    mensagens: MensagemNormalizada[];
  },
) {
  if (params.mensagens.length === 0) return;

  const porMensagemId = new Map<string, MensagemNormalizada>();
  for (const mensagem of params.mensagens) {
    const existente = porMensagemId.get(mensagem.messageId);
    if (!existente || mensagem.timestamp >= existente.timestamp) {
      porMensagemId.set(mensagem.messageId, mensagem);
    }
  }

  const mensagensUnicas = Array.from(porMensagemId.values());
  const mensagemIds = mensagensUnicas.map((mensagem) => mensagem.messageId);

  const existentes = await tx.whatsappMensagem.findMany({
    where: {
      id_whatsapp_instancia: params.idWhatsappInstancia,
      mensagem_id: { in: mensagemIds },
    },
    select: {
      id: true,
      mensagem_id: true,
      status: true,
      tipo: true,
      conteudo: true,
      erro: true,
      payload_json: true,
    },
  });

  const existentePorMensagemId = new Map(existentes.map((registro) => [registro.mensagem_id, registro]));

  const paraCriar = mensagensUnicas
    .filter((mensagem) => !existentePorMensagemId.has(mensagem.messageId))
    .map((mensagem) => ({
      id: randomUUID(),
      id_empresa: params.idEmpresa,
      id_lead: params.idLead,
      id_whatsapp_instancia: params.idWhatsappInstancia,
      mensagem_id: mensagem.messageId,
      remote_jid: mensagem.remoteJid,
      from_me: mensagem.fromMe,
      tipo: mensagem.kind,
      conteudo: mensagem.text,
      status: mensagem.status,
      timestamp: mensagem.timestamp,
      erro: mensagem.error,
      payload_json: mensagem.payloadJson,
    }));

  if (paraCriar.length > 0) {
    await tx.whatsappMensagem.createMany({ data: paraCriar });
  }

  for (const mensagem of mensagensUnicas) {
    const existente = existentePorMensagemId.get(mensagem.messageId);
    if (!existente) continue;

    const statusAtual = mapearStatusMensagem(existente.status, mensagem.fromMe);
    const statusFinal = escolherStatusMaisForte(statusAtual, mensagem.status);
    const precisaAtualizar =
      existente.tipo !== mensagem.kind ||
      (existente.conteudo ?? "") !== mensagem.text ||
      existente.status !== statusFinal ||
      (existente.erro ?? null) !== mensagem.error ||
      (existente.payload_json ?? null) !== mensagem.payloadJson;

    if (!precisaAtualizar) continue;

    await tx.whatsappMensagem.update({
      where: { id: existente.id },
      data: {
        tipo: mensagem.kind,
        conteudo: mensagem.text,
        status: statusFinal,
        erro: mensagem.error,
        payload_json: mensagem.payloadJson,
      },
    });
  }
}
