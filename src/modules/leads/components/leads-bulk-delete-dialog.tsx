"use client";

import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { ApiLeadContato } from "@/lib/api/leads";

type LeadsBulkDeleteDialogProps = {
  leads: ApiLeadContato[];
  open: boolean;
  removendo: boolean;
  removerNegociosVinculados: boolean;
  erro: string | null;
  onOpenChange: (aberto: boolean) => void;
  onRemoverNegociosChange: (valor: boolean) => void;
  onConfirmar: () => void;
};

export function LeadsBulkDeleteDialog({
  leads,
  open,
  removendo,
  removerNegociosVinculados,
  erro,
  onOpenChange,
  onRemoverNegociosChange,
  onConfirmar,
}: LeadsBulkDeleteDialogProps) {
  const total = leads.length;
  const temNegocio = leads.some((l) => l.id_negocio);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir {total} leads</DialogTitle>
          <DialogDescription>
            {total} lead(s) serão desativados. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="max-h-40 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3">
            <ul className="space-y-1">
              {leads.map((lead) => (
                <li key={lead.id} className="truncate text-sm text-[var(--text-primary)]">
                  {lead.nome}
                  {lead.id_negocio ? (
                    <span className="ml-1.5 text-xs text-[var(--text-tertiary)]">(com negócio)</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          {temNegocio ? (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Remover negócios vinculados</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Também remover os negócios vinculados a estes leads.
                </p>
              </div>
              <Switch checked={removerNegociosVinculados} onCheckedChange={onRemoverNegociosChange} disabled={removendo} />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-3 text-sm text-[var(--text-secondary)]">
              Nenhum lead selecionado possui negócio vinculado.
            </p>
          )}
        </div>

        {erro ? (
          <div className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_24%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] p-3 text-sm text-[var(--danger)]">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {erro}
            </span>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={removendo}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirmar} disabled={removendo || total === 0}>
            {removendo ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Excluindo...
              </span>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir {total} lead{total === 1 ? "" : "s"}
                {removerNegociosVinculados && temNegocio ? " e negócios" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
