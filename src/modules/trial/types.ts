export type EstadoTrial = {
  status: "TRIAL" | "ATIVA" | "EXPIRADA" | "CANCELADA";
  plano: string;
  trial_ativo: boolean;
  trial_expirado: boolean;
  dias_restantes: number;
  trial_inicio: string | null;
  trial_fim: string | null;
  data_expiracao: string | null;
  mensagem: string;
};
