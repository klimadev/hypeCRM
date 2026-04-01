"use client";

import { AlertCircle, Loader2, MessageCircle, Phone, Trash2, X } from "lucide-react";
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
  atalhoSalvar,
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
    <SheetHeader className="space-y-0 border-b border-[var(--border-subtle)] bg-[linear-gradient(135deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))] px-4 py-3 text-[var(--text-primary)]">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <MessageCircle className="h-5 w-5 shrink-0 text-[var(--success)]" />
          <SheetTitle className="truncate text-base text-[var(--text-primary)]">{negocioSelecionado?.nome}</SheetTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-8 rounded-[calc(var(--radius-control)-2px)]"
            onClick={onAbrirRemocao}
            disabled={removendoNegocio}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remover
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.06)]" onClick={onFechar}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <SheetDescription className="flex items-center gap-2 text-[var(--text-secondary)]">
        <Phone className="h-3 w-3" />
        <span>{negocioSelecionado?.lead_principal?.telefone ?? "Sem contato principal vinculado"}</span>
        <span className={`inline-flex items-center gap-1 ${criarClasseStatusSalvar(statusSalvar.tom)}`}>
          {icone}
          {statusSalvar.texto}
        </span>
      </SheetDescription>

      <p className="text-xs text-[var(--text-tertiary)]">Atalhos: {atalhoSalvar} salva agora • Esc fecha o drawer</p>
    </SheetHeader>
  );
}
