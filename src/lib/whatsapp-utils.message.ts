import type { ChatMessageStatus } from "@/modules/whatsapp/types";
import type { ResultadoExtracaoNome, TextoExtraido } from "./whatsapp-utils.types";

export const MAPEAMENTO_TIPOS_MENSAGEM: Record<string, string> = {
  conversation: "Texto",
  extendedTextMessage: "Texto",
  imageMessage: "Imagem",
  videoMessage: "Vídeo",
  audioMessage: "Áudio",
  documentMessage: "Arquivo",
  stickerMessage: "Sticker",
  reactionMessage: "Reação",
  locationMessage: "Localização",
  contactsArrayMessage: "Contato",
  contactsMessage: "Contato",
  listMessage: "Lista",
  buttonsMessage: "Botões",
  templateMessage: "Template",
  groupInviteMessage: "Convite de Grupo",
  ephemeralMessage: "Ephemeral",
  orderMessage: "Pedido",
  paymentInviteMessage: "Pagamento",
  liveLocationMessage: "Localização ao Vivo",
  pollingCreationMessage: "Enquete",
  futureproofMessage: "Mensagem Futura",
  unknown: "Desconhecido",
};

export function traduzirTipoMensagem(messageType: string | null | undefined): string {
  if (!messageType) return "Desconhecido";
  return MAPEAMENTO_TIPOS_MENSAGEM[messageType] ?? "Desconhecido";
}

export function formatarPreviewMensagem(tipo: string | null | undefined, conteudo: string | null | undefined): string {
  const texto = conteudo?.trim();
  if (texto) return texto;
  const tipoNormalizado = (tipo ?? "").trim();
  if (!tipoNormalizado || tipoNormalizado === "conversation" || tipoNormalizado === "extendedTextMessage") return "[Mensagem]";
  return `[${traduzirTipoMensagem(tipoNormalizado)}]`;
}

export function extrairNomeDoLead(mensagem: Record<string, unknown>, telefoneFormatado?: string): ResultadoExtracaoNome {
  const key = (mensagem.key ?? {}) as Record<string, unknown>;
  const pushName = mensagem.pushName as string | null | undefined;
  const fromMe = Boolean(key.fromMe);

  if (!fromMe && pushName && pushName.trim().length > 0) {
    return { nome: pushName.trim(), origem: "pushName", confianca: "alta" };
  }

  return {
    nome: telefoneFormatado ?? "Sem nome",
    origem: telefoneFormatado ? "telefone" : "chat",
    confianca: telefoneFormatado ? "media" : "baixa",
  };
}

export function mapearStatusMensagemCru(rawStatus: unknown, fromMe: boolean): ChatMessageStatus {
  if (typeof rawStatus !== "string") return fromMe ? "SENT" : "DELIVERED";

  const normalized = rawStatus.toUpperCase();
  if (normalized.includes("ERROR") || normalized.includes("FAIL")) return "ERROR";
  if (normalized.includes("READ")) return "READ";
  if (normalized.includes("PLAYED")) return "PLAYED";
  if (normalized.includes("DELETE")) return "DELETED";
  if (normalized.includes("DELIVER")) return "DELIVERED";
  if (normalized.includes("SENT") || normalized.includes("SERVER_ACK")) return "SENT";
  if (normalized.includes("PENDING")) return "PENDING";
  return fromMe ? "SENT" : "DELIVERED";
}

export function extrairTextoMensagem(payload: Record<string, unknown>): TextoExtraido {
  const message = payload.message as Record<string, unknown> | undefined;
  if (!message || typeof message !== "object") return { kind: "unsupported", text: "" };
  if (typeof message.conversation === "string") return { kind: "text", text: message.conversation };

  const extended = message.extendedTextMessage as Record<string, unknown> | undefined;
  if (extended && typeof extended.text === "string") return { kind: "text", text: extended.text };

  const imageMsg = message.imageMessage as Record<string, unknown> | undefined;
  if (imageMsg && typeof imageMsg.caption === "string") return { kind: "text", text: imageMsg.caption };

  const videoMsg = message.videoMessage as Record<string, unknown> | undefined;
  if (videoMsg && typeof videoMsg.caption === "string") return { kind: "text", text: videoMsg.caption };

  return { kind: "unsupported", text: "[Mensagem não suportada]" };
}
