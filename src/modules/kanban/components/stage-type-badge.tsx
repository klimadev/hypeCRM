"use client";

import { cn } from "@/lib/utils";
import type { TipoEstagio } from "../types";
import { CORES_ESTAGIO } from "../types";

interface StageTypeBadgeProps {
  tipo: TipoEstagio;
  className?: string;
}

const CORES_DEFAULT = {
  bg: "bg-[var(--surface-soft)]",
  text: "text-[var(--text-secondary)]",
  border: "border-[var(--border-strong)]",
  label: "Indefinido",
};

export function StageTypeBadge({ tipo, className }: StageTypeBadgeProps) {
  const cores = CORES_ESTAGIO[tipo] ?? CORES_DEFAULT;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cores.bg,
        cores.text,
        cores.border,
        className
      )}
    >
      {cores.label}
    </span>
  );
}
