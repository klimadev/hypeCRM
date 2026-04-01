import { z } from "zod";
import { normalizarTelefoneParaWhatsapp } from "@/lib/phone";
import { parseHorarioTexto } from "@/lib/parse-horario-texto";

export const STATUS_AUTOMACAO = {
  ATIVA: "ATIVA",
  INATIVA: "INATIVA",
  ERRO_CONFIG: "ERRO_CONFIG",
  ERRO_JOB: "ERRO_JOB",
} as const;

export type StatusAutomacao = typeof STATUS_AUTOMACAO[keyof typeof STATUS_AUTOMACAO];

export const STATUS_JOB = {
  SCHEDULED: "SCHEDULED",
  NOT_SCHEDULED: "NOT_SCHEDULED",
  DELETED: "DELETED",
  FAILED: "FAILED",
} as const;

export type StatusJob = typeof STATUS_JOB[keyof typeof STATUS_JOB];

export const esquemaCriarWhatsappInstancia = z.object({
  nome: z.string().trim().min(3, "Nome da instancia precisa ter pelo menos 3 caracteres."),
});

export const esquemaAtualizarWhatsappInstancia = z.object({
  nome: z.string().trim().min(3, "Nome da instancia precisa ter pelo menos 3 caracteres."),
});

export const esquemaReconectarWhatsappInstancia = z.object({
  forcarQrCode: z.boolean().optional(),
});

export const esquemaInstagramOAuthCallbackQuery = z.object({
  code: z.string().trim().min(1).optional(),
  state: z.string().trim().min(1).optional(),
  error: z.string().trim().min(1).optional(),
  error_reason: z.string().trim().min(1).optional(),
  error_description: z.string().trim().min(1).optional(),
}).refine((dados) => Boolean(dados.code || dados.error), {
  message: "Informe ao menos um code ou error no callback OAuth.",
});

export const esquemaMetaSignedRequest = z.object({
  signed_request: z.string().trim().min(1, "signed_request obrigatorio."),
});

export const esquemaCriarCalComInstancia = z.object({
  nome: z.string().trim().min(3, "Nome da instancia precisa ter pelo menos 3 caracteres."),
  api_key: z.string().trim().min(10, "Chave API invalida."),
});

export const esquemaInstagramOAuthState = z.object({
  id_empresa: z.string().trim().min(1, "Empresa invalida."),
  id_usuario: z.string().trim().min(1, "Usuario invalido."),
  perfil: z.enum(["EMPRESA", "GERENTE", "COLABORADOR"]),
  nonce: z.string().trim().min(1, "State invalido."),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export const EVENTOS_AUTOMACAO_WHATSAPP = ["LEAD_STAGE_CHANGED", "LEAD_FOLLOW_UP"] as const;
export const TIPOS_DESTINO_AUTOMACAO_WHATSAPP = ["FIXO", "LEAD_TELEFONE"] as const;

const esquemaEtapaFollowUp = z.object({
  ordem: z.coerce.number().int().min(1, "Ordem da etapa invalida.").max(50, "Maximo de 50 etapas."),
  delay_minutos: z.coerce.number().int().min(1, "Delay deve ser de no minimo 1 minuto.").max(60 * 24 * 30, "Delay maximo de 30 dias por etapa."),
  mensagem_template: z.string().trim().min(5, "Mensagem da etapa muito curta.").max(1000, "Mensagem da etapa muito longa."),
});

function validarEtapasFollowUp(etapas: Array<{ ordem: number }>, ctx: z.RefinementCtx) {
  const ordens = new Set<number>();
  for (const etapa of etapas) {
    if (ordens.has(etapa.ordem)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["etapas"],
        message: "As ordens das etapas nao podem repetir.",
      });
      break;
    }
    ordens.add(etapa.ordem);
  }
}

export const esquemaCriarAutomacaoWhatsapp = z.object({
  id_whatsapp_instancia: z.string().trim().min(1, "Instancia obrigatoria."),
  evento: z.enum(EVENTOS_AUTOMACAO_WHATSAPP, { message: "Evento invalido." }),
  id_estagio_destino: z.string().trim().optional(),
  tipo_destino: z.enum(TIPOS_DESTINO_AUTOMACAO_WHATSAPP).default("FIXO"),
  telefone_destino: z.string().trim().optional(),
  mensagem: z.string().trim().optional(),
  horario_texto: z.string().trim().max(20, "Horario muito longo.").optional(),
  etapas: z.array(esquemaEtapaFollowUp).max(50, "Maximo de 50 etapas.").optional(),
  ativo: z.boolean().optional(),
}).superRefine((dados, ctx) => {
  if (dados.horario_texto && dados.horario_texto.trim().length > 0) {
    const result = parseHorarioTexto(dados.horario_texto);
    if (!result.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["horario_texto"], message: result.message });
    }
  }

  if (dados.tipo_destino === "FIXO") {
    const telefone = dados.telefone_destino ?? "";
    const normalizado = normalizarTelefoneParaWhatsapp(telefone);
    if (!normalizado.valido) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["telefone_destino"],
        message: "Telefone destino invalido para WhatsApp (use DDI+DDD+numero).",
      });
    }
  }

  if (dados.evento === "LEAD_STAGE_CHANGED") {
    const mensagem = dados.mensagem?.trim() ?? "";
    if (mensagem.length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["mensagem"], message: "Mensagem muito curta." });
    }
  }

  if (dados.evento === "LEAD_FOLLOW_UP") {
    if (!dados.etapas?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["etapas"], message: "Defina ao menos 1 etapa de follow-up." });
      return;
    }

    validarEtapasFollowUp(dados.etapas, ctx);
  }
});

