"use client";

import { type ReactNode } from "react";
import { Activity, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatFiltersContentProps = {
  filtroOrigem: "todos" | "anuncio" | "whatsapp" | "manual";
  setFiltroOrigem: (filtro: "todos" | "anuncio" | "whatsapp" | "manual") => void;
  filtroFila: "todas" | "sem_dono" | "sem_negocio";
  setFiltroFila: (filtro: "todas" | "sem_dono" | "sem_negocio") => void;
  filtroCanal: "todos" | "whatsapp" | "instagram";
  setFiltroCanal: (filtro: "todos" | "whatsapp" | "instagram") => void;
  totalOrphans: number;
  totalSemDono: number;
  totalSemNegocio: number;
  sseConectado: boolean;
  ultimoSyncLabel: string;
  erro: string | null;
  filtrosAtivos: number;
  onFechar?: () => void;
};

export function ChatFiltersContent({
  filtroOrigem,
  setFiltroOrigem,
  filtroFila,
  setFiltroFila,
  filtroCanal,
  setFiltroCanal,
  totalOrphans,
  totalSemDono,
  totalSemNegocio,
  sseConectado,
  ultimoSyncLabel,
  erro,
  filtrosAtivos,
  onFechar,
}: ChatFiltersContentProps) {
  const limparTudo = () => {
    setFiltroOrigem("todos");
    setFiltroFila("todas");
    setFiltroCanal("todos");
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-[var(--border-subtle)] bg-[var(--surface-elevated)]/92 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Filtros</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {filtrosAtivos > 0 ? `${filtrosAtivos} ativo(s)` : "Sem filtros ativos"}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={limparTudo}
            className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Limpar tudo
          </button>
          {onFechar ? (
            <button
              type="button"
              onClick={onFechar}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              aria-label="Fechar filtros"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <QuickMetric label="Novos" value={String(totalOrphans)} icon={<Sparkles className="h-3 w-3" />} />
        <QuickMetric label="Sem dono" value={String(totalSemDono)} />
        <QuickMetric label="Sem negocio" value={String(totalSemNegocio)} accent="info" />
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
        <FilterGroup label="Origem">
          <FilterPill label="Todos" active={filtroOrigem === "todos"} onClick={() => setFiltroOrigem("todos")} />
          <FilterPill label="Anuncio" active={filtroOrigem === "anuncio"} tone="info" onClick={() => setFiltroOrigem("anuncio")} />
          <FilterPill label="WhatsApp" active={filtroOrigem === "whatsapp"} tone="success" onClick={() => setFiltroOrigem("whatsapp")} />
          <FilterPill label="Manual" active={filtroOrigem === "manual"} tone="secondary" onClick={() => setFiltroOrigem("manual")} />
        </FilterGroup>

        <FilterGroup label="Fila">
          <FilterPill label="Fila limpa" active={filtroFila === "todas"} onClick={() => setFiltroFila("todas")} />
          <FilterPill label={`Sem dono ${totalSemDono}`} active={filtroFila === "sem_dono"} tone="secondary" onClick={() => setFiltroFila("sem_dono")} />
          <FilterPill label={`Sem negocio ${totalSemNegocio}`} active={filtroFila === "sem_negocio"} tone="info" onClick={() => setFiltroFila("sem_negocio")} />
        </FilterGroup>

        <FilterGroup label="Canal">
          <FilterPill label="Todos canais" active={filtroCanal === "todos"} onClick={() => setFiltroCanal("todos")} />
          <FilterPill label="Instagram" active={filtroCanal === "instagram"} tone="secondary" onClick={() => setFiltroCanal("instagram")} />
          <FilterPill label="WhatsApp" active={filtroCanal === "whatsapp"} tone="success" onClick={() => setFiltroCanal("whatsapp")} />
        </FilterGroup>
      </div>

      <div className="mt-3 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Sync
          </span>
          <span className={cn("font-medium", sseConectado ? "text-[var(--success)]" : "text-[var(--warning)]")}>
            {sseConectado ? "Online" : "Reconnecting"}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span>Ultimo sync</span>
          <span className="font-medium text-[var(--text-primary)]">{ultimoSyncLabel}</span>
        </div>
        {erro ? (
          <p className="mt-1 text-[var(--danger)]" aria-live="polite">
            {erro}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function QuickMetric({
  label,
  value,
  accent = "secondary",
  icon,
}: {
  label: string;
  value: string;
  accent?: "info" | "secondary";
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] border px-2 py-1.5",
        accent === "info"
          ? "border-[color:rgba(56,189,248,0.16)] bg-[color:rgba(56,189,248,0.08)]"
          : "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)]",
      )}
    >
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

type FilterPillProps = {
  label: string;
  active: boolean;
  tone?: "info" | "success" | "secondary";
  onClick: () => void;
};

function FilterPill({ label, active, tone = "secondary", onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
        active
          ? tone === "success"
            ? "border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.14)] text-[var(--success)]"
            : tone === "info"
              ? "border-[color:rgba(56,189,248,0.24)] bg-[color:rgba(56,189,248,0.14)] text-[var(--info)]"
              : "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)]"
          : "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.01)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
      )}
    >
      {label}
    </button>
  );
}
