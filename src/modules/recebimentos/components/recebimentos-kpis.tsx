import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Landmark } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import type { RecebimentosKpi } from "../types";

const icones: Record<RecebimentosKpi["tom"], ComponentType<{ className?: string }>> = {
  emerald: ArrowDownCircle,
  blue: Landmark,
  rose: AlertTriangle,
  amber: ArrowUpCircle,
};

const gradientes = {
  emerald: "border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--surface)]",
  blue: "border-[color-mix(in_srgb,var(--info)_30%,transparent)] bg-[var(--surface)]",
  rose: "border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[var(--surface)]",
  amber: "border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[var(--surface)]",
};

type RecebimentosKpisProps = {
  itens: RecebimentosKpi[];
  carregando: boolean;
};

export function RecebimentosKpis({ itens, carregando }: RecebimentosKpisProps) {
  if (carregando) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <div key={`recebimentos-kpi-${indice}`} className="h-32 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] animate-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {itens.map((item) => {
        const Icone = icones[item.tom];
        return (
          <article key={item.id} className={cn("relative overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-sm)]", gradientes[item.tom])}>
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{item.rotulo}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">{item.valor}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.apoio}</p>
                {item.tendencia ? <p className="mt-2 text-xs font-medium text-[var(--text-tertiary)]">{item.tendencia}</p> : null}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
                <Icone className="h-5 w-5 text-[var(--text-primary)]" />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
