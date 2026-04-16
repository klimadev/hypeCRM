import { normalizarTimestampParaIso, traduzirTipoMensagem, extrairDadosAd } from "@/lib/whatsapp-utils";
import type { ChatMessageStatus, WhatsappChatMessage } from "@/modules/whatsapp/types";
import type { MapaMensagensContato, MensagemNormalizada } from "./whatsapp-chat.types";

function extrairTexto(payload: Record<string, unknown>) {
  const message = payload.message as Record<string, unknown> | undefined;
  if (!message || typeof message !== "object") return { kind: "unknown" as const, text: "" };

  if (typeof message.conversation === "string") {
    return { kind: "conversation" as const, text: message.conversation };
  }

  const extended = message.extendedTextMessage as Record<string, unknown> | undefined;
  if (extended && typeof extended.text === "string") {
    return { kind: "extendedTextMessage" as const, text: extended.text };
  }

  if (message.imageMessage) {
    const img = message.imageMessage as Record<string, unknown>;
    const caption = typeof img.caption === "string" ? img.caption : "[Imagem]";
    return { kind: "imageMessage" as const, text: caption };
  }

  if (message.videoMessage) {
    const vid = message.videoMessage as Record<string, unknown>;
    const caption = typeof vid.caption === "string" ? vid.caption : "[Vídeo]";
    return { kind: "videoMessage" as const, text: caption };
  }

  if (message.audioMessage) return { kind: "audioMessage" as const, text: "[Áudio]" };

  if (message.documentMessage) {
    const doc = message.documentMessage as Record<string, unknown>;
    const fileName = typeof doc.fileName === "string" ? doc.fileName : "Documento";
    return { kind: "documentMessage" as const, text: `[Arquivo: ${fileName}]` };
  }

  if (message.stickerMessage) return { kind: "stickerMessage" as const, text: "[Sticker]" };

  if (message.reactionMessage) {
    const reaction = message.reactionMessage as Record<string, unknown>;
    const emoji = typeof reaction.text === "string" ? reaction.text : "😀";
    return { kind: "reactionMessage" as const, text: `[Reação: ${emoji}]` };
  }

  if (message.listMessage) {
    const list = message.listMessage as Record<string, unknown>;
    const title = typeof list.title === "string" ? list.title : "Lista";
    return { kind: "listMessage" as const, text: `[Lista: ${title}]` };
  }

  if (message.buttonsMessage) {
    const btn = message.buttonsMessage as Record<string, unknown>;
    const content = typeof btn.contentText === "string" ? btn.contentText : "Botões";
    return { kind: "buttonsMessage" as const, text: `[Botões: ${content}]` };
  }

  if (message.templateMessage) return { kind: "templateMessage" as const, text: "[Template]" };

  if (message.locationMessage) {
    const loc = message.locationMessage as Record<string, unknown>;
    const degrees = typeof loc.degreesLatitude === "number" ? `${loc.degreesLatitude}, ${loc.degreesLongitude}` : "Localização";
    return { kind: "locationMessage" as const, text: `[Localização: ${degrees}]` };
  }

  if (message.contactMessage) {
    const contact = message.contactMessage as Record<string, unknown>;
    const name = typeof contact.displayName === "string" ? contact.displayName : "Contato";
    return { kind: "contactMessage" as const, text: `[Contato: ${name}]` };
  }

  if (message.groupInviteMessage) {
    const group = message.groupInviteMessage as Record<string, unknown>;
    const groupName = typeof group.groupName === "string" ? group.groupName : "Grupo";
    return { kind: "groupInviteMessage" as const, text: `[Convite: ${groupName}]` };
  }

  if (message.liveLocationMessage) return { kind: "liveLocationMessage" as const, text: "[Localização ao vivo]" };

  if (message.orderMessage) {
    const order = message.orderMessage as Record<string, unknown>;
    const id = typeof order.orderId === "string" ? order.orderId : "Pedido";
    return { kind: "orderMessage" as const, text: `[Pedido: ${id}]` };
  }

  if (message.protocolMessage) return { kind: "protocolMessage" as const, text: "[Mensagem de sistema]" };

  const tipoEncontrado = Object.keys(message)[0] || "unknown";
  return { kind: "unknown" as const, text: `[${tipoEncontrado}]` };
}

export function mapearStatusMensagem(rawStatus: unknown, fromMe: boolean): ChatMessageStatus {
  if (typeof rawStatus !== "string") {
    return fromMe ? "SENT" : "DELIVERED";
  }

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

function extrairStatusDaMensagem(raw: Record<string, unknown>): unknown {
  const messageUpdate = raw.MessageUpdate;
  if (Array.isArray(messageUpdate) && messageUpdate.length > 0) {
    const statusPriority: Record<string, number> = {
      READ: 4,
      PLAYED: 4,
      DELIVERY_ACK: 3,
      DELIVERED: 3,
      SERVER_ACK: 2,
      SENT: 2,
      PENDING: 1,
    };

    let strongestStatus: string | undefined;
    let highestPriority = 0;

    for (const update of messageUpdate) {
      if (update && typeof update === "object") {
        const status = (update as Record<string, unknown>).status;
        if (typeof status === "string") {
          const priority = statusPriority[status] ?? 0;
          if (priority > highestPriority) {
            highestPriority = priority;
            strongestStatus = status;
          }
        }
      }
    }

    if (strongestStatus) return strongestStatus;
  }

  return raw.status;
}

function forcarArrayMensagens(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((item) => typeof item === "object" && item !== null) as Record<string, unknown>[];
  }

  if (payload && typeof payload === "object") {
    const cast = payload as Record<string, unknown>;
    const candidates = [cast.messages, cast.data, cast.response, cast.result];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.filter((item) => typeof item === "object" && item !== null) as Record<string, unknown>[];
      }

      if (candidate && typeof candidate === "object") {
        const nested = candidate as Record<string, unknown>;
        if (Array.isArray(nested.records)) {
          return nested.records.filter((item) => typeof item === "object" && item !== null) as Record<string, unknown>[];
        }
      }
    }
  }

  return [];
}

