"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Filter, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { KanbanFilters, KpiKanban, OrdenacaoKanban, OrigemStats, Pipeline } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type KanbanHeaderDesktopProps = {
  pipelines: Pipeline[];
  pipelineSelecionadaId: string;
  setPipelineSelecionadaId: (id: string) => void;
  onDialogNovoNegocioChange: (aberto: boolean) => void;
  filtros: KanbanFilters;
  setFiltros: (filtros: KanbanFilters) => void;
  busca: string;
  setBusca: (busca: string) => void;
  totalNegocios: number;
  totalPipeline: number;
  negociosParados: number;
  pendenciasCriticas: number;
  kpis: KpiKanban[];
  origemStats: OrigemStats;
};

export function KanbanHeaderDesktop({
  pipelines,
  pipelineSelecionadaId,
  setPipelineSelecionadaId,
  onDialogNovoNegocioChange,
  filtros,
  setFiltros,
  busca,
  setBusca,
  totalNegocios,
  totalPipeline,
  negociosParados,
  pendenciasCriticas,
  kpis,
  origemStats,
}: KanbanHeaderDesktopProps) {
  const [mostrarMetricas, setMostrarMetricas] = useState(false);

  const temFiltroAtivo =
    busca ||
    filtros.status !== "todos" ||
    filtros.origem !== "todos";

  return (
    <div className="space-y-3">
      {/* Linha principal */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Seletor de pipeline */}
        <Select value={pipelineSelecionadaId} onValueChange={setPipelineSelecionadaId}>
          <SelectTrigger className="h-10 w-56 rounded-xl border-[var(--border-subtle)] bg-[var(--surface)]">
            <SelectValue placeholder="Selecione um funil" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Busca */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar negócio..."
            className="h-10 rounded-xl border-[var(--border-subtle)] bg-[var(--surface)] pl-9 text-sm"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filtros */}
        <Popover>
          <PopoverTrigger
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors",
              "border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]",
              temFiltroAtivo && "border-[var(--brand)] text-[var(--brand)]"
            )}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {temFiltroAtivo && <span className="ml-1 rounded-full bg-[var(--brand)] h-2 w-2" />}
          </PopoverTrigger>
          <PopoverContent className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-[var(--text-secondary)]">Status</p>
              <Select
                value={filtros.status}
                onValueChange={(status) => setFiltros({ ...filtros, status: status as KanbanFilters["status"] })}
              >
                <SelectTrigger className="h-9 rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="com_pendencia">Com pendência</SelectItem>
                  <SelectItem value="sem_pendencia">Sem pendência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-[var(--text-secondary)]">Origem</p>
              <Select
                value={filtros.origem}
                onValueChange={(origem) => setFiltros({ ...filtros, origem: origem as KanbanFilters["origem"] })}
              >
                <SelectTrigger className="h-9 rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="SINCRONIZACAO_WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="ANUNCIO_CTWA">Anúncios</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {temFiltroAtivo && (
              <button
                type="button"
                onClick={() => {
                  setFiltros({ status: "todos", gravidade: "todas", tipo: "todos", pdv: null, origem: "todos" });
                  setBusca("");
                }}
                className="w-full text-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Limpar filtros
              </button>
            )}
          </PopoverContent>
        </Popover>

        <div className="flex-1" />

        {/* Novo negócio */}
        <Button
          onClick={() => onDialogNovoNegocioChange(true)}
          className="h-10 rounded-xl bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Novo negócio
        </Button>

        {/* Toggle métricas */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMostrarMetricas(!mostrarMetricas)}
          className="h-10 rounded-xl text-[var(--text-secondary)]"
        >
          {mostrarMetricas ? (
            <ChevronUp className="mr-1.5 h-4 w-4" />
          ) : (
            <ChevronDown className="mr-1.5 h-4 w-4" />
          )}
          Métricas
        </Button>
      </div>

      {/* Métricas colapsáveis */}
      {mostrarMetricas && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Negócios</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{totalNegocios}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Total pipeline</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPipeline)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Parados</p>
              <p className="mt-1 text-xl font-semibold text-[var(--danger)]">{negociosParados}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Urgências</p>
              <p className="mt-1 text-xl font-semibold text-[var(--warning)]">{pendenciasCriticas}</p>
            </div>
          </div>
          {kpis.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3 border-t border-[var(--border-subtle)] pt-3">
              {kpis.map((kpi) => (
                <span key={kpi.id} className="text-xs text-[var(--text-secondary)]">
                  {kpi.label}: <strong className="text-[var(--text-primary)]">{kpi.valor}</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
