import type { ReactNode } from "react";

type ChatInfoCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
};

export function ChatInfoCard({ icon, label, value, description }: ChatInfoCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        <span className="text-[var(--brand)]">{icon}</span>
        {label}
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-[var(--text-primary)]">{value}</div>
      <div className="mt-1 text-[11px] text-[var(--text-secondary)]">{description}</div>
    </div>
  );
}
