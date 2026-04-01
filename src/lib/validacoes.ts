import { z } from "zod";
import { normalizarTelefoneParaWhatsapp } from "@/lib/phone";
import { parseHorarioTexto, MENSAGENS_ERRO } from "@/lib/parse-horario-texto";

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

// ============================================
// Constantes de Status de Automação
// ============================================

export const STATUS_AUTOMACAO = {
  ATIVA: "ATIVA",
  INATIVA: "INATIVA",
  ERRO_CONFIG: "ERRO_CONFIG",
  ERRO_JOB: "ERRO_JOB",
} as const;

export const TRIAL_DURACAO_DIAS = 30;
export const MAX_REGISTROS_POR_IP = 3;
export const JANELA_BLOQUEIO_IP_DIAS = 30;

export const STATUS_ASSINATURA = {
  TRIAL: "TRIAL",
  ATIVA: "ATIVA",
  EXPIRADA: "EXPIRADA",
  CANCELADA: "CANCELADA",
} as const;

export const PLANOS = {
  TRIAL: "trial",
  BASICO: "basico",
  PROFISSIONAL: "profissional",
  ENTERPRISE: "enterprise",
} as const;

export type StatusAutomacao = typeof STATUS_AUTOMACAO[keyof typeof STATUS_AUTOMACAO];

export const STATUS_JOB = {
  SCHEDULED: "SCHEDULED",
  NOT_SCHEDULED: "NOT_SCHEDULED",
  DELETED: "DELETED",
  FAILED: "FAILED",
} as const;

export type StatusJob = typeof STATUS_JOB[keyof typeof STATUS_JOB];

// ============================================
// Validação de Horário Textual
// ============================================

/**
 * Schema Zod para validar horário textual com parse automático.
 * Aceita formatos flexíveis: "9h", "09:30", "21h05", etc.
 */
export const esquemaHorarioTexto = z
  .string()
  .trim()
  .min(1, MENSAGENS_ERRO.HORARIO_VAZIO)
  .max(20, MENSAGENS_ERRO.HORARIO_MUITO_LONGO)
  .refine(
    (val) => {
      const result = parseHorarioTexto(val);
      return result.ok;
    },
    {
      message: MENSAGENS_ERRO.HORARIO_FORMATO_INVALIDO,
    }
  );

type HorarioTextoRaw = z.infer<typeof esquemaHorarioTexto>;

/**
 * Converte horário textual para formato normalizado HH:mm.
 * Retorna null se inválido.
 */
export function normalizarHorarioSchema(val: HorarioTextoRaw): string | null {
  const result = parseHorarioTexto(val);
  return result.ok ? result.normalized : null;
}

export type HorarioTexto = string;

export const esquemaLogin = z.object({
  email: z.string().trim().email("E-mail invalido."),
  senha: z.string().min(1, "Senha obrigatoria."),
});

export const esquemaCadastroEmpresa = z.object({
  nome: z.string().trim().min(2, "Nome da empresa deve ter ao menos 2 caracteres."),
  email: z.string().trim().email("E-mail invalido."),
  senha: z.string().min(6, "Senha precisa ter ao menos 6 caracteres."),
});

export const esquemaCriarLead = z.object({
  nome: z.string().trim().min(2, "Nome do lead deve ter ao menos 2 caracteres."),
  telefone: z
    .string()
    .trim()
    .refine((valor) => valor.replace(/\D/g, "").length >= 10, "Telefone invalido."),
  email: z.string().trim().email("E-mail invalido.").optional().nullable(),
  fonte: z.string().trim().optional(),
  empresa_origem: z.string().trim().optional(),
  id_funcionario: z.string().trim().min(1, "Funcionario obrigatorio."),
  observacoes: z.string().trim().max(5000, "Observacoes muito longas.").optional().nullable(),
  origem: z.enum(["MANUAL", "SINCRONIZACAO_WHATSAPP", "ANUNCIO_CTWA"]).optional(),
  anuncio_titulo: z.string().trim().max(255, "Titulo do anuncio muito longo.").optional().nullable(),
  anuncio_descricao: z.string().trim().max(1000, "Descricao do anuncio muito longa.").optional().nullable(),
  anuncio_url: z.string().trim().url("URL do anuncio invalida.").optional().nullable(),
  dados_extras: z.string().trim().optional().nullable(),
});

