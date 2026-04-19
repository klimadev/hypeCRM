import { normalizarStatusInstanciaWhatsapp } from "@/lib/whatsapp-instancia-status";
import { extrairLookupParaMensagens, selecionarRemoteJidPreferencial } from "./chat-remote-jid";
import type {
  EvolutionConnectionState,
  EvolutionContato,
  EvolutionConversa,
  EvolutionMensagem,
  EvolutionQrCode,
} from "./evolution-api.types";

export function extrairTelefoneEvolution(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  return raw.replace("@s.whatsapp.net", "").replace("@lid", "");
}

export function normalizarStatusEvolution(raw: unknown): string {
  if (typeof raw !== "string") {
    return "unknown";
  }

  return normalizarStatusInstanciaWhatsapp(raw);
}

export function normalizarQrCodeEvolution(json: Record<string, unknown>): EvolutionQrCode | null {
  const qrcode = (json.qrcode ?? json) as Record<string, unknown>;
  const base64 =
    typeof qrcode.base64 === "string"
      ? qrcode.base64
      : typeof json.base64 === "string"
        ? json.base64
        : null;
  const code =
    typeof qrcode.code === "string"
      ? qrcode.code
      : typeof json.code === "string"
        ? json.code
        : null;
  const pairingCode =
    typeof qrcode.pairingCode === "string"
      ? qrcode.pairingCode
      : typeof json.pairingCode === "string"
        ? json.pairingCode
        : null;
  const count =
    typeof qrcode.count === "number"
      ? qrcode.count
      : typeof json.count === "number"
        ? json.count
        : null;

  if (!base64 && !code && !pairingCode) {
    return null;
  }

  return { code, base64, pairingCode, count };
}

type EvolutionConversaEntrada = {
  remoteJid?: string;
  remoteJidAlt?: string | null;
  pushName?: string | null;
  isGroup?: boolean;
  unreadCount?: number;
  updatedAt?: number;
  messageTimestamp?: number;
  lastMessage?: {
    key?: {
      remoteJid?: string;
      remoteJidAlt?: string;
      fromMe?: boolean;
    };
    pushName?: string;
    kind?: string;
    text?: string;
    messageTimestamp?: number;
    message?: Record<string, unknown>;
  };
};

export function mapearContatoEvolution(chat: EvolutionConversaEntrada): EvolutionContato | null {
  const remoteJid = (chat.remoteJid ?? "").trim();
  if (!remoteJid || remoteJid.includes("@g.us")) return null;

  const rawRemoteJidAlt = chat.remoteJidAlt ?? chat.lastMessage?.key?.remoteJidAlt ?? null;
  const remoteJidAlt = typeof rawRemoteJidAlt === "string" && rawRemoteJidAlt.trim().length > 0 ? rawRemoteJidAlt.trim() : null;
  const pushName = chat.pushName ?? chat.lastMessage?.pushName ?? null;
  const isGroup = remoteJid.includes("@g.us") || chat.isGroup === true;
  const lookupRemoteJid = extrairLookupParaMensagens(remoteJid, remoteJidAlt);
  const remoteJidAltCanonico = lookupRemoteJid.includes("@s.whatsapp.net") ? lookupRemoteJid : remoteJidAlt;

  return {
    id: lookupRemoteJid,
    nome: pushName,
    pushName,
    remoteJidAlt: remoteJidAltCanonico,
    isGroup,
  };
}

export function mapearConversaEvolution(chat: EvolutionConversaEntrada): EvolutionConversa | null {
  const remoteJid = (chat.remoteJid ?? "").trim();
  if (!remoteJid || remoteJid.includes("@g.us")) return null;

  const rawRemoteJidAlt = chat.remoteJidAlt ?? chat.lastMessage?.key?.remoteJidAlt ?? null;
  const remoteJidAlt = typeof rawRemoteJidAlt === "string" && rawRemoteJidAlt.trim().length > 0 ? rawRemoteJidAlt.trim() : null;
  const pushName = chat.pushName ?? chat.lastMessage?.pushName ?? null;
  const isGroup = remoteJid.includes("@g.us") || chat.isGroup === true;

  const rawRemoteJid = chat.remoteJid ?? "";
  const lookupRemoteJid = extrairLookupParaMensagens(rawRemoteJid, remoteJidAlt);
  const remoteJidAltCanonico = lookupRemoteJid.includes("@s.whatsapp.net") ? lookupRemoteJid : remoteJidAlt;

  const unreadCount = typeof chat.unreadCount === "number" ? chat.unreadCount : 0;
  const updatedAt = typeof chat.updatedAt === "number" ? chat.updatedAt : undefined;
  const messageTimestamp = typeof chat.messageTimestamp === "number" ? chat.messageTimestamp : undefined;

  const lastMessageTimestamp = typeof chat.lastMessage?.messageTimestamp === "number" ? chat.lastMessage.messageTimestamp : undefined;
  const updatedAtTimestamp = typeof updatedAt === "number" ? Math.floor(updatedAt / 1000) : undefined;
  const activityTimestamp = messageTimestamp ?? lastMessageTimestamp ?? updatedAtTimestamp ?? 0;

  const lastMessage = chat.lastMessage
    ? {
        key: {
          remoteJid: chat.lastMessage.key?.remoteJid ?? lookupRemoteJid,
          remoteJidAlt: chat.lastMessage.key?.remoteJidAlt ?? remoteJidAltCanonico ?? undefined,
          fromMe: chat.lastMessage.key?.fromMe ?? false,
        },
        pushName: chat.lastMessage.pushName ?? undefined,
        kind: chat.lastMessage.kind,
        text: chat.lastMessage.text,
        message: chat.lastMessage.message,
      }
    : undefined;

    return {
      remoteJid: lookupRemoteJid,
      remoteJidAlt: remoteJidAltCanonico,
      pushName: pushName ?? null,
      isGroup,
    lastMessage,
    lookupRemoteJid,
    unreadCount,
    updatedAt,
    activityTimestamp,
  };
}

