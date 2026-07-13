"use client";

import { useState } from "react";
import { Filter, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { KanbanFilters, Pipeline } from "../types";
type KanbanHeaderMobileProps = {
  pipelines: Pipeline[];
  pipelineSelecionadaId: string;
  setPipelineSelecionadaId: (id: string) => void;
  onDialogNovoNegocioChange: (aberto: boolean) => void;
  filtros: KanbanFilters;
  setFiltros: (filtros: KanbanFilters) => void;
  busca: string;
  setBusca: (busca: string) => void;
};

export function KanbanHeaderMobile({
  pipelines,
  pipelineSelecionadaId,
  setPipelineSelecionadaId,
  onDialogNovoNegocioChange,
  filtros,
  setFiltros,
  busca,
  setBusca,
}: KanbanHeaderMobileProps) {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const temFiltroAtivo = busca || filtros.status !== "todos" || filtros.origem !== "todos";

  return (
    <div className="space-y-2">
      {/* Seletor + ações */}
      <div className="flex items-center gap-2">
        <Select value={pipelineSelecionadaId} onValueChange={setPipelineSelecionadaId}>
          <SelectTrigger className="h-10 flex-1 rounded-xl border-[var(--border-subtle)] bg-[var(--surface)]">
            <SelectValue placeholder="Funil" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="icon"
          variant="outline"
          onClick={() => setFiltrosAbertos(!filtrosAbertos)}
          className={cn(
            "h-10 w-10 rounded-xl border-[var(--border-subtle)]",
            temFiltroAtivo && "border-[var(--brand)] text-[var(--brand)]"
          )}
        >
          <Filter className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => onDialogNovoNegocioChange(true)}
          className="h-10 rounded-xl bg-[var(--brand)] text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar negócio..."
          className="h-10 w-full rounded-xl border-[var(--border-subtle)] bg-[var(--surface)] pl-9 text-sm"
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filtros popover */}
      {filtrosAbertos && (
        <div className="space-y-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">Status</label>
            <Select
              value={filtros.status}
              onValueChange={(s) => setFiltros({ ...filtros, status: s as KanbanFilters["status"] })}
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
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">Origem</label>
            <Select
              value={filtros.origem}
              onValueChange={(o) => setFiltros({ ...filtros, origem: o as KanbanFilters["origem"] })}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltros({ status: "todos", gravidade: "todas", tipo: "todos", pdv: null, origem: "todos" });
                setBusca("");
                setFiltrosAbertos(false);
              }}
              className="w-full text-xs"
            >
              Limpar filtros
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltrosAbertos(false)}
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      )}
    </div>
  );
}