export const esquemaCriarNegocio = z.object({
  titulo: z.string().trim().min(2, "Titulo do negocio deve ter ao menos 2 caracteres."),
  valor_estimado: z.number().min(0, "Valor estimado nao pode ser negativo."),
  id_funil: z.string().trim().min(1, "Funil obrigatorio.").optional(),
  id_estagio: z.string().trim().min(1, "Estagio obrigatorio."),
  id_funcionario: z.string().trim().min(1, "Funcionario obrigatorio."),
  lead_ids: z.array(z.string().trim().min(1)).max(100, "Maximo de 100 leads por negocio.").optional(),
  probabilidade: z.number().min(0).max(1).optional(),
  observacoes_comerciais: z.string().trim().max(5000, "Observacoes comerciais muito longas.").optional().nullable(),
  motivo_perda: z.string().trim().max(1000, "Motivo da perda muito longo.").optional().nullable(),
});

export const TIPOS_CAMPO_PRODUTO = [
  "texto",
  "textarea",
  "numero",
  "moeda",
  "telefone",
  "boolean",
  "select",
  "data",
  "imagem",
] as const;

export const esquemaOpcaoCampoProduto = z.object({
  label: z.string().trim().min(1, "Label da opcao obrigatorio."),
  value: z.string().trim().min(1, "Valor da opcao obrigatorio."),
});

export const esquemaCampoProduto = z.object({
  id: z.string().trim().min(1, "Identificador do campo obrigatorio."),
  tipo: z.enum(TIPOS_CAMPO_PRODUTO, { message: "Tipo de campo invalido." }),
  label: z.string().trim().min(1, "Nome do campo obrigatorio."),
  obrigatorio: z.boolean().default(false),
  placeholder: z.string().trim().max(120, "Placeholder muito longo.").optional(),
  ajuda: z.string().trim().max(240, "Texto de ajuda muito longo.").optional(),
  opcoes: z.array(esquemaOpcaoCampoProduto).max(50, "Maximo de 50 opcoes.").optional(),
  largura: z.enum(["sm", "md", "lg", "full"], { message: "Largura invalida." }).default("full"),
  visivelNoResumo: z.boolean().default(true),
  ordem: z.number().int().min(0, "Ordem invalida."),
}).superRefine((campo, ctx) => {
  if (campo.tipo === "select" && (!campo.opcoes || campo.opcoes.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["opcoes"],
      message: "Campos do tipo select exigem ao menos uma opcao.",
    });
  }
});

export const esquemaSchemaLayoutProduto = z.object({
  versao: z.number().int().min(1).default(1),
  campos: z.array(esquemaCampoProduto).max(50, "Maximo de 50 campos por produto."),
});

export const esquemaCriarProduto = z.object({
  nome: z.string().trim().min(2, "Nome do produto deve ter ao menos 2 caracteres."),
  descricao: z.string().trim().max(1000, "Descricao muito longa.").optional().nullable(),
  ativo: z.boolean().optional(),
  schema_layout: esquemaSchemaLayoutProduto,
});

export const esquemaAtualizarProduto = z.object({
  nome: z.string().trim().min(2, "Nome do produto deve ter ao menos 2 caracteres.").optional(),
  descricao: z.string().trim().max(1000, "Descricao muito longa.").optional().nullable(),
  ativo: z.boolean().optional(),
  schema_layout: esquemaSchemaLayoutProduto.optional(),
}).refine((dados) => (
  dados.nome !== undefined ||
  dados.descricao !== undefined ||
  dados.ativo !== undefined ||
  dados.schema_layout !== undefined
), {
  message: "Informe ao menos um campo para atualizar.",
});

export const esquemaValorCampoProduto = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
]);

export const esquemaValoresProduto = z.record(z.string(), esquemaValorCampoProduto);

export const esquemaAnexarProdutoLead = z.object({
  id_produto: z.string().trim().min(1, "Produto obrigatorio."),
  valores_layout: esquemaValoresProduto,
  observacoes: z.string().trim().max(1000, "Observacoes muito longas.").optional().nullable(),
});

