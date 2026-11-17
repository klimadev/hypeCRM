export const PERFIS = ["EMPRESA", "GERENTE", "COLABORADOR"] as const;
export const CARGOS_EQUIPE = ["COLABORADOR", "GERENTE", "ADMINISTRADOR"] as const;
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

export type Perfil = (typeof PERFIS)[number];
export type CargoFuncionario = (typeof CARGOS_EQUIPE)[number];
export type TipoEstagioFunil = "ABERTO" | "GANHO" | "PERDIDO";
export type StatusAssinatura = (typeof STATUS_ASSINATURA)[keyof typeof STATUS_ASSINATURA];
export type Plano = (typeof PLANOS)[keyof typeof PLANOS];

export type EstadoTrial = {
  status: StatusAssinatura;
  plano: Plano;
  trial_ativo: boolean;
  trial_expirado: boolean;
  dias_restantes: number;
  trial_inicio: string | null;
  trial_fim: string | null;
  data_expiracao: string | null;
  mensagem: string;
};

export type SessaoToken = {
  id_usuario: string;
  id_empresa: string;
  perfil: Perfil;
  id_pdv: string | null;
  isSuperAdmin: boolean;
};
