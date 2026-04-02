import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "slate" | "emerald" | "blue" | "amber" | "rose";

type ModulePageHeaderProps = {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  iconTone?: Tone;
  badges?: ReactNode[];
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

const toneStyles: Record<Tone, { wrap: string; icon: string }> = {
  slate: {
    wrap: "border border-[var(--border-subtle)] bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] text-[var(--text-secondary)] shadow-[var(--shadow-sm)]",
    icon: "text-[var(--text-secondary)]",
  },
  emerald: {
    wrap: "border border-[color:rgba(16,185,129,0.24)] bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(16,185,129,0.08))] shadow-[0_18px_40px_-24px_rgba(16,185,129,0.55)]",
    icon: "text-[var(--success)]",
  },
  blue: {
    wrap: "border border-[color:rgba(56,189,248,0.24)] bg-[linear-gradient(135deg,rgba(56,189,248,0.24),rgba(34,211,238,0.08))] shadow-[0_18px_40px_-24px_rgba(56,189,248,0.45)]",
    icon: "text-[var(--info)]",
  },
  amber: {
    wrap: "border border-[color:rgba(245,158,11,0.24)] bg-[linear-gradient(135deg,rgba(245,158,11,0.24),rgba(245,158,11,0.08))] shadow-[0_18px_40px_-24px_rgba(245,158,11,0.45)]",
    icon: "text-[var(--warning)]",
  },
  rose: {
    wrap: "border border-[color:rgba(244,63,94,0.24)] bg-[linear-gradient(135deg,rgba(244,63,94,0.24),rgba(244,63,94,0.08))] shadow-[0_18px_40px_-24px_rgba(244,63,94,0.45)]",
    icon: "text-[var(--danger)]",
  },
};

export function ModulePageHeader({
  title,
  subtitle,
  icon,
  iconTone = "slate",
  badges,
  actions,
  children,
  className,
}: ModulePageHeaderProps) {
  const tone = toneStyles[iconTone];

  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.95),rgba(12,12,14,0.93))] px-3.5 py-3.5 text-[var(--text-primary)] shadow-[var(--shadow-sm)] md:px-5 md:py-4",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_30%)] opacity-70" />
      <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex items-start gap-3 md:items-center md:gap-4">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] md:h-11 md:w-11", tone.wrap)}>
            <span className={cn(tone.icon)}>{icon}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)] md:text-2xl">{title}</h1>
            {subtitle ? <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)] md:text-sm md:leading-6">{subtitle}</p> : null}
            {badges?.length ? <div className="mt-2 flex flex-wrap items-center gap-2">{badges}</div> : null}
          </div>
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {actions}
          </div>
        ) : null}
        {children}
      </div>
    </header>
  );
}
