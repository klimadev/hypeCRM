import type { TipoPendencia } from "@/lib/pendencias";
import type { PendenciaGravidade, PendenciaInfo, ResumoPendencias } from "./use-pendencias-globais";

export function getGravidadePendencia(tipo: TipoPendencia): PendenciaGravidade {
  switch (tipo) {
    case "DOCUMENTO_APROVACAO_PENDENTE":
      return "critica";
    case "APROVACAO_GERENCIA_PENDENTE":
    case "ESTAGIO_PARADO":
      return "alerta";
    default:
      return "info";
  }
}

export function detectarNovasPendenciasNaoNotificadas(
  anteriores: PendenciaInfo[],
  atuais: PendenciaInfo[],
  jaNotificadas: Set<string>,
): PendenciaInfo[] {
  const idsAnteriores = new Set(anteriores.filter((p) => !p.resolvida).map((p) => p.id));
  return atuais.filter((p) => !p.resolvida && !idsAnteriores.has(p.id) && !jaNotificadas.has(p.id));
}

export function criarResumoPendencias(pendencias: PendenciaInfo[]): ResumoPendencias {
  const leadsSet = new Set<string>();
  const porTipo: ResumoPendencias["porTipo"] = {
    SEM_RESPOSTA: 0,
    CARTA_CREDITO_PENDENTE: 0,
    DOCUMENTOS_PENDENTES: 0,
    QUEDA_RESERVA: 0,
    ALTO_VALOR: 0,
    DOCUMENTO_APROVACAO_PENDENTE: 0,
    APROVACAO_GERENCIA_PENDENTE: 0,
    ESTAGIO_PARADO: 0,
  };
  const porGravidade: ResumoPendencias["porGravidade"] = {
    critica: 0,
    alerta: 0,
    info: 0,
  };

  for (const pendencia of pendencias) {
    if (pendencia.resolvida) continue;
    leadsSet.add(pendencia.id_lead);
    porTipo[pendencia.tipo]++;
    porGravidade[getGravidadePendencia(pendencia.tipo)]++;
  }

  return {
    total: pendencias.filter((pendencia) => !pendencia.resolvida).length,
    totalNegocios: leadsSet.size,
    porTipo,
    porGravidade,
  };
}

export function criarPendenciasPorNegocio(pendencias: PendenciaInfo[]) {
  const mapa: Record<string, { total: number; naoResolvidas: number; tipos: TipoPendencia[]; gravidadeMaxima: PendenciaGravidade }> = {};
  const ordem = { info: 0, alerta: 1, critica: 2 };

  for (const pendencia of pendencias) {
    if (pendencia.resolvida) continue;
    if (!mapa[pendencia.id_lead]) {
      mapa[pendencia.id_lead] = { total: 0, naoResolvidas: 0, tipos: [], gravidadeMaxima: "info" };
    }

    mapa[pendencia.id_lead].total++;
    mapa[pendencia.id_lead].naoResolvidas++;
    mapa[pendencia.id_lead].tipos.push(pendencia.tipo);

    const gravidade = getGravidadePendencia(pendencia.tipo);
    if (ordem[gravidade] > ordem[mapa[pendencia.id_lead].gravidadeMaxima]) {
      mapa[pendencia.id_lead].gravidadeMaxima = gravidade;
    }
  }

  return mapa;
}
