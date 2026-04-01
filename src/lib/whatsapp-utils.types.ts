export type ResultadoExtracaoNome = {
  nome: string;
  origem: "pushName" | "chat" | "telefone";
  confianca: "alta" | "media" | "baixa";
};

export type DadosAd = {
  titulo: string | null;
  corpo: string | null;
  urlOrigem: string | null;
  idConversao: string | null;
  urlThumbnail: string | null;
  tipoOrigem: string | null;
  appOrigem: string | null;
  formato: "ctwa" | null;
} | null;

export interface EvolutionMensagemCrua {
  id: string;
  key: {
    id: string;
    fromMe: boolean;
    remoteJid: string;
    participant?: string;
    remoteJidAlt: string;
    addressingMode: string;
  };
  pushName: string;
  messageType: string;
  message: Record<string, unknown>;
  messageTimestamp: number;
  instanceId: string;
  source: string;
  contextInfo: Record<string, unknown> | null;
  MessageUpdate?: Array<Record<string, unknown>>;
}

export interface EvolutionMensagensResponse {
  messages?: {
    records: EvolutionMensagemCrua[];
    pages?: number;
    total?: number;
  };
}

export interface EvolutionFindMessagesWhere {
  key?: {
    remoteJid?: string;
    remoteJidAlt?: string;
  };
}

export type TextoExtraido = {
  kind: "text" | "unsupported";
  text: string;
};
