import { z } from "zod";

const esquemaDataValida = (mensagemCampo: string) =>
  z
    .string()
    .trim()
    .min(1, mensagemCampo)
    .refine((valor) => !Number.isNaN(new Date(valor).getTime()), `${mensagemCampo.replace(" obrigatoria", "").replace(" obrigatorio", "")} invalida.`);

export const esquemaAtualizarPendencia = z.object({
  documento_url: z.string().url().optional().nullable(),
  resolvida: z.boolean().optional(),
});

export const esquemaGerarParcelas = z.object({
  id_lead: z.string().trim().min(1, "Lead obrigatorio."),
  valor_parcela: z.number().positive("Valor da parcela deve ser maior que zero."),
  quantidade_parcelas: z.number().int().min(1, "Quantidade minima de 1 parcela.").max(360, "Quantidade maxima de 360 parcelas."),
  data_primeiro_vencimento: esquemaDataValida("Data do primeiro vencimento obrigatoria."),
});

export const esquemaGerarParcelasNegocio = z.object({
  id_negocio: z.string().trim().min(1, "Negocio obrigatorio."),
  valor_parcela: z.number().positive("Valor da parcela deve ser maior que zero."),
  quantidade_parcelas: z.number().int().min(1, "Quantidade minima de 1 parcela.").max(360, "Quantidade maxima de 360 parcelas."),
  data_primeiro_vencimento: esquemaDataValida("Data do primeiro vencimento obrigatoria."),
});

export const esquemaPagarParcela = z.object({
  data_pagamento: esquemaDataValida("Data de pagamento obrigatoria."),
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
