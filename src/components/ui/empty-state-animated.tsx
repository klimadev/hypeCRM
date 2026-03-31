"use client";

import type { ReactNode } from "react";
import { Inbox, Users, MessageSquare, Target, Package, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

// === ICON MAP ===
const iconMap = {
  inbox: Inbox,
  users: Users,
  message: MessageSquare,
  target: Target,
  package: Package,
  zap: Zap,
  chart: BarChart3,
} as const;

type EmptyStateVariant = keyof typeof iconMap;

type EmptyStateAnimatedProps = {
  variant?: EmptyStateVariant;
  customIcon?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  className?: string;
};

export function EmptyStateAnimated({
  variant = "inbox",
  customIcon,
  titulo,
  descricao,
  acao,
  className,
}: EmptyStateAnimatedProps) {
  const IconComponent = iconMap[variant];

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-5 rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)] px-6 py-16 text-center",
        className,
      )}
    >
      {/* Floating icon */}
      <div className="relative">
        {customIcon ?? (
          <div className="relative animate-pulse-subtle">
            {/* Glow behind icon */}
            <div className="absolute inset-0 blur-xl opacity-20 bg-[var(--brand)] rounded-full scale-150" />
            <IconComponent className="relative h-16 w-16 text-[color:rgba(255,255,255,0.16)]" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Text */}
      <div>
        <p className="text-base font-semibold text-[var(--text-primary)]">{titulo}</p>
        {descricao ? (
          <p className="mt-1.5 max-w-xs text-sm text-[var(--text-secondary)]">{descricao}</p>
        ) : null}
      </div>

      {/* CTA */}
      {acao ? <div className="pt-1">{acao}</div> : null}
    </div>
  );
}