export const esquemaAtualizarAutomacaoWhatsapp = z.object({
  id_whatsapp_instancia: z.string().trim().min(1, "Instancia obrigatoria.").optional(),
  evento: z.enum(EVENTOS_AUTOMACAO_WHATSAPP, { message: "Evento invalido." }).optional(),
  id_estagio_destino: z.string().trim().optional().nullable(),
  tipo_destino: z.enum(TIPOS_DESTINO_AUTOMACAO_WHATSAPP).optional(),
  telefone_destino: z.string().trim().optional().nullable(),
  mensagem: z.string().trim().optional().nullable(),
  horario_texto: z.string().trim().max(20, "Horario muito longo.").optional(),
  ativo: z.boolean().optional(),
  etapas: z.array(esquemaEtapaFollowUp).max(50, "Maximo de 50 etapas.").optional(),
}).superRefine((dados, ctx) => {
  if (dados.horario_texto && dados.horario_texto.trim().length > 0) {
    const result = parseHorarioTexto(dados.horario_texto);
    if (!result.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["horario_texto"], message: result.message });
    }
  }

  if (dados.tipo_destino === "FIXO" && dados.telefone_destino) {
    const normalizado = normalizarTelefoneParaWhatsapp(dados.telefone_destino);
    if (!normalizado.valido) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["telefone_destino"],
        message: "Telefone destino invalido para WhatsApp (use DDI+DDD+numero).",
      });
    }
  }

  if (dados.evento === "LEAD_STAGE_CHANGED") {
    const mensagem = dados.mensagem?.trim() ?? "";
    if (mensagem.length > 0 && mensagem.length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["mensagem"], message: "Mensagem muito curta." });
    }
  }

  if (dados.evento === "LEAD_FOLLOW_UP" && dados.etapas !== undefined) {
    if (!dados.etapas.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["etapas"], message: "Defina ao menos 1 etapa de follow-up." });
      return;
    }

    validarEtapasFollowUp(dados.etapas, ctx);
  }
});

export const esquemaWhatsappChatMessagesQuery = z.object({
  phoneNumber: z.string().trim().optional(),
  leadId: z.string().trim().optional(),
}).refine((data) => data.phoneNumber || data.leadId, {
  message: "Forneça phoneNumber ou leadId.",
});

export const esquemaWhatsappChatConversationsQuery = z.object({
  busca: z.string().trim().optional(),
  cursor: z.string().trim().min(1, "Cursor invalido.").optional(),
  limite: z.coerce.number().int().min(1, "Limite minimo de 1. ").max(50, "Limite maximo de 50.").default(30),
  naoLidas: z.union([z.boolean(), z.enum(["true", "false"])]).transform((valor) => valor === true || valor === "true").default(false),
});

export const esquemaWhatsappChatContextQuery = z.object({
  phoneNumber: z.string().trim().min(1, "Numero de telefone obrigatorio.").optional(),
  leadId: z.string().trim().min(1, "Lead obrigatorio.").optional(),
}).refine((data) => data.phoneNumber || data.leadId, {
  message: "Forneca phoneNumber ou leadId.",
});

export const esquemaWhatsappChatSendMessage = z.object({
  leadId: z.string().trim().min(1, "Lead obrigatorio."),
  text: z.string().trim().min(1, "Mensagem obrigatoria.").max(4096, "Mensagem muito longa."),
  clientTempId: z.string().trim().min(1, "ID temporario obrigatorio."),
});

export const esquemaWhatsappChatMarkRead = z.object({
  leadId: z.string().trim().min(1, "Lead obrigatorio."),
});

export const esquemaWhatsappChatMedia = z.object({
  leadId: z.string().trim().min(1, "Lead obrigatorio."),
  messageId: z.string().trim().min(1, "Message ID obrigatorio."),
});

export const esquemaWebhookLoggerPayload = z.unknown().refine(
  (valor): valor is Record<string, unknown> => typeof valor === "object" && valor !== null && !Array.isArray(valor),
  { message: "Payload do webhook deve ser um objeto JSON." },
);
