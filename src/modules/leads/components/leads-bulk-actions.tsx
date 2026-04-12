"use client";

import { Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type LeadsBulkActionsProps = {
  totalSelecionados: number;
  totalFiltrados: number;
  todosFiltradosSelecionados: boolean;
  onSelecionarTodosFiltrados: () => void;
  onLimparSelecao: () => void;
  onDisparar: () => void;
};

export function LeadsBulkActions({
  totalSelecionados,
  totalFiltrados,
  todosFiltradosSelecionados,
  onSelecionarTodosFiltrados,
  onLimparSelecao,
  onDisparar,
}: LeadsBulkActionsProps) {
  if (totalSelecionados <= 0) {
    return null;
  }

  return (
    <section className="sticky bottom-3 z-20 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-[var(--shadow-lg)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)]">
          {totalSelecionados} selecionados
        </span>
        {!todosFiltradosSelecionados && totalFiltrados > totalSelecionados ? (
          <Button type="button" variant="ghost" size="sm" className="h-8" onClick={onSelecionarTodosFiltrados}>
            Selecionar todos os filtrados ({totalFiltrados})
          </Button>
        ) : null}
        <Button type="button" variant="ghost" size="sm" className="h-8" onClick={onLimparSelecao}>
          <X className="mr-1 h-3.5 w-3.5" />
          Limpar
        </Button>
        <div className="ml-auto">
          <Button type="button" onClick={onDisparar} className="h-9 bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]">
            <Megaphone className="mr-2 h-4 w-4" />
            Disparar campanha
          </Button>
        </div>
      </div>
    </section>
  );
}
