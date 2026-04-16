import type { Estagio, Lead, PendenciaNegocioInfo } from "../types";

type ResumoOperacionalColunaParams = {
  estagio: Estagio;
  negocios: Lead[];
  pendenciasPorNegocio: Record<string, PendenciaNegocioInfo>;
  agoraMs: number;
};

export function obterDescricaoEtapaKanban(estagio: Estagio): string {
  const nome = estagio.nome.toLowerCase();

  if (estagio.tipo === "GANHO" || estagio.tipo === "SUCCESS") return "Negócios concluídos";
  if (estagio.tipo === "PERDIDO" || estagio.tipo === "FALHA") return "Oportunidades encerradas";
  if (nome.includes("novo") || nome.includes("contato")) return "Leads em primeiro contato";
  if (nome.includes("conversa") || nome.includes("atendimento")) return "Conversas em andamento";
  if (nome.includes("proposta")) return "Propostas aguardando resposta";
  if (nome.includes("negocia")) return "Negócios em decisão";

  return "Oportunidades em andamento";
}

export function obterResumoOperacionalColuna({
  estagio,
  negocios,
  pendenciasPorNegocio,
  agoraMs,
}: ResumoOperacionalColunaParams): string {
  if (negocios.length === 0) {
    return estagio.tipo === "GANHO" || estagio.tipo === "SUCCESS" ? "Sem fechamentos nesta etapa" : "Sem negócios nesta etapa";
  }

  const negociosCriticos = negocios.filter((negocio) => pendenciasPorNegocio[negocio.id]?.gravidadeMaxima === "critica").length;
  if (negociosCriticos > 0) {
    return `${negociosCriticos} atenção${negociosCriticos > 1 ? "s" : ""} crítica${negociosCriticos > 1 ? "s" : ""}`;
  }

  const negociosParados = negocios.filter((negocio) => {
    const diasParados = obterDiasParados(negocio.atualizado_em, agoraMs);
    return diasParados > 3 && estagio.tipo !== "GANHO" && estagio.tipo !== "SUCCESS" && estagio.tipo !== "PERDIDO" && estagio.tipo !== "FALHA";
  }).length;

  if (negociosParados > 0) {
    return `${negociosParados} parado${negociosParados > 1 ? "s" : ""} há mais de 3 dias`;
  }

  if (estagio.tipo === "GANHO" || estagio.tipo === "SUCCESS") {
    return `${negocios.length} fechamento${negocios.length > 1 ? "s" : ""} concluído${negocios.length > 1 ? "s" : ""}`;
  }

  return `${negocios.length} em andamento`;
}

export function obterRotuloTempoParado(diasParados: number): string {
  if (diasParados <= 0) return "Atualizado hoje";
  if (diasParados === 1) return "Parado desde ontem";
  return `Parado há ${diasParados} dias`;
}

export function obterRotuloProximoPasso({
  diasParados,
  estagio,
  pendencia,
}: {
  diasParados: number;
  estagio: Estagio;
  pendencia?: PendenciaNegocioInfo;
}): string {
  const nome = estagio.nome.toLowerCase();

  if (nome.includes("proposta")) return "Próximo passo: cobrar retorno da proposta";
  if (pendencia?.gravidadeMaxima === "critica") return "Próximo passo: agir agora neste negócio";
  if (diasParados >= 2) return "Próximo passo: retomar contato com o cliente";
  if (nome.includes("negocia")) return "Próximo passo: avançar para fechamento";

  return "Próximo passo: continuar atendimento";
}

export function obterDiasParados(atualizadoEm: string, agoraMs: number): number {
  return Math.max(0, Math.floor((agoraMs - new Date(atualizadoEm).getTime()) / (1000 * 60 * 60 * 24)));
}
