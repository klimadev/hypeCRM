import { z } from "zod";

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

const esquemaObservacoesProduto = z.string().trim().max(1000, "Observacoes muito longas.").optional().nullable();

export const esquemaAnexarProdutoLead = z.object({
  id_produto: z.string().trim().min(1, "Produto obrigatorio."),
  valores_layout: esquemaValoresProduto,
  observacoes: esquemaObservacoesProduto,
});

export const esquemaAnexarProdutoNegocio = z.object({
  id_produto: z.string().trim().min(1, "Produto obrigatorio."),
  valores_layout: esquemaValoresProduto,
  observacoes: esquemaObservacoesProduto,
});

export const esquemaAtualizarProdutoLead = z.object({
  valores_layout: esquemaValoresProduto.optional(),
  observacoes: esquemaObservacoesProduto,
}).refine((dados) => dados.valores_layout !== undefined || dados.observacoes !== undefined, {
  message: "Informe ao menos um campo para atualizar.",
});

export const esquemaAtualizarProdutoNegocio = z.object({
  valores_layout: esquemaValoresProduto.optional(),
  observacoes: esquemaObservacoesProduto,
}).refine((dados) => dados.valores_layout !== undefined || dados.observacoes !== undefined, {
  message: "Informe ao menos um campo para atualizar.",
});
