import { z } from "zod";

export const esquemaCriarProduto = z.object({
  nome: z.string().trim().min(2, "Nome do produto deve ter ao menos 2 caracteres."),
  descricao: z.string().trim().max(1000, "Descricao muito longa.").optional().nullable(),
  ativo: z.boolean().optional(),
});

export const esquemaAtualizarProduto = z.object({
  nome: z.string().trim().min(2, "Nome do produto deve ter ao menos 2 caracteres.").optional(),
  descricao: z.string().trim().max(1000, "Descricao muito longa.").optional().nullable(),
  ativo: z.boolean().optional(),
}).refine((dados) => (
  dados.nome !== undefined ||
  dados.descricao !== undefined ||
  dados.ativo !== undefined
), {
  message: "Informe ao menos um campo para atualizar.",
});
