"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    container: "border-[color:rgba(56,189,248,0.22)] bg-[linear-gradient(135deg,rgba(56,189,248,0.1),rgba(17,17,19,0.96))]",
    icone: "border-[color:rgba(56,189,248,0.2)] bg-[color:rgba(56,189,248,0.12)] text-[var(--info)]",
    titulo: "text-[var(--text-primary)]",
    descricao: "text-[var(--text-secondary)]",
    badge: "border-[color:rgba(56,189,248,0.2)] bg-[color:rgba(56,189,248,0.12)] text-[var(--info)]",
    IconeComponent: Clock,
  },
  atencao: {
    container: "border-[color:rgba(245,158,11,0.22)] bg-[linear-gradient(135deg,rgba(245,158,11,0.1),rgba(17,17,19,0.96))]",
    icone: "border-[color:rgba(245,158,11,0.2)] bg-[color:rgba(245,158,11,0.12)] text-[var(--warning)]",
    titulo: "text-[var(--text-primary)]",
    descricao: "text-[var(--text-secondary)]",
    badge: "border-[color:rgba(245,158,11,0.2)] bg-[color:rgba(245,158,11,0.12)] text-[var(--warning)]",
    IconeComponent: AlertTriangle,
  },
  critico: {
    container: "border-[color:rgba(244,63,94,0.22)] bg-[linear-gradient(135deg,rgba(244,63,94,0.1),rgba(17,17,19,0.96))]",
    icone: "border-[color:rgba(244,63,94,0.2)] bg-[color:rgba(244,63,94,0.12)] text-[var(--danger)]",
    titulo: "text-[var(--text-primary)]",
    descricao: "text-[var(--text-secondary)]",
    badge: "border-[color:rgba(244,63,94,0.2)] bg-[color:rgba(244,63,94,0.12)] text-[var(--danger)]",
    IconeComponent: AlertCircle,
  },
  expirado: {
    container: "border-[color:rgba(244,63,94,0.28)] bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(17,17,19,0.96))]",
    icone: "border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.16)] text-[var(--danger)]",
    titulo: "text-[var(--text-primary)]",
    descricao: "text-[var(--text-secondary)]",
    badge: "border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.16)] text-[var(--danger)]",
    IconeComponent: AlertCircle,
  },
  ativo: {
    container: "border-[color:rgba(16,185,129,0.22)] bg-[linear-gradient(135deg,rgba(16,185,129,0.1),rgba(17,17,19,0.96))]",
    icone: "border-[color:rgba(16,185,129,0.2)] bg-[color:rgba(16,185,129,0.12)] text-[var(--success)]",
    titulo: "text-[var(--text-primary)]",
    descricao: "text-[var(--text-secondary)]",
    badge: "border-[color:rgba(16,185,129,0.2)] bg-[color:rgba(16,185,129,0.12)] text-[var(--success)]",
    IconeComponent: CheckCircle2,
  },
} as const;

export function TrialBanner() {
  const { dados, carregando } = useTrialStatus();

  if (carregando || !dados || dados.status === "ATIVA") return null;

  const variante = calcularVariante(dados);
  const estilo = estilosVariante[variante];
  const Icone = estilo.IconeComponent;
  const titulo = dados.trial_expirado
    ? "Trial expirado"
    : `Trial termina em ${dados.dias_restantes} dia${dados.dias_restantes !== 1 ? "s" : ""}`;
  const descricao = dados.trial_expirado
    ? `Expirou em ${dados.data_expiracao}. ${dados.mensagem}`
    : `${dados.data_expiracao ? `Até ${dados.data_expiracao}.` : ""} ${dados.mensagem}`.trim();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border px-4 py-3.5 shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-productive)]",
        estilo.container,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.05),transparent_36%)]" />

      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border", estilo.icone)}>
            <Icone className="h-4 w-4" />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn("text-sm font-semibold tracking-tight", estilo.titulo)}>{titulo}</p>
              {!dados.trial_expirado && (
                <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", estilo.badge)}>
                  {dados.dias_restantes}d
                </span>
              )}
            </div>
            <p className={cn("max-w-[62ch] text-xs leading-5 text-balance", estilo.descricao)}>{descricao}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start lg:self-center">
          <Button
            asChild
            size="sm"
            className="h-9 gap-2 rounded-[var(--radius-control)] px-3 text-xs"
          >
            <a href="https://hypecrm.com.br" target="_blank" rel="noopener noreferrer">
              <Sparkles className="h-3.5 w-3.5" />
              Fazer upgrade
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
