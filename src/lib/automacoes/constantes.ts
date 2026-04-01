export const FONTES_AUTOMACAO = {
  WHATSAPP: "WHATSAPP",
} as const;

export type FonteAutomacao = (typeof FONTES_AUTOMACAO)[keyof typeof FONTES_AUTOMACAO];

export const GATILHOS_AUTOMACAO = {
  STAGE_CHANGE: "STAGE_CHANGE",
} as const;

export type GatilhoAutomacao = (typeof GATILHOS_AUTOMACAO)[keyof typeof GATILHOS_AUTOMACAO];

export const STATUS_AGENDAMENTO = {
  PENDENTE: "PENDENTE",
  PROCESSANDO: "PROCESSANDO",
  ENVIADO: "ENVIADO",
  FALHA: "FALHA",
  CANCELADO: "CANCELADO",
} as const;

export type StatusAgendamento = (typeof STATUS_AGENDAMENTO)[keyof typeof STATUS_AGENDAMENTO];

export const TIPOS_ACAO = {
  WHATSAPP_MSG: "WHATSAPP_MSG",
} as const;

export type TipoAcao = (typeof TIPOS_ACAO)[keyof typeof TIPOS_ACAO];