export const esquemaAnexarProdutoNegocio = z.object({
  id_produto: z.string().trim().min(1, "Produto obrigatorio."),
  valores_layout: esquemaValoresProduto,
  observacoes: z.string().trim().max(1000, "Observacoes muito longas.").optional().nullable(),
});

export const esquemaAtualizarProdutoLead = z.object({
  valores_layout: esquemaValoresProduto.optional(),
  observacoes: z.string().trim().max(1000, "Observacoes muito longas.").optional().nullable(),
}).refine((dados) => dados.valores_layout !== undefined || dados.observacoes !== undefined, {
  message: "Informe ao menos um campo para atualizar.",
});

export const esquemaAtualizarProdutoNegocio = z.object({
  valores_layout: esquemaValoresProduto.optional(),
  observacoes: z.string().trim().max(1000, "Observacoes muito longas.").optional().nullable(),
}).refine((dados) => dados.valores_layout !== undefined || dados.observacoes !== undefined, {
  message: "Informe ao menos um campo para atualizar.",
});

export const esquemaCriarPdv = z.object({
  nome: z.string().trim().min(1, "Nome do PDV e obrigatorio."),
  id_whatsapp_instancia: z.string().trim().min(1, "Instancia invalida.").optional(),
});

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

export const esquemaAtualizarPdv = z.object({
  nome: z.string().trim().min(1, "Nome do PDV e obrigatorio.").optional(),
  id_whatsapp_instancia: z
    .union([z.string().trim().min(1, "Instancia invalida."), z.null()])
    .optional(),
}).refine((dados) => dados.nome !== undefined || dados.id_whatsapp_instancia !== undefined, {
  message: "Informe ao menos um campo para atualizar.",
});

export const esquemaMoverLead = z.object({
  id_estagio: z.preprocess(
    (valor) => (typeof valor === "string" ? valor : ""),
    z.string().trim().min(1, "Destino obrigatorio."),
  ),
  motivo_perda: z.string().trim().optional(),
});

export const esquemaMoverNegocio = z.object({
  id_estagio: z.preprocess(
    (valor) => (typeof valor === "string" ? valor : ""),
    z.string().trim().min(1, "Destino obrigatorio."),
  ),
  motivo_perda: z.string().trim().optional(),
});

export const esquemaRedistribuirLeadsEmAtendimento = z.object({
  minutosSemAtendimento: z.coerce.number().int().min(1, "Minutos deve ser maior que zero.").max(24 * 60, "Minutos maximo de 24 horas.").default(30),
  limite: z.coerce.number().int().min(1, "Limite minimo de 1 lead.").max(200, "Limite maximo de 200 leads por execucao.").default(50),
  id_pdv: z.string().trim().min(1, "PDV invalido.").optional(),
  nomeEstagio: z.string().trim().min(1, "Nome do estagio invalido.").optional(),
});

export const esquemaAtualizarLead = z
  .object({
    nome: z.string().trim().min(2, "Nome do lead deve ter ao menos 2 caracteres.").optional(),
    observacoes: z.string().trim().max(5000, "Observacoes muito longas.").nullable().optional(),
    telefone: z
      .string()
      .trim()
      .refine((valor) => valor.replace(/\D/g, "").length >= 10, "Telefone invalido.")
      .optional(),
    email: z.string().trim().email("E-mail invalido.").nullable().optional(),
    fonte: z.string().trim().optional(),
    empresa_origem: z.string().trim().optional(),
    id_funcionario: z.string().trim().min(1, "Funcionario obrigatorio.").optional(),
    ativo: z.boolean().optional(),
  })
  .refine(
    (dados) =>
      dados.nome !== undefined ||
      dados.observacoes !== undefined ||
      dados.telefone !== undefined ||
      dados.email !== undefined ||
      dados.fonte !== undefined ||
      dados.empresa_origem !== undefined ||
      dados.id_funcionario !== undefined ||
      dados.ativo !== undefined,
    {
      message: "Informe ao menos um campo para atualizar.",
    },
  );

