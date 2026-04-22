import { z } from "zod";

export const zodFeedbackTipo = z.enum(["BUG", "SUGESTAO"]);
export const zodFeedbackStatus = z.enum(["NOVO", "EM_TRIAGEM", "PLANEJADO", "RESOLVIDO", "DESCARTADO"]);
export const zodFeedbackPrioridade = z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]);
export const zodFeedbackImpacto = z.enum(["bloqueia_operacao", "dificulta", "incoveniente", "sugestao"]);

export type FeedbackTipo = z.infer<typeof zodFeedbackTipo>;
export type FeedbackStatus = z.infer<typeof zodFeedbackStatus>;
export type FeedbackPrioridade = z.infer<typeof zodFeedbackPrioridade>;
export type FeedbackImpacto = z.infer<typeof zodFeedbackImpacto>;

export type FeedbackItem = {
  id: string;
  id_empresa: string;
  id_usuario: string;
  perfil_usuario: string;
  tipo: FeedbackTipo;
  titulo: string;
  descricao: string;
  impacto: string | null;
  status: FeedbackStatus;
  prioridade: FeedbackPrioridade;
  rota_origem: string | null;
  modulo_origem: string | null;
  url_origem: string | null;
  viewport: string | null;
  user_agent: string | null;
  build_ref: string | null;
  nota_interna: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type FeedbackEvento = {
  id: string;
  id_feedback: string;
  acao: string;
  autor_id: string;
  autor_tipo: string;
  de_status: string | null;
  para_status: string | null;
  meta_json: string | null;
  criado_em: string;
};

export type FeedbacksResponse = {
  items: FeedbackItem[];
  total: number;
  pagina: number;
  totalPaginas: number;
};