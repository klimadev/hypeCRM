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
  emerald: "border-[color:rgba(16,185,129,0.18)] bg-[linear-gradient(135deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))]",
  blue: "border-[color:rgba(56,189,248,0.18)] bg-[linear-gradient(135deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))]",
  rose: "border-[color:rgba(244,63,94,0.18)] bg-[linear-gradient(135deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))]",
  amber: "border-[color:rgba(245,158,11,0.18)] bg-[linear-gradient(135deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))]",
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
          <div key={`recebimentos-kpi-${indice}`} className="h-32 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface)] animate-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {itens.map((item) => {
        const Icone = icones[item.tom];
        return (
          <article key={item.id} className={cn("relative overflow-hidden rounded-[16px] border p-4 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]", gradientes[item.tom])}>
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[color:rgba(139,92,246,0.12)] blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{item.rotulo}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">{item.valor}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.apoio}</p>
                {item.tendencia ? <p className="mt-2 text-xs font-medium text-[var(--text-tertiary)]">{item.tendencia}</p> : null}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
                <Icone className="h-5 w-5 text-[var(--text-primary)]" />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