export const esquemaAtualizarNegocio = z
  .object({
    observacoes_comerciais: z.string().trim().max(5000, "Observacoes comerciais muito longas.").nullable().optional(),
    valor_estimado: z.number().min(0, "Valor estimado nao pode ser negativo.").optional(),
    valor_fechado: z.number().min(0, "Valor fechado nao pode ser negativo.").optional().nullable(),
    probabilidade: z.number().min(0).max(1).optional(),
    motivo_perda: z.string().trim().max(1000, "Motivo da perda muito longo.").nullable().optional(),
    id_funcionario: z.string().trim().min(1, "Funcionario obrigatorio.").optional(),
    titulo: z.string().trim().min(2, "Titulo do negocio deve ter ao menos 2 caracteres.").optional(),
    id_estagio: z.string().trim().min(1, "Estagio obrigatorio.").optional(),
    id_funil: z.string().trim().min(1, "Funil obrigatorio.").optional(),
    status: z.enum(["ABERTO", "GANHO", "PERDIDO"]).optional(),
  })
  .refine(
    (dados) =>
      dados.observacoes_comerciais !== undefined ||
      dados.valor_estimado !== undefined ||
      dados.valor_fechado !== undefined ||
      dados.probabilidade !== undefined ||
      dados.motivo_perda !== undefined ||
      dados.id_funcionario !== undefined ||
      dados.titulo !== undefined ||
      dados.id_estagio !== undefined ||
      dados.id_funil !== undefined ||
      dados.status !== undefined,
    {
      message: "Informe ao menos um campo para atualizar.",
    },
  );

export const esquemaRemoverLead = z.object({
  remover_negocios_vinculados: z.boolean().default(false),
});

export const esquemaRemoverNegocio = z.object({
  remover_leads_vinculados: z.boolean().default(false),
});

export const esquemaVincularLeadsAoNegocio = z.object({
  lead_ids: z.array(z.string().trim().min(1)).max(100, "Maximo de 100 leads por requisicao."),
});

export const esquemaAtualizarVinculosNegocio = z.object({
  lead_ids: z.array(z.string().trim().min(1)).max(100, "Maximo de 100 leads por negocio.").optional(),
});

export const EVENTOS_AUTOMACAO_WHATSAPP = ["LEAD_STAGE_CHANGED", "LEAD_FOLLOW_UP"] as const;
export const TIPOS_DESTINO_AUTOMACAO_WHATSAPP = ["FIXO", "LEAD_TELEFONE"] as const;

const esquemaEtapaFollowUp = z.object({
  ordem: z.coerce.number().int().min(1, "Ordem da etapa invalida.").max(50, "Maximo de 50 etapas."),
  delay_minutos: z
    .coerce
    .number()
    .int()
    .min(1, "Delay deve ser de no minimo 1 minuto.")
    .max(60 * 24 * 30, "Delay maximo de 30 dias por etapa."),
  mensagem_template: z
    .string()
    .trim()
    .min(5, "Mensagem da etapa muito curta.")
    .max(1000, "Mensagem da etapa muito longa."),
});

export const esquemaCriarAutomacaoWhatsapp = z.object({
  id_whatsapp_instancia: z.string().trim().min(1, "Instancia obrigatoria."),
  evento: z.enum(EVENTOS_AUTOMACAO_WHATSAPP, { message: "Evento invalido." }),
  id_estagio_destino: z.string().trim().optional(),
  tipo_destino: z.enum(TIPOS_DESTINO_AUTOMACAO_WHATSAPP).default("FIXO"),
  telefone_destino: z.string().trim().optional(),
  mensagem: z.string().trim().optional(),
  horario_texto: z.string().trim().max(20, "Horario muito longo.").optional(), // Novo campo de horário textual
  etapas: z.array(esquemaEtapaFollowUp).max(50, "Maximo de 50 etapas.").optional(),
  ativo: z.boolean().optional(),
}).superRefine((dados, ctx) => {
  // Validação de horário textual se fornecido
  if (dados.horario_texto && dados.horario_texto.trim().length > 0) {
    const result = parseHorarioTexto(dados.horario_texto);
    if (!result.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horario_texto"],
        message: result.message,
      });
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
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mensagem"],
        message: "Mensagem muito curta.",
      });
    }
  }

  if (dados.evento === "LEAD_FOLLOW_UP") {
    if (!dados.etapas?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["etapas"],
        message: "Defina ao menos 1 etapa de follow-up.",
      });
      return;
    }

    const ordens = new Set<number>();
    for (const etapa of dados.etapas) {
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
});

