"use client";

import { Button } from "@/components/ui/button";
import type { TooltipRenderProps } from "@/modules/onboarding/types";

export function OnboardingTooltip({
  index,
  isLastStep,
  onNext,
  onPrev,
  onSkip,
  size,
  step,
}: TooltipRenderProps) {
  return (
    <div
      className="relative w-[min(92vw,420px)] overflow-hidden rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))] text-[var(--text-primary)] shadow-[var(--shadow-overlay)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_28%)]" />

      <div className="relative p-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:rgba(139,92,246,0.2)] bg-[color:rgba(139,92,246,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Tour guiado
        </div>
        <div className="space-y-3">
          <p id="tour-title" className="text-lg font-semibold leading-tight tracking-tight text-[var(--text-primary)]">
            {step.title}
          </p>
          <p id="tour-description" className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {step.content}
          </p>
        </div>

        <div className="relative mt-6 flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-4">
          <div className="text-sm font-medium text-[var(--text-tertiary)]" aria-live="polite">
            <span className="sr-only">Passo </span>
            {index + 1} de {size}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onSkip}
              variant="outline"
              size="sm"
              aria-label="Pular tour"
            >
              Pular
            </Button>

            {index > 0 ? (
              <Button
                type="button"
                onClick={onPrev}
                variant="outline"
                size="sm"
                aria-label="Voltar para passo anterior"
              >
                Voltar
              </Button>
            ) : null}

            <Button
              type="button"
              onClick={onNext}
              size="sm"
              aria-label={isLastStep ? "Concluir tour" : "Avançar para próximo passo"}
            >
              {isLastStep ? "Concluir" : "Continuar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
