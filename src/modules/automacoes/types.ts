import {
  FONTES_AUTOMACAO,
  GATILHOS_AUTOMACAO,
  STATUS_AGENDAMENTO,
  TIPOS_ACAO,
} from "@/lib/automacoes/constantes";

export type FonteAutomacao = (typeof FONTES_AUTOMACAO)[keyof typeof FONTES_AUTOMACAO];
export type GatilhoAutomacao = (typeof GATILHOS_AUTOMACAO)[keyof typeof GATILHOS_AUTOMACAO];
export type StatusAgendamento = (typeof STATUS_AGENDAMENTO)[keyof typeof STATUS_AGENDAMENTO];
export type TipoAcao = (typeof TIPOS_ACAO)[keyof typeof TIPOS_ACAO];

export type Automacao = {
  id: string;
  id_empresa: string;
  id_criador: string | null;
  nome: string;
  fonte: FonteAutomacao;
  gatilho: GatilhoAutomacao;
  config_json: string;
  ativo: boolean;
  ultimo_sync_em: string;
  criado_em: string;
  atualizado_em: string;
  acoes: AutomacaoAcao[];
  stats?: {
    total_jobs: number;
    enviados: number;
    falhas: number;
    taxa_sucesso: number;
  };
};

export type AutomacaoAcao = {
  id: string;
  id_automacao: string;
  tipo: TipoAcao;
  ordem: number;
  delay_minutos: number;
  id_instancia_whatsapp: string | null;
  telefone_destino: string | null;
  id_lead_destino: string | null;
  mensagem: string;
};

export type AutomacaoAgendamento = {
  id: string;
  id_automacao: string;
  id_lead: string | null;
  referencia_uid: string;
  tipo_origem: "WHATSAPP";
  contexto_json: string;
  agendado_para: string;
  status: StatusAgendamento;
  tentativas: number;
  erro: string | null;
  enviado_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type DispatchStats = {
  sync_whatsapp: {
    automacoes_processadas: number;
    jobs_criados: number;
    jobs_cancelados: number;
  };
  processados: {
    total: number;
    enviados: number;
    falhas: number;
    em_retry: number;
  };
  duracao_ms: number;
};

export type PassoAutomacaoWizard = 1 | 2 | 3;

export type FormularioAutomacaoWizard = {
  nome: string;
  idEstagioDestino: string;
  idInstanciaWhatsapp: string;
  telefoneDestino: string;
  mensagem: string;
  delayMinutos: number;
};

export type ModoRascunhoAutomacaoWizard = "criacao" | "edicao";

export type RascunhoAutomacaoWizard = {
  versao: 1;
  aberto: boolean;
  passo: PassoAutomacaoWizard;
  modo: ModoRascunhoAutomacaoWizard;
  automacaoId: string | null;
  form: FormularioAutomacaoWizard;
  salvoEm: string;
};

export type ResumoRascunhoAutomacaoWizard = {
  existe: boolean;
  aberto: boolean;
  modo: ModoRascunhoAutomacaoWizard;
  automacaoId: string | null;
  nome: string;
  salvoEm: string | null;
};

export type ConfigStageChange = {
  id_estagio_destino?: string;
};

export type AcaoForm = {
  tipo: TipoAcao;
  ordem: number;
  delay_minutos: number;
  id_instancia_whatsapp?: string;
  telefone_destino?: string;
  id_lead_destino?: string;
  mensagem: string;
};

export type AutomacaoForm = {
  nome: string;
  fonte: FonteAutomacao;
  gatilho: GatilhoAutomacao;
  ativo?: boolean;
  acoes: AcaoForm[];
  id_estagio_destino?: string;
};

export type UseAutomacoesReturn = {
  automacoes: Automacao[];
  carregando: boolean;
  erro: string | null;
  criarAutomacao: (dados: AutomacaoForm) => Promise<{ sucesso: boolean; erro?: string }>;
  atualizarAutomacao: (id: string, dados: Partial<AutomacaoForm>) => Promise<{ sucesso: boolean; erro?: string }>;
  excluirAutomacao: (id: string) => Promise<{ sucesso: boolean; erro?: string }>;
  alternarAutomacao: (id: string) => Promise<{ sucesso: boolean; erro?: string }>;
  dispararDispatch: (params?: { only?: string; automacao_id?: string }) => Promise<{ sucesso: boolean; stats?: DispatchStats; erro?: string }>;
  recarregar: () => Promise<void>;
};

export const VARIAVEIS_TEMPLATE = [
  { nome: "lead_nome", descricao: "Nome do lead" },
  { nome: "lead_telefone", descricao: "Telefone do lead" },
  { nome: "lead_email", descricao: "E-mail do lead" },
  { nome: "estagio_anterior", descricao: "Estágio anterior" },
  { nome: "estagio_atual", descricao: "Estágio atual" },
  { nome: "empresa_nome", descricao: "Nome da empresa" },
] as const;
