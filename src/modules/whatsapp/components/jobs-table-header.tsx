import type { ReactNode } from "react";
import { AlertCircle, Clock, Loader2, Send, TimerReset } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterType } from "./jobs-table.utils";

function FilterPill({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)]",
        active
          ? "border-[color:rgba(139,92,246,0.24)] bg-[var(--brand-soft)] text-[var(--text-primary)] shadow-[0_16px_40px_-28px_rgba(139,92,246,0.65)]"
          : "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-secondary)] hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[color:rgba(255,255,255,0.06)] hover:text-[var(--text-primary)]",
      )}
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
          active ? "bg-[color:rgba(255,255,255,0.08)] text-[var(--text-primary)]" : "bg-[color:rgba(255,255,255,0.04)] text-[var(--text-secondary)]",
        )}
      >
        {count}
      </span>
    </button>
  );
}

type JobsTableHeaderProps = {
  filtro: FilterType;
  counts: Record<FilterType, number>;
  resumoAgendados: number;
  onFiltroChange: (filtro: FilterType) => void;
};

export function JobsTableHeader({ filtro, counts, resumoAgendados, onFiltroChange }: JobsTableHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[rgba(56,189,248,0.18)] bg-[rgba(56,189,248,0.12)] text-[var(--info)] shadow-[0_16px_36px_-24px_rgba(56,189,248,0.7)]">
          <TimerReset className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-semibold tracking-tight text-[var(--text-primary)]">Fila de envios em tempo real</p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{resumoAgendados} jobs agendados</p>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <FilterPill active={filtro === "todos"} onClick={() => onFiltroChange("todos")} icon={<TimerReset className="h-3 w-3" />} label="Todos" count={counts.todos} />
        <FilterPill active={filtro === "falhas"} onClick={() => onFiltroChange("falhas")} icon={<AlertCircle className="h-3 w-3" />} label="Falhas" count={counts.falhas} />
        <FilterPill active={filtro === "pendentes"} onClick={() => onFiltroChange("pendentes")} icon={<Clock className="h-3 w-3" />} label="Pendentes" count={counts.pendentes} />
        <FilterPill active={filtro === "processando"} onClick={() => onFiltroChange("processando")} icon={<Loader2 className="h-3 w-3" />} label="Processando" count={counts.processando} />
        <FilterPill active={filtro === "enviados"} onClick={() => onFiltroChange("enviados")} icon={<Send className="h-3 w-3" />} label="Enviados" count={counts.enviados} />
      </div>
    </div>
  );
}
