export type LeadElegivelCampanha = {
  leadId: string;
  instanceName: string;
};

type AtrasoConfig = {
  delayMinSegundos: number;
  delayMaxSegundos: number;
  jitterMaxMs: number;
};

type AgendaConfig = AtrasoConfig & {
  inicio: string;
  leads: LeadElegivelCampanha[];
};

export type AgendaLeadCampanha = {
  leadId: string;
  instanceName: string;
  agendadoPara: Date;
};

type ResumoCampanhaInput = {
  selecionadosTotal: number;
  elegiveisTotal: number;
  inicio: string;
  ultimoAgendamento: string | null;
};

export function gerarAtrasoDinamicoMs(config: AtrasoConfig): number {
  const delayMinMs = Math.max(0, Math.floor(config.delayMinSegundos * 1000));
  const delayMaxMs = Math.max(delayMinMs, Math.floor(config.delayMaxSegundos * 1000));
  const jitterMaxMs = Math.max(0, Math.floor(config.jitterMaxMs));
  const faixaDelayMs = delayMaxMs - delayMinMs;
  const delaySorteado = delayMinMs + (faixaDelayMs > 0 ? Math.floor(Math.random() * (faixaDelayMs + 1)) : 0);
  const jitterSorteado = jitterMaxMs > 0 ? Math.floor(Math.random() * (jitterMaxMs + 1)) : 0;
  return delaySorteado + jitterSorteado;
}

export function calcularAgendaPorInstancia(config: AgendaConfig): AgendaLeadCampanha[] {
  const inicioBaseMs = new Date(config.inicio).getTime();
  const cursoresPorInstancia = new Map<string, number>();

  return config.leads.map((lead) => {
    const cursorAtual = cursoresPorInstancia.get(lead.instanceName) ?? inicioBaseMs;
    const atraso = gerarAtrasoDinamicoMs(config);
    cursoresPorInstancia.set(lead.instanceName, cursorAtual + atraso);

    return {
      leadId: lead.leadId,
      instanceName: lead.instanceName,
      agendadoPara: new Date(cursorAtual),
    };
  });
}

export function calcularResumoCampanha(input: ResumoCampanhaInput) {
  const ignoradosTotal = Math.max(0, input.selecionadosTotal - input.elegiveisTotal);
  const inicioMs = new Date(input.inicio).getTime();
  const ultimoMs = input.ultimoAgendamento ? new Date(input.ultimoAgendamento).getTime() : null;

  return {
    selecionadosTotal: input.selecionadosTotal,
    elegiveisTotal: input.elegiveisTotal,
    ignoradosTotal,
    duracaoEstimadaSegundos:
      ultimoMs != null && Number.isFinite(inicioMs) && Number.isFinite(ultimoMs)
        ? Math.max(0, Math.floor((ultimoMs - inicioMs) / 1000))
        : 0,
  };
}