export function agruparConversasPorBuscaEvolution(
  registros: Array<{
    key?: { remoteJid?: string; remoteJidAlt?: string; fromMe?: boolean };
    pushName?: string | null;
    messageTimestamp?: number;
  }>,
) {
  const conversasAgrupadas = new Map<
    string,
    {
      remoteJid: string;
      remoteJidAlt: string | null;
      pushName: string | null;
      ultimaMensagemTimestamp: number;
    }
  >();

  for (const msg of registros) {
    const remoteJid = msg.key?.remoteJid ?? "";
    if (!remoteJid || remoteJid.includes("@g.us") || remoteJid === "status@broadcast") {
      continue;
    }

    const remoteJidAlt = typeof msg.key?.remoteJidAlt === "string" && msg.key.remoteJidAlt.trim().length > 0 ? msg.key.remoteJidAlt.trim() : null;
    const pushName = msg.key?.fromMe === false && msg.pushName ? msg.pushName : null;
    const messageTimestamp = msg.messageTimestamp ?? 0;
    const chaveConversa = extrairLookupParaMensagens(remoteJid, remoteJidAlt);
    const remoteJidPreferencial = selecionarRemoteJidPreferencial(remoteJid, remoteJidAlt);
    const remoteJidAltCanonico = chaveConversa.includes("@s.whatsapp.net") ? chaveConversa : remoteJidAlt;
    const existente = conversasAgrupadas.get(chaveConversa);

    if (!existente) {
      conversasAgrupadas.set(chaveConversa, {
        remoteJid: remoteJidPreferencial,
        remoteJidAlt: remoteJidAltCanonico,
        pushName,
        ultimaMensagemTimestamp: messageTimestamp,
      });
    } else {
      if (messageTimestamp > existente.ultimaMensagemTimestamp) {
        existente.ultimaMensagemTimestamp = messageTimestamp;
      }
      if (pushName && (!existente.pushName || existente.pushName === "Você")) {
        existente.pushName = pushName;
      }
      if (remoteJidAltCanonico && (!existente.remoteJidAlt || existente.remoteJidAlt.includes("@lid"))) {
        existente.remoteJidAlt = remoteJidAltCanonico;
      }
      if (remoteJidPreferencial.includes("@s.whatsapp.net") && existente.remoteJid.includes("@lid")) {
        existente.remoteJid = remoteJidPreferencial;
      }
    }
  }

  return Array.from(conversasAgrupadas.values())
    .sort((a, b) => b.ultimaMensagemTimestamp - a.ultimaMensagemTimestamp)
    .map((conversa) => ({
      remoteJid: conversa.remoteJid,
      remoteJidAlt: conversa.remoteJidAlt,
      pushName: conversa.pushName,
      isGroup: false,
    })) satisfies EvolutionConversa[];
}

export function deduplicarMensagensPorContatoEvolution(mensagens: EvolutionMensagem[]) {
  return mensagens;
}

export function montarEstadoConexaoEvolution(
  instanceName: string,
  json: Record<string, unknown>,
  conectado: boolean,
): EvolutionConnectionState {
  const data = (json.instance ?? json) as Record<string, unknown>;
  const status = normalizarStatusEvolution(data.state ?? data.status ?? json.state ?? json.status);
  const phoneNumber = extrairTelefoneEvolution(data.owner ?? data.phoneNumber ?? json.owner ?? json.phoneNumber);

  return {
    instanceName:
      typeof data.instanceName === "string"
        ? data.instanceName
        : typeof json.instanceName === "string"
          ? json.instanceName
          : instanceName,
    instanceId:
      typeof data.instanceId === "string"
        ? data.instanceId
        : typeof json.instanceId === "string"
          ? json.instanceId
          : undefined,
    status,
    connected: conectado,
    phoneNumber,
    profileName:
      typeof data.profileName === "string"
        ? data.profileName
        : typeof json.profileName === "string"
          ? json.profileName
          : null,
    profilePic:
      typeof data.profilePicUrl === "string"
        ? data.profilePicUrl
        : typeof json.profilePicUrl === "string"
          ? json.profilePicUrl
          : null,
  };
}
