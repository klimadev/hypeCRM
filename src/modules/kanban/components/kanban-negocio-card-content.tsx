"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Clock, GripVertical } from "lucide-react";
import { cn, formataMoeda } from "@/lib/utils";
import type { Estagio, Funcionario, Lead, PendenciaNegocioInfo } from "../types";
import { formatarTempoRelativoKanban, obterBadgeOrigemKanban, type SinalVisualNegocioKanban } from "./kanban-board.utils";
import { obterDiasParados, obterRotuloTempoParado } from "../utils/apresentacao";

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
  pendencias,
  funcionarios,
  agoraMs,
  visualCue,
  dragHandle,
}: KanbanNegocioCardContentProps) {
  const diasParados = obterDiasParados(negocio.atualizado_em, agoraMs);
  const nomeResponsavel = funcionarios.find((item) => item.id === negocio.id_funcionario)?.nome;

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Linha 1: alça + nome */}
        <div className="flex items-center gap-1.5">
          {dragHandle && (
            <span className="shrink-0 opacity-30 group-hover:opacity-70 transition-opacity">
              {dragHandle}
            </span>
          )}
          <h3 className="truncate text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
            {negocio.nome}
          </h3>
          {visualCue.circle && <span className={cn("shrink-0", visualCue.circle)} />}
        </div>

        {/* Linha 2: valor */}
        <p className="text-sm font-semibold text-[var(--success)] tabular-nums">
          {formataMoeda(negocio.valor_oportunidade)}
        </p>

        {/* Tags compactas */}
        <div className="flex flex-wrap items-center gap-1">
          {obterBadgeOrigemKanban(negocio.origem) && (
            <span className="inline-flex items-center rounded-md bg-[var(--surface-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
              {obterBadgeOrigemKanban(negocio.origem)!.label}
            </span>
          )}

          {diasParados > 3 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--warning)]">
              <Clock className="h-3 w-3" />
              {obterRotuloTempoParado(diasParados)}
            </span>
          )}

          {pendencias?.naoResolvidas && pendencias.naoResolvidas > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                pendencias.gravidadeMaxima === "critica" && "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[var(--danger)]",
                pendencias.gravidadeMaxima === "alerta" && "bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]",
                pendencias.gravidadeMaxima === "info" && "bg-[color-mix(in_srgb,var(--info)_14%,transparent)] text-[var(--info)]",
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {pendencias.naoResolvidas}
            </span>
          )}

          {nomeResponsavel && (
            <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[80px]">
              {nomeResponsavel.split(" ")[0]}
            </span>
          )}
        </div>

        {/* Timestamp compacto */}
        <p className="text-[10px] text-[var(--text-tertiary)]">
          {formatarTempoRelativoKanban(negocio.atualizado_em, agoraMs)}
        </p>
      </div>
    </div>
  );
}

export function AlcaArrasteKanban() {
  return <GripVertical className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />;
}
