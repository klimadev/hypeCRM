import type { EstadoTrial } from "@/lib/tipos";

export type DadosTrial = {
  status_assinatura: string;
  trial_inicio: Date | null;
  trial_fim: Date | null;
  assinatura_inicio: Date | null;
  assinatura_fim: Date | null;
  plano: string;
};

export function calcularEstadoTrial(empresa: DadosTrial): EstadoTrial {
  const agora = new Date();

  if (!empresa.trial_fim) {
    return {
      status: empresa.status_assinatura as EstadoTrial["status"],
      plano: empresa.plano as EstadoTrial["plano"],
      trial_ativo: false,
      trial_expirado: false,
      dias_restantes: 0,
      trial_inicio: empresa.trial_inicio?.toISOString() ?? null,
      trial_fim: null,
      data_expiracao: null,
      mensagem: empresa.status_assinatura === "ATIVA" ? "Assinatura ativa." : "Conta sem trial.",
    };
  }

  const trialFim = new Date(empresa.trial_fim);
  const diffMs = trialFim.getTime() - agora.getTime();
  const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const trialExpirado = diffMs <= 0;
  const trialAtivo = !trialExpirado && empresa.status_assinatura === "TRIAL";

  const dataExpiracaoFormatada = trialFim.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  let mensagem: string;
  if (trialExpirado) {
    mensagem = "Seu trial expirou. Faça upgrade para continuar usando.";
  } else if (diasRestantes <= 3) {
    mensagem = `Atenção: seu trial expira em ${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""}!`;
  } else {
    mensagem = `Seu trial expira em ${diasRestantes} dias.`;
  }

  return {
    status: trialExpirado ? "EXPIRADA" : (empresa.status_assinatura as EstadoTrial["status"]),
    plano: empresa.plano as EstadoTrial["plano"],
    trial_ativo: trialAtivo,
    trial_expirado: trialExpirado,
    dias_restantes: diasRestantes,
    trial_inicio: empresa.trial_inicio?.toISOString() ?? null,
    trial_fim: empresa.trial_fim?.toISOString() ?? null,
    data_expiracao: dataExpiracaoFormatada,
    mensagem,
  };
}

export function podeAcessarSistema(empresa: DadosTrial): boolean {
  if (empresa.status_assinatura === "ATIVA") return true;
  if (empresa.status_assinatura === "CANCELADA") return false;
  if (empresa.status_assinatura === "TRIAL" && empresa.trial_fim) {
    return new Date(empresa.trial_fim) > new Date();
  }
  if (!empresa.trial_fim) return true;
  return false;
}
