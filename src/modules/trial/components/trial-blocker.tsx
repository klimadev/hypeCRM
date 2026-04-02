"use client";

import { ShieldX, Sparkles } from "lucide-react";
import { useTrialStatus } from "../hooks/use-trial-status";

export function TrialBlocker() {
  const { dados, carregando } = useTrialStatus();

  if (carregando || !dados || !dados.trial_expirado) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6 text-center shadow-[var(--shadow-overlay)] sm:p-8">
        <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[color:rgba(244,63,94,0.28)] bg-[color:rgba(244,63,94,0.12)]">
          <ShieldX className="h-7 w-7 text-[var(--danger)]" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
          Seu trial expirou
        </h2>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
          Para continuar acessando o HYPE CRM e manter seus dados disponíveis, faça o upgrade agora.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="https://hypecrm.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--brand)] px-4 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-fast)] hover:bg-[var(--brand-strong)] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            Fazer upgrade
          </a>
        </div>

        <p className="mt-4 text-xs text-[var(--text-tertiary)]">
          Seus dados foram salvos. Retorne quando estiver pronto.
        </p>
      </div>
    </div>
  );
}
