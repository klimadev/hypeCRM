export {
  DIAS_ESTAGIO_PARADO,
  DIAS_SEM_RESPOSTA_PENDENCIA,
  LABELS_PENDENCIA,
  TIPOS_PENDENCIA,
  VALOR_MINIMO_ALTO_VALOR,
} from "@/lib/pendencias";
export type { TipoPendencia } from "@/lib/pendencias";

export {
  FONTES_AUTOMACAO,
  GATILHOS_AUTOMACAO,
  STATUS_AGENDAMENTO,
  TIPOS_ACAO,
} from "@/lib/automacoes/constantes";
export type {
  FonteAutomacao,
  GatilhoAutomacao,
  StatusAgendamento,
  TipoAcao,
} from "@/lib/automacoes/constantes";

export * from "@/lib/validacoes.auth";
export * from "@/lib/validacoes.crm";
export * from "@/lib/validacoes.produtos";
export * from "@/lib/validacoes.whatsapp";
export * from "@/lib/validacoes.financeiro";
export * from "@/lib/validacoes.funcionarios";
export * from "@/lib/validacoes.automacoes";
export * from "@/lib/validacoes.utils";
