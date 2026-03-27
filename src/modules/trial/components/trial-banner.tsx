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

  return (
    <div
      className={cn(
        "relative flex flex-wrap items-center gap-3 overflow-hidden rounded-[var(--radius-card)] border px-4 py-3 shadow-[var(--shadow-md)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-productive)]",
        estilo.container,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.08),transparent_32%)]" />
      <div className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border shadow-[var(--shadow-sm)]", estilo.icone)}>
        <Icone className="h-4 w-4" />
      </div>

      <div className="relative min-w-0 flex-1">
        <p className={cn("text-sm font-semibold tracking-tight", estilo.titulo)}>
          {dados.trial_expirado
            ? "Trial expirado"
            : `Trial: ${dados.dias_restantes} dia${dados.dias_restantes !== 1 ? "s" : ""} restante${dados.dias_restantes !== 1 ? "s" : ""}`}
        </p>
        <p className={cn("text-xs leading-5", estilo.descricao)}>
          {dados.trial_expirado ? `Expirou em ${dados.data_expiracao}.` : `Expira em ${dados.data_expiracao}. ${dados.mensagem}`}
        </p>
      </div>

      <div className="relative flex items-center gap-2">
        {!dados.trial_expirado && (
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", estilo.badge)}>{dados.dias_restantes}d</span>
        )}
        <a
          href="https://hypecrm.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] px-3 text-xs font-medium",
            "bg-[var(--brand)] text-white shadow-[var(--shadow-sm)]",
            "transition-all duration-[var(--duration-fast)] ease-[var(--ease-productive)]",
            "hover:bg-[var(--brand-strong)] hover:shadow-[var(--shadow-md)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
            "active:scale-[0.98]"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Upgrade
        </a>
      </div>
    </div>
  );
}
