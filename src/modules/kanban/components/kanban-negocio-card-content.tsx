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
  const proximoPasso = obterRotuloProximoPasso({ diasParados, estagio, pendencia: pendencias });

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {dragHandle && (
            <span className="shrink-0 opacity-40 transition-opacity duration-150 hover:opacity-100">
              {dragHandle}
            </span>
          )}
          <h3 className="truncate text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
            {negocio.nome}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
          {negocio.telefone && (
            <span className="truncate">{negocio.telefone}</span>
          )}
          {funcionarios.length > 0 && negocio.id_funcionario && (
            <span className="flex items-center gap-1 shrink-0">
              <Users className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{nomeResponsavel.split(" ")[0]}</span>
            </span>
          )}
        </div>

        <p className="text-sm font-semibold text-[var(--success)] tabular-nums">
          {formataMoeda(negocio.valor_oportunidade)}
        </p>

        {proximoPasso && (
          <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
            {proximoPasso}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {origem && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                origem.tone === "anuncio" && "bg-[color:rgba(139,92,246,0.12)] text-[color:#c4b5fd]",
                origem.tone === "whatsapp" && "bg-[color:rgba(16,185,129,0.12)] text-[color:#6ee7b7]",
                origem.tone === "manual" && "bg-[color:rgba(56,189,248,0.12)] text-[color:#7dd3fc]",
              )}
            >
              {origem.tone === "anuncio" && <Megaphone className="h-3 w-3" />}
              {origem.tone === "whatsapp" && <MessageCircle className="h-3 w-3" />}
              {origem.tone === "manual" && <PenLine className="h-3 w-3" />}
              {origem.label}
            </span>
          )}

          {diasParados > 3 && estagio.tipo !== "GANHO" && estagio.tipo !== "PERDIDO" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[color:rgba(245,158,11,0.12)] px-1.5 py-0.5 text-[10px] font-medium text-[color:#fcd34d]">
              <Clock className="h-3 w-3" />
              {obterRotuloTempoParado(diasParados)}
            </span>
          )}

          {pendencias?.naoResolvidas && pendencias.naoResolvidas > 0 && (!compact ? !estagio.nome.includes("Pré Aprovação") : true) && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                pendencias.gravidadeMaxima === "critica" && "bg-[color:rgba(244,63,94,0.12)] text-[color:#fda4af]",
                pendencias.gravidadeMaxima === "alerta" && "bg-[color:rgba(245,158,11,0.12)] text-[color:#fcd34d]",
                pendencias.gravidadeMaxima === "info" && "bg-[color:rgba(56,189,248,0.12)] text-[color:#7dd3fc]",
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {pendencias.naoResolvidas}
            </span>
          )}
        </div>

        {!compact && (
          <p className="text-[10px] text-[var(--text-tertiary)]">
            {formatarTempoRelativoKanban(negocio.atualizado_em, agoraMs)}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        {visualCue.circle && <span className={visualCue.circle} />}
      </div>
    </div>
  );
}

export function AlcaArrasteKanban() {
  return <GripVertical className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-tertiary)]" />;
}
