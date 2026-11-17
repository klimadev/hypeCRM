import { z } from "zod";
import { CARGOS_EQUIPE } from "@/lib/tipos";

export { CARGOS_EQUIPE } from "@/lib/tipos";

export const schemaAtualizarFuncionario = z.object({
  nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres."),
  email: z.string().trim().email("E-mail invalido."),
  cargo: z.enum(CARGOS_EQUIPE, { message: "Cargo invalido." }),
  id_pdv: z.string().trim().min(1, "PDV obrigatorio."),
});

export type AtualizarFuncionarioInput = z.input<typeof schemaAtualizarFuncionario>;
export type AtualizarFuncionarioOutput = z.output<typeof schemaAtualizarFuncionario>;

export const schemaInativarFuncionario = z.object({
  id_funcionario_destino: z.string().trim().min(1, "Destino obrigatorio."),
  observacao: z.string().trim().max(500, "Observacao muito longa.").optional(),
});

export type InativarFuncionarioInput = z.input<typeof schemaInativarFuncionario>;
export type InativarFuncionarioOutput = z.output<typeof schemaInativarFuncionario>;

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

export type ListarFuncionariosInput = z.input<typeof schemaListarFuncionarios>;
export type ListarFuncionariosOutput = z.output<typeof schemaListarFuncionarios>;

export const schemaAcaoLoteFuncionarios = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, "Selecione ao menos um colaborador."),
  acao: z.enum(["ATIVAR", "INATIVAR", "ALTERAR_CARGO", "ALTERAR_PDV"]),
  cargo: z.enum(CARGOS_EQUIPE).optional(),
  id_pdv: z.string().trim().optional(),
  id_funcionario_destino: z.string().trim().optional(),
  observacao: z.string().trim().max(500, "Observacao muito longa.").optional(),
});

export type AcaoLoteFuncionariosInput = z.input<typeof schemaAcaoLoteFuncionarios>;
export type AcaoLoteFuncionariosOutput = z.output<typeof schemaAcaoLoteFuncionarios>;
export type AcaoLoteFuncionarios = z.infer<typeof schemaAcaoLoteFuncionarios>;