export function normalizarMensagensEvolution(payload: unknown): MensagemNormalizada[] {
  return forcarArrayMensagens(payload)
    .map((raw): MensagemNormalizada | null => {
      const key = (raw.key ?? {}) as Record<string, unknown>;
      const remoteJid = typeof key.remoteJid === "string" ? key.remoteJid : "";
      const remoteJidAlt = typeof key.remoteJidAlt === "string" ? key.remoteJidAlt : null;
      const messageId = typeof key.id === "string" ? key.id : "";
      if (!remoteJid || !messageId) return null;

      const fromMe = Boolean(key.fromMe);
      const { kind, text } = extrairTexto(raw);
      const timestampRaw = raw.messageTimestamp;
      const timestamp = Number.parseInt(String(timestampRaw ?? Math.floor(Date.now() / 1000)), 10);
      const extractedStatus = extrairStatusDaMensagem(raw);
      const messageType = raw.messageType as string | null;

      return {
        messageId,
        remoteJid,
        remoteJidAlt,
        fromMe,
        kind,
        tipoLabel: traduzirTipoMensagem(messageType),
        text,
        conteudo: text,
        pushName: typeof raw.pushName === "string" ? raw.pushName : null,
        status: mapearStatusMensagem(extractedStatus, fromMe),
        timestamp: Number.isNaN(timestamp) ? Math.floor(Date.now() / 1000) : timestamp,
        timestampIso: normalizarTimestampParaIso(timestamp),
        dadosAd: extrairDadosAd(raw),
        error: null,
        payloadJson: JSON.stringify(raw),
      };
    })
    .filter((item): item is MensagemNormalizada => item !== null);
}

export function extrairNomeDoLeadDoMapa(mapaMensagens: MapaMensagensContato, remoteJidAlt: string): string | null {
  const dados = mapaMensagens.get(remoteJidAlt);
  if (dados?.pushName && dados.pushName.trim().length > 0) {
    return dados.pushName.trim();
  }
  return null;
}

export function extrairDadosAdDoMapa(mapaMensagens: MapaMensagensContato, remoteJidAlt: string) {
  const dados = mapaMensagens.get(remoteJidAlt);
  return dados?.dadosAd ?? null;
}

export function mapearMensagemDbParaCanonica(registro: {
  id: string;
  id_lead: string | null;
  remote_jid: string;
  from_me: boolean;
  tipo: string;
  conteudo: string | null;
  status: string;
  timestamp: number;
  criado_em: Date;
  lida_no_crm_em: Date | null;
  erro: string | null;
  mensagem_id: string;
}): WhatsappChatMessage {
  const status = mapearStatusMensagem(registro.status, registro.from_me);
  const timestampIso = normalizarTimestampParaIso(registro.timestamp);
  const kind: WhatsappChatMessage["kind"] = registro.tipo === "text" ? "text" : (registro.tipo as WhatsappChatMessage["kind"]) ?? "unsupported";
  const tipoLabel = traduzirTipoMensagem(registro.tipo);
  const tiposComMedia = ["imageMessage", "videoMessage", "audioMessage", "documentMessage", "stickerMessage"];
  const hasMedia = tiposComMedia.includes(kind);

  return {
    id: registro.id,
    messageId: registro.mensagem_id,
    leadId: registro.id_lead ?? "",
    remoteJid: registro.remote_jid,
    remoteJidAlt: null,
    fromMe: registro.from_me,
    direction: registro.from_me ? "outgoing" : "incoming",
    text: registro.conteudo ?? "",
    kind,
    tipoLabel,
    status,
    timestamp: registro.timestamp,
    timestampIso,
    createdAtIso: registro.criado_em.toISOString(),
    readAtIso: registro.lida_no_crm_em ? registro.lida_no_crm_em.toISOString() : null,
    optimistic: false,
    error: registro.erro,
    dadosAd: null,
    hasMedia,
  };
}

const statusWeight: Record<ChatMessageStatus, number> = {
  ERROR: 5,
  READ: 4,
  PLAYED: 4,
  DELIVERED: 3,
  DELETED: 3,
  SENT: 2,
  PENDING: 1,
};

export function escolherStatusMaisForte(atual: ChatMessageStatus, proximo: ChatMessageStatus) {
  return statusWeight[proximo] >= statusWeight[atual] ? proximo : atual;
}
