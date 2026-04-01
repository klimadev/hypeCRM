export type Perfil = "EMPRESA" | "GERENTE" | "COLABORADOR";
export type CargoFuncionario = "GERENTE" | "COLABORADOR" | "ADMINISTRADOR";
export type TipoEstagioFunil = "ABERTO" | "GANHO" | "PERDIDO";
export type StatusAssinatura = "TRIAL" | "ATIVA" | "EXPIRADA" | "CANCELADA";
export type Plano = "trial" | "basico" | "profissional" | "enterprise";

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
};
