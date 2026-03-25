"use client";

import { ShieldX, Sparkles } from "lucide-react";
import { useTrialStatus } from "../hooks/use-trial-status";

export function TrialBlocker() {
  const { dados, carregando } = useTrialStatus();

  if (carregando || !dados || !dados.trial_expirado) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 max-w-md w-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-8 text-center shadow-[var(--shadow-lg)]">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[var(--danger)] bg-[var(--danger)]/10">
          <ShieldX className="h-8 w-8 text-[var(--danger)]" />
        </div>

        <h2 className="mb-3 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
          Trial Expirado
        </h2>

        <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">
          Seu período de trial terminou. Para continuar usando o HYPE CRM e não perder
          seus dados, faça o upgrade agora.
        </p>

        <a
          href="https://hypecrm.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-fast)] hover:bg-[var(--brand-strong)] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" />
          Fazer Upgrade
        </a>

        <p className="mt-4 text-xs text-[var(--text-tertiary)]">
          Seus dados foram salvos. Retorne quando estiver pronto.
        </p>
      </div>
    </div>
  );
}