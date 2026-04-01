import { z } from "zod";

export const esquemaLogin = z.object({
  email: z.string().trim().email("E-mail invalido."),
  senha: z.string().min(1, "Senha obrigatoria."),
});

export const esquemaCadastroEmpresa = z.object({
  nome: z.string().trim().min(2, "Nome da empresa deve ter ao menos 2 caracteres."),
  email: z.string().trim().email("E-mail invalido."),
  senha: z.string().min(6, "Senha precisa ter ao menos 6 caracteres."),
});

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
