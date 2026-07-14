"use client";

import { Briefcase, Loader2, Megaphone, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type LeadsBulkActionsProps = {
  totalSelecionados: number;
  totalFiltrados: number;
  todosFiltradosSelecionados: boolean;
  carregando?: boolean;
  onSelecionarTodosFiltrados: () => void;
  onLimparSelecao: () => void;
  onDisparar: () => void;
  onConverterEmNegocios: () => void;
  onRemover: () => void;
};

export function LeadsBulkActions({
  totalSelecionados,
  totalFiltrados,
  todosFiltradosSelecionados,
  carregando = false,
  onSelecionarTodosFiltrados,
  onLimparSelecao,
  onDisparar,
  onConverterEmNegocios,
  onRemover,
}: LeadsBulkActionsProps) {
  if (totalSelecionados <= 0) {
    return null;
  }

  return (
    <>
      {/* ponytail: barra fixa que segue a tela, pb-24 no shell garante espa�o no final */}
      <section className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-subtle)] bg-[var(--surface)]/98 p-3 shadow-[var(--shadow-lg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)]">
            {carregando ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                {totalSelecionados} selecionados
              </span>
            ) : (
              totalSelecionados
            )}{" "}
            selecionados
          </span>
          {!carregando && !todosFiltradosSelecionados && totalFiltrados > totalSelecionados ? (
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onSelecionarTodosFiltrados}>
              Selecionar todos ({totalFiltrados})
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="sm" className="h-8" onClick={onLimparSelecao} disabled={carregando}>
            <X className="mr-1 h-3.5 w-3.5" />
            Limpar
          </Button>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button type="button" onClick={onRemover} variant="destructive" className="h-9" disabled={carregando}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir selecionados
            </Button>
            <Button type="button" onClick={onConverterEmNegocios} className="h-9 bg-[var(--success)] text-white hover:bg-[color-mix(in_srgb,var(--success)_80%,black)]" disabled={carregando}>
              <Briefcase className="mr-2 h-4 w-4" />
              Converter em negócios
            </Button>
            <Button type="button" onClick={onDisparar} className="h-9 bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]" disabled={carregando}>
              <Megaphone className="mr-2 h-4 w-4" />
              Disparar campanha
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
