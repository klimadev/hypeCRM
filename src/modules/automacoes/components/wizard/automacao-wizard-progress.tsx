"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PassoAutomacaoWizard } from "../../types";

const PASSOS = [
  { numero: 1, titulo: "Gatilho" },
  { numero: 2, titulo: "Ação" },
  { numero: 3, titulo: "Revisão" },
] as const;

type AutomacaoWizardProgressProps = {
  passo: PassoAutomacaoWizard;
};

export function AutomacaoWizardProgress({ passo }: AutomacaoWizardProgressProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {PASSOS.map((item) => (
        <div key={item.numero} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors duration-[var(--duration-fast)]",
              passo === item.numero
                ? "bg-[var(--brand)] text-[var(--primary-foreground)] shadow-[var(--shadow-glow)]"
                : passo > item.numero
                  ? "border border-[rgba(16,185,129,0.18)] bg-[rgba(16,185,129,0.14)] text-[var(--success)]"
                  : "border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-tertiary)]",
            )}
          >
            {passo > item.numero ? <Check className="h-4 w-4" /> : item.numero}
          </div>
          <span className={cn("text-sm", passo >= item.numero ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
            {item.titulo}
          </span>
          {item.numero < 3 ? <div className="ml-2 h-px w-8 bg-[var(--border-subtle)]" /> : null}
        </div>
      ))}
    </div>
  );
}