// Schema para atualização de automação
export const esquemaAtualizarAutomacaoWhatsapp = z.object({
  id_whatsapp_instancia: z.string().trim().min(1, "Instancia obrigatoria.").optional(),
  evento: z.enum(EVENTOS_AUTOMACAO_WHATSAPP, { message: "Evento invalido." }).optional(),
  id_estagio_destino: z.string().trim().optional().nullable(),
  tipo_destino: z.enum(TIPOS_DESTINO_AUTOMACAO_WHATSAPP).optional(),
  telefone_destino: z.string().trim().optional().nullable(),
  mensagem: z.string().trim().optional().nullable(),
  horario_texto: z.string().trim().max(20, "Horario muito longo.").optional(), // Novo campo de horário textual
  ativo: z.boolean().optional(),
  etapas: z.array(esquemaEtapaFollowUp).max(50, "Maximo de 50 etapas.").optional(),
}).superRefine((dados, ctx) => {
  // Validação de horário textual se fornecido
  if (dados.horario_texto && dados.horario_texto.trim().length > 0) {
    const result = parseHorarioTexto(dados.horario_texto);
    if (!result.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horario_texto"],
        message: result.message,
      });
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
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mensagem"],
        message: "Mensagem muito curta.",
      });
    }
  }

  if (dados.evento === "LEAD_FOLLOW_UP" && dados.etapas !== undefined) {
    if (!dados.etapas.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["etapas"],
        message: "Defina ao menos 1 etapa de follow-up.",
      });
      return;
    }

    const ordens = new Set<number>();
    for (const etapa of dados.etapas) {
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
});

export const esquemaAtualizarPendencia = z.object({
  documento_url: z.string().url().optional().nullable(),
  resolvida: z.boolean().optional(),
});

export const esquemaGerarParcelas = z.object({
  id_lead: z.string().trim().min(1, "Lead obrigatorio."),
  valor_parcela: z.number().positive("Valor da parcela deve ser maior que zero."),
  quantidade_parcelas: z.number().int().min(1, "Quantidade minima de 1 parcela.").max(360, "Quantidade maxima de 360 parcelas."),
  data_primeiro_vencimento: z
    .string()
    .trim()
    .min(1, "Data do primeiro vencimento obrigatoria.")
    .refine((valor) => !Number.isNaN(new Date(valor).getTime()), "Data do primeiro vencimento invalida."),
});

export const esquemaGerarParcelasNegocio = z.object({
  id_negocio: z.string().trim().min(1, "Negocio obrigatorio."),
  valor_parcela: z.number().positive("Valor da parcela deve ser maior que zero."),
  quantidade_parcelas: z.number().int().min(1, "Quantidade minima de 1 parcela.").max(360, "Quantidade maxima de 360 parcelas."),
  data_primeiro_vencimento: z
    .string()
    .trim()
    .min(1, "Data do primeiro vencimento obrigatoria.")
    .refine((valor) => !Number.isNaN(new Date(valor).getTime()), "Data do primeiro vencimento invalida."),
});

export const esquemaPagarParcela = z.object({
  data_pagamento: z
    .string()
    .trim()
    .min(1, "Data de pagamento obrigatoria.")
    .refine((valor) => !Number.isNaN(new Date(valor).getTime()), "Data de pagamento invalida."),
});

