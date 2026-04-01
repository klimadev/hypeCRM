import type { WhatsappJobItem } from "../types";

export type ContextoLeadJob = {
  lead_nome: string;
  lead_telefone: string;
  lead_id: string;
  estagio_anterior: string;
  estagio_novo: string;
};

export type FilterType = "todos" | "pendentes" | "processando" | "enviados" | "falhas";

export function filtrarJobsWhatsapp(jobs: WhatsappJobItem[], filtro: FilterType) {
  if (filtro === "todos") {
    return jobs;
  }

  const mapaStatus = {
    pendentes: "PENDENTE",
    processando: "PROCESSANDO",
    enviados: "ENVIADO",
    falhas: "FALHA",
  } as const;

  return jobs.filter((job) => job.status === mapaStatus[filtro]);
}

export function contarJobsPorFiltro(jobs: WhatsappJobItem[]) {
  return {
    todos: jobs.length,
    pendentes: jobs.filter((job) => job.status === "PENDENTE").length,
    processando: jobs.filter((job) => job.status === "PROCESSANDO").length,
    enviados: jobs.filter((job) => job.status === "ENVIADO").length,
    falhas: jobs.filter((job) => job.status === "FALHA").length,
  };
}

export function formatarDataJobWhatsapp(dateStr: string) {
  const d = new Date(dateStr);
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const isHoje = d.toDateString() === hoje.toDateString();
  const isAmanha = d.toDateString() === amanha.toDateString();
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (isHoje) {
    return `Hoje, ${hora}`;
  }

  if (isAmanha) {
    return `Amanhã, ${hora}`;
  }

  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function truncateMensagemJob(str: string, len: number) {
  if (!str) {
    return "-";
  }

  return str.length > len ? `${str.slice(0, len)}...` : str;
}

export function getContextoLeadJob(contextoJson: string): ContextoLeadJob | null {
  try {
    return JSON.parse(contextoJson);
  } catch {
    return null;
  }
}
