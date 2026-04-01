"use client";

import { Building2, CheckCircle2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UseEquipeModuleReturn } from "../types";

type EquipePdvOverviewProps = {
  vm: UseEquipeModuleReturn;
};

export function EquipePdvOverview({ vm }: EquipePdvOverviewProps) {
  const totalAtivos = vm.pdvs.reduce((acc, pdv) => acc + (pdv.funcionarios?.length ?? 0), 0);

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-4 md:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Presenca por PDV</p>
          <p className="text-sm text-[var(--text-secondary)]">Clique em um PDV para ver os membros daquele time</p>
        </div>
        {vm.idPdvFiltro ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={() => vm.atualizarParametrosUrl({ id_pdv: null }, true)}
          >
            Ver todos PDVs
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          className={cn(
            "rounded-xl border p-3 text-left transition",
            !vm.idPdvFiltro ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--text-primary)]" : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80",
          )}
          onClick={() => vm.atualizarParametrosUrl({ id_pdv: null }, true)}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Todos</span>
            <Users className="h-4 w-4 text-[var(--text-tertiary)]" />
          </div>
          <p className="mt-3 text-xl font-bold text-[var(--text-primary)]">{totalAtivos}</p>
          <p className={cn("text-xs", !vm.idPdvFiltro ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]")}>colaboradores ativos</p>
        </button>

        {vm.pdvs.map((pdv) => {
          const selecionado = vm.idPdvFiltro === pdv.id;
          const total = pdv.funcionarios?.length ?? 0;

          return (
            <button
              key={pdv.id}
              type="button"
              className={cn(
                "rounded-xl border p-3 text-left transition",
                selecionado ? "border-[var(--success)] bg-[color:rgba(16,185,129,0.1)]" : "border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]/80",
              )}
              onClick={() => vm.atualizarParametrosUrl({ id_pdv: pdv.id }, true)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)]">{pdv.nome}</span>
                {selecionado ? <CheckCircle2 className="h-4 w-4 text-[var(--success)]" /> : <Building2 className="h-4 w-4 text-[var(--text-tertiary)]" />}
              </div>
              <p className="mt-3 text-xl font-bold text-[var(--text-primary)]">{total}</p>
              <p className="text-xs text-[var(--text-tertiary)]">membros ativos</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
