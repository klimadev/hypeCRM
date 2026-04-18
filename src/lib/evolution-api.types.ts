export type EvolutionInstance = {
  instanceName: string;
  instanceId: string;
  status: string;
  phoneNumber?: string;
  qrcode?: {
    code: string;
    base64: string;
  };
};

export type EvolutionConnectionState = {
  instanceName: string;
  instanceId?: string;
  status: string;
  connected: boolean;
  phoneNumber: string | null;
  profileName: string | null;
  profilePic: string | null;
};

export type EvolutionQrCode = {
  code: string | null;
  base64: string | null;
  pairingCode: string | null;
  count: number | null;
};

export type EvolutionContato = {
  id: string;
  nome: string | null;
  pushName: string | null;
  remoteJidAlt: string | null;
  isGroup: boolean;
};

export type EvolutionConversa = {
  remoteJid: string;
  remoteJidAlt: string | null;
  pushName: string | null;
  isGroup: boolean;
  messageTimestamp?: number;
  lookupRemoteJid?: string;
  unreadCount?: number;
  updatedAt?: number;
  activityTimestamp?: number;
  lastMessage?: {
    key: {
      remoteJid: string;
      remoteJidAlt?: string;
      fromMe: boolean;
    };
    pushName?: string;
    kind?: string;
    text?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
      imageMessage?: { caption?: string; fileName?: string };
      videoMessage?: { caption?: string; fileName?: string };
      audioMessage?: Record<string, unknown>;
      documentMessage?: { caption?: string; fileName?: string };
      stickerMessage?: Record<string, unknown>;
      reactionMessage?: { text?: string };
      locationMessage?: Record<string, unknown>;
      contactMessage?: Record<string, unknown>;
      listMessage?: Record<string, unknown>;
      buttonsMessage?: Record<string, unknown>;
      templateMessage?: Record<string, unknown>;
      liveLocationMessage?: Record<string, unknown>;
      orderMessage?: Record<string, unknown>;
      protocolMessage?: Record<string, unknown>;
    };
  };
};

export type EvolutionMensagem = {
  remoteJid: string;
  remoteJidAlt: string | null;
  remoteJidAltLastMessage: string | null;
  pushName: string | null;
  messageTimestamp: number;
};

export type CriarInstanciaParams = {
  nome: string;
};
