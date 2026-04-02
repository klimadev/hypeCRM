"use client";

import { AlertCircle, Loader2, Phone, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Lead } from "../types";
import { criarClasseStatusSalvar, criarIconeStatusSalvar, type StatusSalvarDrawer } from "./lead-details-drawer.utils";

type LeadDetailsDrawerHeaderProps = {
  atalhoSalvar: string;
  negocioSelecionado: Lead | null;
  onAbrirRemocao: () => void;
  onFechar: () => void;
  removendoNegocio: boolean;
  statusSalvar: StatusSalvarDrawer;
};

export function LeadDetailsDrawerHeader({
  negocioSelecionado,
  onAbrirRemocao,
  onFechar,
  removendoNegocio,
  statusSalvar,
}: LeadDetailsDrawerHeaderProps) {
  const icone = criarIconeStatusSalvar(statusSalvar.tom, {
    alerta: <AlertCircle className="h-3 w-3" />,
    loading: <Loader2 className="h-3 w-3 animate-spin" />,
  });

  return (
    <SheetHeader className="relative border-b border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-4 text-[var(--text-primary)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:rgba(139,92,246,0.12)] text-[var(--brand)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <SheetTitle className="truncate text-lg font-semibold tracking-tight text-[var(--text-primary)] leading-tight">
              {negocioSelecionado?.nome}
            </SheetTitle>
          </div>

          <SheetDescription className="flex items-center gap-3 text-[var(--text-secondary)]">
            {negocioSelecionado?.lead_principal?.telefone ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--surface-elevated)] px-2 py-1 text-xs font-medium tabular-nums">
                <Phone className="h-3 w-3 text-[var(--text-tertiary)]" />
                {negocioSelecionado.lead_principal.telefone}
              </span>
            ) : (
              <span className="text-xs text-[var(--text-tertiary)]">Sem contato principal vinculado</span>
            )}

            <span className={`inline-flex items-center gap-1 text-[11px] ${criarClasseStatusSalvar(statusSalvar.tom)}`}>
              {icone}
              {statusSalvar.texto}
            </span>
          </SheetDescription>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-lg text-[color:rgba(244,63,94,0.8)] hover:bg-[color:rgba(244,63,94,0.1)] hover:text-[color:#fb7185]"
            onClick={onAbrirRemocao}
            disabled={removendoNegocio}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-[var(--text-tertiary)] hover:bg-[color:rgba(255,255,255,0.06)] hover:text-[var(--text-secondary)]" onClick={onFechar}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </SheetHeader>
  );
}
