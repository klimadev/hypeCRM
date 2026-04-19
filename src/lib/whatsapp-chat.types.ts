import type { DadosAd } from "@/lib/whatsapp-utils";
import type { ChatMessageStatus } from "@/modules/whatsapp/types";

export type LeadComAcesso = {
  id: string;
  id_empresa: string;
  telefone: string;
  nome: string;
};

export type LeadResolvidoPorTelefone = {
  id: string;
  nome: string;
  telefone: string;
  origem: string | null;
  estagioNome: string | null;
};

export type InstanciaResolvida = {
  pdvId: string;
  pdvNome: string;
  id: string;
  instanceName: string;
};

export type MensagemNormalizada = {
  messageId: string;
  remoteJid: string;
  remoteJidAlt: string | null;
  fromMe: boolean;
  kind:
    | "text"
    | "conversation"
    | "extendedTextMessage"
    | "imageMessage"
    | "videoMessage"
    | "audioMessage"
    | "documentMessage"
    | "stickerMessage"
    | "reactionMessage"
    | "listMessage"
    | "buttonsMessage"
    | "templateMessage"
    | "locationMessage"
    | "contactMessage"
    | "groupInviteMessage"
    | "liveLocationMessage"
    | "orderMessage"
    | "protocolMessage"
    | "unknown";
  tipoLabel: string;
  text: string;
  conteudo: string;
  seconds: number | null;
  pushName: string | null;
  status: ChatMessageStatus;
  timestamp: number;
  timestampIso: string;
  dadosAd: DadosAd;
  error: string | null;
  payloadJson: string;
};

export type MapaContatoMensagem = {
  pushName: string | null;
  dadosAd: DadosAd | null;
  timestamp: number;
  remoteJidAlt: string;
};

export type MapaMensagensContato = Map<string, MapaContatoMensagem>;
