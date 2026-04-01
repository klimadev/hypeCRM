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
import type { ApiNegocioResumo } from "@/lib/api/negocios";

type LeadDeleteDialogProps = {
  lead: ApiLeadContato | null;
  open: boolean;
  removendoLead: boolean;
  removerNegociosVinculados: boolean;
  erro: string | null;
  negociosRelacionados: ApiNegocioResumo[];
  onOpenChange: (aberto: boolean) => void;
  onRemoverNegociosChange: (valor: boolean) => void;
  onConfirmar: () => void;
};

export function LeadDeleteDialog({
  lead,
  open,
  removendoLead,
  removerNegociosVinculados,
  erro,
  negociosRelacionados,
  onOpenChange,
  onRemoverNegociosChange,
  onConfirmar,
}: LeadDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remover lead</DialogTitle>
          <DialogDescription>
            O lead será desativado. Você pode escolher se os negócios vinculados também devem ser removidos.
          </DialogDescription>
        </DialogHeader>

        {lead ? (
          <div className="space-y-3">
            <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{lead.nome}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{lead.telefone}</p>
              <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                {negociosRelacionados.length > 0
                  ? `${negociosRelacionados.length.toLocaleString("pt-BR")} negócio${negociosRelacionados.length === 1 ? "" : "s"} relacionado${negociosRelacionados.length === 1 ? "" : "s"} encontrado${negociosRelacionados.length === 1 ? "" : "s"}.`
                  : "Nenhum negócio relacionado encontrado."}
              </p>
            </div>

            {negociosRelacionados.length > 0 ? (
              <div className="flex items-center justify-between gap-4 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Remover negócios vinculados</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {negociosRelacionados.length === 1
                      ? "Também remover o negócio vinculado a este lead."
                      : `Também remover os ${negociosRelacionados.length} negócios vinculados a este lead.`}
                  </p>
                </div>
                <Switch checked={removerNegociosVinculados} onCheckedChange={onRemoverNegociosChange} disabled={removendoLead} />
              </div>
            ) : (
              <p className="rounded-[var(--radius-control)] border border-dashed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                Este lead não possui negócios vinculados ativos.
              </p>
            )}
          </div>
        ) : null}

        {erro ? (
          <p className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] p-3 text-sm font-medium text-[color:#fecdd3]">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {erro}
            </span>
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={removendoLead}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirmar} disabled={removendoLead}>
            {removendoLead ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Removendo...
              </span>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {negociosRelacionados.length > 0 && removerNegociosVinculados ? "Remover lead e negócios" : "Remover lead"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
