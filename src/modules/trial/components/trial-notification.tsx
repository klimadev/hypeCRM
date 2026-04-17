"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrialStatus } from "../hooks/use-trial-status";

function calcularVariante(dados: { trial_ativo: boolean; trial_expirado: boolean; dias_restantes: number }) {
  if (dados.trial_expirado) return "expirado";
  if (!dados.trial_ativo) return "ativo";
  if (dados.dias_restantes <= 3) return "critico";
  if (dados.dias_restantes <= 7) return "atencao";
  return "informativo";
}

const estilosVariante = {
  informativo: {
    container: "border-[color:color-mix(in_oklab,var(--info)_30%,var(--border-subtle)_70%)] bg-[var(--surface)]",
    icone: "border-[color:color-mix(in_oklab,var(--info)_28%,var(--border-subtle)_72%)] bg-[color:color-mix(in_oklab,var(--info)_14%,var(--surface-elevated)_86%)] text-[var(--info)]",
    badge: "border-[color:color-mix(in_oklab,var(--info)_30%,var(--border-subtle)_70%)] bg-[color:color-mix(in_oklab,var(--info)_14%,var(--surface-elevated)_86%)] text-[var(--info)]",
    IconeComponent: Clock,
  },
  atencao: {
    container: "border-[color:color-mix(in_oklab,var(--warning)_30%,var(--border-subtle)_70%)] bg-[var(--surface)]",
    icone: "border-[color:color-mix(in_oklab,var(--warning)_28%,var(--border-subtle)_72%)] bg-[color:color-mix(in_oklab,var(--warning)_14%,var(--surface-elevated)_86%)] text-[var(--warning)]",
    badge: "border-[color:color-mix(in_oklab,var(--warning)_30%,var(--border-subtle)_70%)] bg-[color:color-mix(in_oklab,var(--warning)_14%,var(--surface-elevated)_86%)] text-[var(--warning)]",
    IconeComponent: AlertTriangle,
  },
  critico: {
    container: "border-[color:color-mix(in_oklab,var(--danger)_34%,var(--border-subtle)_66%)] bg-[var(--surface)]",
    icone: "border-[color:color-mix(in_oklab,var(--danger)_30%,var(--border-subtle)_70%)] bg-[color:color-mix(in_oklab,var(--danger)_14%,var(--surface-elevated)_86%)] text-[var(--danger)]",
    badge: "border-[color:color-mix(in_oklab,var(--danger)_30%,var(--border-subtle)_70%)] bg-[color:color-mix(in_oklab,var(--danger)_14%,var(--surface-elevated)_86%)] text-[var(--danger)]",
    IconeComponent: AlertCircle,
  },
  expirado: {
    container: "border-[color:color-mix(in_oklab,var(--danger)_40%,var(--border-subtle)_60%)] bg-[var(--surface)]",
    icone: "border-[color:color-mix(in_oklab,var(--danger)_34%,var(--border-subtle)_66%)] bg-[color:color-mix(in_oklab,var(--danger)_18%,var(--surface-elevated)_82%)] text-[var(--danger)]",
    badge: "border-[color:color-mix(in_oklab,var(--danger)_34%,var(--border-subtle)_66%)] bg-[color:color-mix(in_oklab,var(--danger)_18%,var(--surface-elevated)_82%)] text-[var(--danger)]",
    IconeComponent: AlertCircle,
  },
  ativo: {
    container: "border-[color:color-mix(in_oklab,var(--success)_30%,var(--border-subtle)_70%)] bg-[var(--surface)]",
    icone: "border-[color:color-mix(in_oklab,var(--success)_28%,var(--border-subtle)_72%)] bg-[color:color-mix(in_oklab,var(--success)_14%,var(--surface-elevated)_86%)] text-[var(--success)]",
    badge: "border-[color:color-mix(in_oklab,var(--success)_30%,var(--border-subtle)_70%)] bg-[color:color-mix(in_oklab,var(--success)_14%,var(--surface-elevated)_86%)] text-[var(--success)]",
    IconeComponent: CheckCircle2,
  },
} as const;

export function TrialNotification() {
  const { dados, carregando } = useTrialStatus();
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    if (carregando || !dados) return;

    const timeout = window.setTimeout(() => setOculto(true), 6000);
    return () => window.clearTimeout(timeout);
  }, [carregando, dados]);

  if (carregando || !dados || oculto || dados.status === "ATIVA") return null;

  const variante = calcularVariante(dados);
  const estilo = estilosVariante[variante];
  const Icone = estilo.IconeComponent;
  const titulo = dados.trial_expirado
    ? "Trial expirou"
    : `Trial termina em ${dados.dias_restantes} dia${dados.dias_restantes !== 1 ? "s" : ""}`;
  const descricao = dados.trial_expirado
    ? `Expirou em ${dados.data_expiracao}. ${dados.mensagem}`
    : `${dados.data_expiracao ? `Até ${dados.data_expiracao}.` : ""} ${dados.mensagem}`.trim();

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-50 w-[calc(100vw-1.5rem)] max-w-xl -translate-x-1/2 px-0 sm:top-5 sm:w-[calc(100vw-2rem)]">
      <div
        className={cn(
          "pointer-events-auto overflow-hidden rounded-[var(--radius-card)] border px-4 py-3 shadow-[var(--shadow-overlay)] backdrop-blur-md transition-all duration-[var(--duration-overlay)] ease-[var(--ease-productive)]",
          estilo.container,
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border", estilo.icone)}>
              <Icone className="h-4 w-4" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">{titulo}</p>
                {!dados.trial_expirado && (
                  <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", estilo.badge)}>
                    {dados.dias_restantes}d
                  </span>
                )}
              </div>
              <p className="max-w-[62ch] text-xs leading-5 text-[var(--text-secondary)]">{descricao}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <a
              href="https://hypecrm.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--brand)] px-3 text-xs font-medium text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-productive)] hover:bg-[var(--brand-strong)] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] active:scale-[0.98]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Fazer upgrade
            </a>

            <button
              type="button"
              aria-label="Fechar notificação do trial"
              onClick={() => setOculto(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-soft)] text-[var(--text-tertiary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-soft-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
