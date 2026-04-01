import { formatarLabelSeparadorData, normalizarTimestampParaDate } from "@/lib/whatsapp-utils";
import type { ChatMessageStatus, WhatsappChatMessage } from "./types";

const statusWeight: Record<ChatMessageStatus, number> = {
  ERROR: 5,
  READ: 4,
  PLAYED: 4,
  DELIVERED: 3,
  DELETED: 3,
  SENT: 2,
  PENDING: 1,
};

export type WhatsappMessageListItem =
  | { type: "separator"; key: string; label: string }
  | { type: "message"; key: string; message: WhatsappChatMessage };

function normalizarLeadId(valor?: string) {
  const normalizado = valor?.trim();
  return normalizado ? normalizado : undefined;
}

function criarChaveData(timestamp: number) {
  const data = normalizarTimestampParaDate(timestamp);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function resolverLeadIdWhatsappChat(params: { leadId?: string; contatoId?: string }) {
  return normalizarLeadId(params.leadId) ?? normalizarLeadId(params.contatoId);
}

export function mergeWhatsappChatMessages(base: WhatsappChatMessage[], incoming: WhatsappChatMessage[]) {
  const map = new Map<string, WhatsappChatMessage>();

  for (const message of [...base, ...incoming]) {
    const key = message.messageId || message.id;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, message);
      continue;
    }

    const stronger = statusWeight[message.status] >= statusWeight[existing.status] ? message.status : existing.status;
    map.set(key, {
      ...existing,
      ...message,
      status: stronger,
      optimistic: existing.optimistic && message.optimistic,
      error: message.error ?? existing.error,
    });
  }

  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

export function criarItensListaMensagensWhatsapp(messages: WhatsappChatMessage[]): WhatsappMessageListItem[] {
  const itens: WhatsappMessageListItem[] = [];
  let ultimaChaveData: string | null = null;

  for (const message of messages) {
    const chaveData = criarChaveData(message.timestamp);
    if (chaveData !== ultimaChaveData) {
      itens.push({
        type: "separator",
        key: `separator-${chaveData}`,
        label: formatarLabelSeparadorData(message.timestamp),
      });
      ultimaChaveData = chaveData;
    }

    itens.push({
      type: "message",
      key: message.messageId || message.id,
      message,
    });
  }

  return itens;
}
