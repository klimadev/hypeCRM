import { DIAS_ESTAGIO_PARADO, LABELS_PENDENCIA, type TipoPendencia } from "@/lib/pendencias";

export type PendenciaCalculada = {
  id: string;
  id_lead: string;
  tipo: TipoPendencia;
  descricao: string;
  resolvida: boolean;
};

export type LeadParaCalculo = {
  id: string;
  atualizado_em: Date | string;
};

export type EstagioParaCalculo = {
  tipo: string;
  nome: string;
};

function gerarIdPendencia(leadId: string, tipo: string): string {
  return `${leadId}:${tipo}`;
}

export function calcularPendenciasLead(
  lead: LeadParaCalculo,
  estagio: EstagioParaCalculo
): PendenciaCalculada[] {
  const pendencias: PendenciaCalculada[] = [];
  const hoje = new Date();
  const dataLimiteEstagioParado = new Date(hoje);
  dataLimiteEstagioParado.setDate(dataLimiteEstagioParado.getDate() - DIAS_ESTAGIO_PARADO);

  const isGanhoOuPerdido = estagio.tipo === "GANHO" || estagio.tipo === "PERDIDO";
  const isEstagioParado = new Date(lead.atualizado_em || Date.now()) < dataLimiteEstagioParado;

  // Pendência de lead parado em estágio não-final
  if (!isGanhoOuPerdido && isEstagioParado) {
    pendencias.push({
      id: gerarIdPendencia(lead.id, "ESTAGIO_PARADO"),
      id_lead: lead.id,
      tipo: "ESTAGIO_PARADO",
      descricao: LABELS_PENDENCIA.ESTAGIO_PARADO,
      resolvida: false,
    });
  }

  return pendencias;
}