export const esquemaListarRecebimentos = z.object({
  aba: z.enum(["todos", "recebidos", "a_vencer", "atrasados"]).default("todos"),
  busca: z.string().trim().optional(),
  data_inicial: z.string().trim().optional(),
  data_final: z.string().trim().optional(),
  id_pdv: z.string().trim().optional(),
  id_funcionario: z.string().trim().optional(),
  ordenar: z.enum(["vencimento", "pagamento", "valor"]).default("vencimento"),
  direcao: z.enum(["asc", "desc"]).default("asc"),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

export const CARGOS_EQUIPE = ["COLABORADOR", "GERENTE", "ADMINISTRADOR"] as const;

export const schemaAtualizarFuncionario = z.object({
  nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres."),
  email: z.string().trim().email("E-mail invalido."),
  cargo: z.enum(CARGOS_EQUIPE, { message: "Cargo invalido." }),
  id_pdv: z.string().trim().min(1, "PDV obrigatorio."),
});

export const schemaInativarFuncionario = z.object({
  id_funcionario_destino: z.string().trim().min(1, "Destino obrigatorio."),
  observacao: z.string().trim().max(500, "Observacao muito longa.").optional(),
});

export const schemaListarFuncionarios = z.object({
  busca: z.string().trim().optional(),
  status: z.enum(["TODOS", "ATIVO", "INATIVO"]).default("TODOS"),
  cargo: z.enum(["TODOS", ...CARGOS_EQUIPE]).default("TODOS"),
  id_pdv: z.string().trim().optional(),
  ordenar_por: z.enum(["nome", "email", "cargo", "status", "pdv", "criado_em"]).default("nome"),
  direcao: z.enum(["asc", "desc"]).default("asc"),
  pagina: z.coerce.number().int().min(1).default(1),
  por_pagina: z.coerce.number().int().min(1).max(100).default(20),
});

export const schemaAcaoLoteFuncionarios = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, "Selecione ao menos um colaborador."),
  acao: z.enum(["ATIVAR", "INATIVAR", "ALTERAR_CARGO", "ALTERAR_PDV"]),
  cargo: z.enum(CARGOS_EQUIPE).optional(),
  id_pdv: z.string().trim().optional(),
  id_funcionario_destino: z.string().trim().optional(),
  observacao: z.string().trim().max(500, "Observacao muito longa.").optional(),
});

export type AcaoLoteFuncionarios = z.infer<typeof schemaAcaoLoteFuncionarios>;

export function normalizarBuscaFuncionarios(valor?: string) {
  return valor?.trim().toLowerCase() ?? "";
}

export function mensagemErroValidacao(erro: z.ZodError) {
  return erro.issues[0]?.message ?? "Dados invalidos.";
}

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
  naoLidas: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((valor) => valor === true || valor === "true")
    .default(false),
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

export const esquemaAcaoAutomacao = z.object({
  tipo: z.enum(["WHATSAPP_MSG"], { message: "Tipo de acao invalido." }),
  ordem: z.coerce.number().int().min(0),
  delay_minutos: z.coerce.number().int().min(0).max(43200).default(0),
  id_instancia_whatsapp: z.string().trim().optional(),
  telefone_destino: z.string().trim().optional(),
  id_lead_destino: z.string().trim().optional(),
  mensagem: z.string().trim().min(1, "Mensagem obrigatoria.").max(4096),
});

export const esquemaConfigStageChange = z.object({
  id_estagio_destino: z.string().trim().optional(),
});

export const esquemaCriarAutomacao = z.object({
  nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres.").max(100),
  fonte: z.enum(["WHATSAPP"], { message: "Fonte invalida." }),
  gatilho: z.enum(["STAGE_CHANGE"], { message: "Gatilho invalido." }),
  ativo: z.boolean().default(true),
  acoes: z.array(esquemaAcaoAutomacao).min(1, "Ao menos uma acao e obrigatoria."),
  id_estagio_destino: z.string().trim().optional(),
});

export const esquemaAtualizarAutomacao = z.object({
  nome: z.string().trim().min(2).max(100).optional(),
  ativo: z.boolean().optional(),
  acoes: z.array(esquemaAcaoAutomacao).min(1).optional(),
  id_estagio_destino: z.string().trim().optional(),
});

export const esquemaDispatchQuery = z.object({
  only: z.enum(["whatsapp"]).optional(),
  automacao_id: z.string().trim().optional(),
  teste: z.enum(["true"]).optional(),
  lead_id: z.string().trim().optional(),
});

export const esquemaWebhookLoggerPayload = z.unknown().refine(
  (valor): valor is Record<string, unknown> => typeof valor === "object" && valor !== null && !Array.isArray(valor),
  { message: "Payload do webhook deve ser um objeto JSON." },
);

export type AcaoAutomacaoInput = z.infer<typeof esquemaAcaoAutomacao>;
export type CriarAutomacaoInput = z.infer<typeof esquemaCriarAutomacao>;
export type AtualizarAutomacaoInput = z.infer<typeof esquemaAtualizarAutomacao>;
