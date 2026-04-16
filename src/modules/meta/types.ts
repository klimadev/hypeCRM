import type { SessaoToken } from "@/lib/tipos";

export type MetaCapiConfig = {
  pixelId: string;
  accessToken: string;
  eventName: string;
  ativo: boolean;
};

export type MetaCapiEvento = {
  id: string;
  id_empresa: string;
  id_negocio: string;
  evento_nome: string;
  evento_status: "PENDENTE" | "ENVIADO" | "ERRO";
  idempotency_key: string;
  telefone_hash: string | null;
  payload_json: string;
  resposta_json: string | null;
  erro: string | null;
  tentativas: number;
  criado_em: string;
  atualizado_em: string;
  enviado_em: string | null;
  ciclo_fechamento: number;
};

export type MetaCapiTestResult = {
  pixelId: string;
  automaticoAtivo: boolean;
  eventsReceived: number;
  fbtraceId: string | null;
  messages: unknown[];
  respostaBruta: string;
  erroTipo: string | null;
};

export type UseMetaModuleReturn = {
  config: MetaCapiConfig | null;
  eventos: MetaCapiEvento[];
  carregando: boolean;
  erro: string | null;
  salvarConfig: (config: MetaCapiConfig) => Promise<{ sucesso: boolean; erro?: string }>;
  testarConexao: () => Promise<{ sucesso: boolean; erro?: string; dados?: MetaCapiTestResult }>;
  recarregar: () => Promise<void>;
};

export type ModuloMetaProps = {
  perfil: SessaoToken["perfil"];
};
