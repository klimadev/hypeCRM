export const TIPOS_PENDENCIA = [
  "SEM_RESPOSTA",
  "CARTA_CREDITO_PENDENTE",
  "DOCUMENTOS_PENDENTES",
  "QUEDA_RESERVA",
  "ALTO_VALOR",
  "DOCUMENTO_APROVACAO_PENDENTE",
  "APROVACAO_GERENCIA_PENDENTE",
  "ESTAGIO_PARADO",
] as const;

export type TipoPendencia = (typeof TIPOS_PENDENCIA)[number];

export const LABELS_PENDENCIA: Record<TipoPendencia, string> = {
  SEM_RESPOSTA: "Sem Resposta",
  CARTA_CREDITO_PENDENTE: "Carta de Crédito Pendente",
  DOCUMENTOS_PENDENTES: "Documentos Pendentes",
  QUEDA_RESERVA: "Queda de Reserva",
  ALTO_VALOR: "Alto Valor - Aprovação Necessária",
  DOCUMENTO_APROVACAO_PENDENTE: "Documento de Aprovação (PDF/Link) Pendente",
  APROVACAO_GERENCIA_PENDENTE: "Pendência de Análise da EMPRESA",
  ESTAGIO_PARADO: "Lead Parado no Estágio",
};

export const DIAS_SEM_RESPOSTA_PENDENCIA = 7;
export const DIAS_ESTAGIO_PARADO = 14;
export const VALOR_MINIMO_ALTO_VALOR = 500000;
