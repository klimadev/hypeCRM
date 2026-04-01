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
  lastMessage?: {
    key: {
      remoteJid: string;
      remoteJidAlt?: string;
      fromMe: boolean;
    };
    pushName?: string;
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
