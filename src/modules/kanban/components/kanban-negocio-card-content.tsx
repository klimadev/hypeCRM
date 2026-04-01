"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Clock, GripVertical, Megaphone, MessageCircle, PenLine, Users } from "lucide-react";
import { cn, formataMoeda } from "@/lib/utils";
import type { Estagio, Funcionario, Lead, PendenciaNegocioInfo } from "../types";
import {
  formatarTempoRelativoKanban,
  obterBadgeOrigemKanban,
  type SinalVisualNegocioKanban,
} from "./kanban-board.utils";
import {
  obterDiasParados,
  obterRotuloProximoPasso,
  obterRotuloTempoParado,
} from "../utils/apresentacao";

type KanbanNegocioCardContentProps = {
  negocio: Lead;
  estagio: Estagio;
  pendencias?: PendenciaNegocioInfo;
  funcionarios: Funcionario[];
  agoraMs: number;
  visualCue: SinalVisualNegocioKanban;
  compact: boolean;
  dragHandle?: ReactNode;
};

export function KanbanNegocioCardContent({
  negocio,
  estagio,
  pendencias,
  funcionarios,
  agoraMs,
  visualCue,
  compact,
  dragHandle,
}: KanbanNegocioCardContentProps) {
  const diasParados = obterDiasParados(negocio.atualizado_em, agoraMs);
  const origem = obterBadgeOrigemKanban(negocio.origem);
  const nomeResponsavel = funcionarios.find((item) => item.id === negocio.id_funcionario)?.nome || "Responsável";

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className={cn("min-w-0", compact ? "" : "space-y-0.5")}>
          <h3 className={cn("flex items-center gap-1.5 truncate font-semibold text-[var(--text-primary)]", compact ? "text-[15px]" : "text-base")}>
            {dragHandle ?? null}
            {negocio.nome}
          </h3>
          <p className={cn("text-[var(--text-secondary)]", compact ? "text-sm" : "text-xs")}>{negocio.telefone}</p>
        </div>

        <p className={cn("font-semibold text-[var(--success)]", compact ? "mt-3 text-lg" : "mt-2 text-lg")}>
          {formataMoeda(negocio.valor_oportunidade)}
        </p>

        <p className={cn("font-medium text-[var(--text-secondary)]", compact ? "mt-3 text-xs" : "mt-2 text-xs")}>
          {obterRotuloProximoPasso({ diasParados, estagio, pendencia: pendencias })}
        </p>

        <div className={cn("flex flex-wrap", compact ? "mt-3 gap-2" : "mt-2.5 gap-1.5")}>
          {origem ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border font-medium",
                compact ? "min-h-11 min-w-11 px-3 text-[11px]" : "px-2 py-0.5 text-xs",
                origem.tone === "anuncio" && (compact
                  ? "border-[var(--border-subtle)] text-[var(--text-secondary)]"
                  : "border-[color:rgba(139,92,246,0.28)] bg-[color:rgba(139,92,246,0.12)] text-[color:#ddd6fe]"),
                origem.tone === "whatsapp" && (compact
                  ? "border-[var(--border-subtle)] text-[var(--text-secondary)]"
                  : "border-[color:rgba(16,185,129,0.28)] bg-[color:rgba(16,185,129,0.12)] text-[color:#bbf7d0]"),
                origem.tone === "manual" && (compact
                  ? "border-[var(--border-subtle)] text-[var(--text-secondary)]"
                  : "border-[color:rgba(56,189,248,0.28)] bg-[color:rgba(56,189,248,0.12)] text-[color:#c8f3ff]"),
              )}
            >
              {origem.tone === "anuncio" ? <Megaphone className={cn(compact ? "h-3.5 w-3.5" : "h-3 w-3")} /> : null}
              {origem.tone === "whatsapp" ? <MessageCircle className={cn(compact ? "h-3.5 w-3.5" : "h-3 w-3")} /> : null}
              {origem.tone === "manual" ? <PenLine className={cn(compact ? "h-3.5 w-3.5" : "h-3 w-3")} /> : null}
              {origem.label}
            </span>
          ) : null}

          {diasParados > 3 && estagio.tipo !== "GANHO" && estagio.tipo !== "PERDIDO" ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.12)] font-medium text-[color:#fde68a]",
                compact ? "min-h-11 min-w-11 px-3 text-[11px]" : "px-2 py-0.5 text-xs",
              )}
            >
              <Clock className={cn(compact ? "h-3.5 w-3.5" : "h-3 w-3")} />
              {obterRotuloTempoParado(diasParados)}
            </span>
          ) : null}

          {pendencias?.naoResolvidas && pendencias.naoResolvidas > 0 && (!compact ? !estagio.nome.includes("Pré Aprovação") : true) ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border font-medium",
                compact ? "min-h-11 min-w-11 px-3 text-[11px]" : "px-2 py-0.5 text-xs",
                pendencias.gravidadeMaxima === "critica" && "border-[color:rgba(244,63,94,0.28)] bg-[color:rgba(244,63,94,0.12)] text-[color:#fecdd3]",
                pendencias.gravidadeMaxima === "alerta" && "border-[color:rgba(245,158,11,0.28)] bg-[color:rgba(245,158,11,0.12)] text-[color:#fde68a]",
                pendencias.gravidadeMaxima === "info" && "border-[color:rgba(56,189,248,0.28)] bg-[color:rgba(56,189,248,0.12)] text-[color:#bae6fd]",
              )}
            >
              <AlertTriangle className={cn(compact ? "h-3.5 w-3.5" : "h-3 w-3")} />
              {compact ? pendencias.naoResolvidas : `${pendencias.naoResolvidas} pendência${pendencias.naoResolvidas > 1 ? "s" : ""}`}
            </span>
          ) : null}
        </div>

        <div className={cn("flex items-center gap-2 text-[var(--text-tertiary)]", compact ? "mt-3" : "mt-2.5", compact ? "" : "text-xs")}>
          {funcionarios.length > 0 && negocio.id_funcionario ? (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {nomeResponsavel}
            </span>
          ) : null}

          {!compact ? (
            <span className="flex items-center gap-1">
              {formatarTempoRelativoKanban(negocio.atualizado_em, agoraMs)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        {visualCue.circle ? <span className={visualCue.circle} /> : null}
      </div>
    </div>
  );
}

export function AlcaArrasteKanban() {
  return <GripVertical className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-tertiary)]" />;
}
