"use client";

import { cn } from "@/lib/utils";
import { toggleContatoSelecionado, type ContatoDisponivelNegocio } from "./kanban-header.utils";

type ContatoPickerNegocioProps = {
  contatos: ContatoDisponivelNegocio[];
  carregando: boolean;
  selecionados: string[];
  setSelecionados: (ids: string[]) => void;
};

export function ContatoPickerNegocio({ contatos, carregando, selecionados, setSelecionados }: ContatoPickerNegocioProps) {
  return (
    <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-glass)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Leads vinculados</p>
          <p className="text-xs text-[var(--text-secondary)]">Opcional. Selecione contatos que já fazem parte deste negócio.</p>
        </div>
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
          {selecionados.length} selecionado{selecionados.length === 1 ? "" : "s"}
        </span>
      </div>

      {carregando ? (
        <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          Carregando leads disponíveis...
        </div>
      ) : contatos.length === 0 ? (
        <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          Nenhum lead disponível para vincular.
        </div>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {contatos.map((contato) => {
            const selecionado = selecionados.includes(contato.id);
            return (
              <button
                key={contato.id}
                type="button"
                onClick={() => setSelecionados(toggleContatoSelecionado(selecionados, contato.id))}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2 text-left transition-colors",
                  selecionado
                    ? "border-[color:rgba(139,92,246,0.36)] bg-[color:rgba(139,92,246,0.12)] text-[var(--text-primary)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{contato.nome}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{contato.telefone}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-[11px]">
                  {contato.id_negocio ? (
                    <span className="rounded-full border border-[color:rgba(245,158,11,0.28)] bg-[color:rgba(245,158,11,0.12)] px-2 py-0.5 text-[color:#fde68a]">
                      Em outro negócio
                    </span>
                  ) : null}
                  <span className={cn("rounded-full px-2 py-0.5", selecionado ? "bg-[var(--brand-soft)] text-[var(--text-primary)]" : "bg-[color:rgba(255,255,255,0.04)] text-[var(--text-tertiary)]")}>
                    {selecionado ? "Selecionado" : "Adicionar"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-[var(--text-tertiary)]">Leads já vinculados a outro negócio serão transferidos para este cadastro.</p>
    </div>
  );
}
