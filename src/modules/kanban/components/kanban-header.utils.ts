import { formataMoeda } from "@/lib/utils";
import type { FiltroOrigem, KanbanFilters } from "../types";

export type ContatoDisponivelNegocio = {
  id: string;
  nome: string;
  telefone: string;
  id_negocio?: string | null;
};

export type FiltroRapidoKanban = "todos" | "urgencias" | FiltroOrigem;

export const FILTROS_RAPIDOS_KANBAN: Array<{ id: FiltroRapidoKanban; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "urgencias", label: "Urgências" },
  { id: "ANUNCIO_CTWA", label: "Anúncios" },
  { id: "SINCRONIZACAO_WHATSAPP", label: "WhatsApp" },
  { id: "MANUAL", label: "Manual" },
];

export function toggleContatoSelecionado(selecionados: string[], idContato: string) {
  return selecionados.includes(idContato)
    ? selecionados.filter((id) => id !== idContato)
    : [...selecionados, idContato];
}

export function temFiltrosKanbanAtivos(filtros: KanbanFilters) {
  return (
    filtros.status !== "todos" ||
    filtros.gravidade !== "todas" ||
    filtros.tipo !== "todos" ||
    filtros.pdv !== null ||
    filtros.origem !== "todos"
  );
}

export function criarResumoKanban(params: {
  totalNegocios: number;
  totalPipeline: number;
  negociosParados: number;
}) {
  const { totalNegocios, totalPipeline, negociosParados } = params;
  return `Veja o funil em segundos: ${totalNegocios} negócio${totalNegocios !== 1 ? "s" : ""}, ${formataMoeda(totalPipeline)} em jogo e ${negociosParados} precisando de ação.`;
}

export function aplicarFiltroRapidoKanban(params: {
  tipo: FiltroRapidoKanban;
  filtros: KanbanFilters;
  modoFocoPendencias: boolean;
}) {
  const { tipo, filtros } = params;

  if (tipo === "todos") {
    return {
      filtros: { status: "todos", gravidade: "todas", tipo: "todos", pdv: null, origem: "todos" } satisfies KanbanFilters,
      modoFocoPendencias: false,
    };
  }

  if (tipo === "urgencias") {
    return {
      filtros: { ...filtros, status: "com_pendencia", gravidade: "todas", origem: "todos" } satisfies KanbanFilters,
      modoFocoPendencias: true,
    };
  }

  return {
    filtros: { ...filtros, origem: tipo, status: "todos", gravidade: "todas" } satisfies KanbanFilters,
    modoFocoPendencias: false,
  };
}

export function filtroRapidoKanbanAtivo(params: {
  tipo: FiltroRapidoKanban;
  filtros: KanbanFilters;
  modoFocoPendencias: boolean;
}) {
  const { tipo, filtros, modoFocoPendencias } = params;

  if (tipo === "todos") {
    return !modoFocoPendencias && !temFiltrosKanbanAtivos(filtros) && filtros.origem === "todos";
  }

  if (tipo === "urgencias") {
    return modoFocoPendencias || filtros.status === "com_pendencia";
  }

  return filtros.origem === tipo;
}
