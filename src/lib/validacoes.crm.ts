import { z } from "zod";

const TIPO_ESTAGIO_VALUES = ["ABERTO", "PROGRESSO", "SUCCESS", "FALHA"] as const;

export const EsquemaCriarPipeline = z.object({
  nome: z.string().trim().min(1, "Nome do pipeline é obrigatório.").max(100),
  descricao: z.string().trim().max(500).optional(),
  ordem: z.number().optional(),
});

export const EsquemaAtualizarPipeline = EsquemaCriarPipeline.partial();

export const EsquemaCriarEstagio = z.object({
  nome: z.string().trim().min(1, "Nome do estágio é obrigatório.").max(100),
  tipo: z.enum(TIPO_ESTAGIO_VALUES),
  ordem: z.number().optional(),
});

export const EsquemaAtualizarEstagio = z.object({
  nome: z.string().trim().min(1, "Nome do estágio é obrigatório.").max(100).optional(),
  tipo: z.enum(TIPO_ESTAGIO_VALUES).optional(),
});

export const EsquemaAtualizarEstilosEstagio = z.object({
  cor_fundo: z.string().trim().optional(),
  cor_texto: z.string().trim().optional(),
  cor_borda: z.string().trim().optional(),
  fonte_tamanho: z.number().optional(),
  fonte_peso: z.number().optional(),
  borda_arredondamento: z.number().optional(),
  icone: z.string().trim().optional(),
});

export const EsquemaReordenarEstagios = z.object({
  estagios: z.array(z.object({
    id: z.string().trim().min(1),
    ordem: z.number(),
  })),
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

export const esquemaImportarLeads = z.object({
  id_funcionario: z.string().trim().min(1, "Funcionario obrigatorio."),
  deduplicar: z.boolean().default(true),
  leads: z.array(z.object({
    nome: z.string().trim().min(2, "Nome do lead deve ter ao menos 2 caracteres.").max(120, "Nome muito longo."),
    telefone: z.string().trim().min(8, "Telefone invalido.").max(40, "Telefone muito longo."),
    email: z.string().trim().email("E-mail invalido.").max(160, "E-mail muito longo.").optional().nullable(),
    fonte: z.string().trim().max(120, "Fonte muito longa.").optional().nullable(),
    empresa_origem: z.string().trim().max(120, "Empresa de origem muito longa.").optional().nullable(),
    observacoes: z.string().trim().max(2000, "Observacoes muito longas.").optional().nullable(),
  })).min(1, "Informe ao menos 1 lead.").max(2000, "Limite de 2000 leads por importacao."),
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

export const esquemaCriarPdv = z.object({
  nome: z.string().trim().min(1, "Nome do PDV e obrigatorio."),
  id_whatsapp_instancia: z.string().trim().min(1, "Instancia invalida.").optional(),
});

export const esquemaAtualizarPdv = z.object({
  nome: z.string().trim().min(1, "Nome do PDV e obrigatorio.").optional(),
  id_whatsapp_instancia: z.union([z.string().trim().min(1, "Instancia invalida."), z.null()]).optional(),
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
    telefone: z.string().trim().refine((valor) => valor.replace(/\D/g, "").length >= 10, "Telefone invalido.").optional(),
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
