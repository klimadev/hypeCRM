import { normalizarStatusInstanciaWhatsapp } from "@/lib/whatsapp-instancia-status";
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
  lastMessage?: {
    key?: {
      remoteJid?: string;
      remoteJidAlt?: string;
      fromMe?: boolean;
    };
    pushName?: string;
    kind?: string;
    text?: string;
    message?: Record<string, unknown>;
  };
};

export function mapearContatoEvolution(chat: EvolutionConversaEntrada): EvolutionContato | null {
  const remoteJid = (chat.remoteJid ?? "").trim();
  if (!remoteJid || remoteJid.includes("@g.us")) return null;

  const remoteJidAlt = chat.remoteJidAlt ?? chat.lastMessage?.key?.remoteJidAlt ?? null;
  const pushName = chat.pushName ?? chat.lastMessage?.pushName ?? null;
  const isGroup = remoteJid.includes("@g.us") || chat.isGroup === true;

  return {
    id: remoteJidAlt ?? remoteJid,
    nome: pushName,
    pushName,
    remoteJidAlt,
    isGroup,
  };
}

export function mapearConversaEvolution(chat: EvolutionConversaEntrada): EvolutionConversa | null {
  const remoteJid = (chat.remoteJid ?? "").trim();
  if (!remoteJid || remoteJid.includes("@g.us")) return null;

  const remoteJidAlt = chat.remoteJidAlt ?? chat.lastMessage?.key?.remoteJidAlt ?? null;

  const pushName = chat.pushName ?? chat.lastMessage?.pushName ?? null;
  const isGroup = remoteJid.includes("@g.us") || chat.isGroup === true;

  const lastMessage = chat.lastMessage
    ? {
        key: {
          remoteJid: chat.lastMessage.key?.remoteJid ?? remoteJid,
          remoteJidAlt: chat.lastMessage.key?.remoteJidAlt ?? undefined,
          fromMe: chat.lastMessage.key?.fromMe ?? false,
        },
        pushName: chat.lastMessage.pushName ?? undefined,
        kind: chat.lastMessage.kind,
        text: chat.lastMessage.text,
        message: chat.lastMessage.message,
      }
    : undefined;

  return {
    remoteJid,
    remoteJidAlt: remoteJidAlt && remoteJidAlt.includes("@s.whatsapp.net") ? remoteJidAlt : null,
    pushName: pushName ?? null,
    isGroup,
    lastMessage,
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

    const remoteJidAlt = msg.key?.remoteJidAlt ?? null;
    const pushName = msg.pushName ?? null;
    const messageTimestamp = msg.messageTimestamp ?? 0;
    const chaveConversa = remoteJid;
    const existente = conversasAgrupadas.get(chaveConversa);

    if (!existente || messageTimestamp > existente.ultimaMensagemTimestamp) {
      conversasAgrupadas.set(chaveConversa, {
        remoteJid,
        remoteJidAlt,
        pushName,
        ultimaMensagemTimestamp: messageTimestamp,
      });
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
