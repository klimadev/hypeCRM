"use client";

import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { Lead } from "../types";

type LeadDetailsRemoveDialogProps = {
  descricaoRemocao: string;
  dialogRemocaoAberto: boolean;
  negocioSelecionado: Lead | null;
  quantidadeLeadsRelacionados: number;
  removerLeadsVinculados: boolean;
  removendoNegocio: boolean;
  setRemoverLeadsVinculados: (valor: boolean) => void;
  onConfirmar: () => void;
  onOpenChange: (aberto: boolean) => void;
};

export function LeadDetailsRemoveDialog({
  descricaoRemocao,
  dialogRemocaoAberto,
  negocioSelecionado,
  quantidadeLeadsRelacionados,
  removerLeadsVinculados,
  removendoNegocio,
  setRemoverLeadsVinculados,
  onConfirmar,
  onOpenChange,
}: LeadDetailsRemoveDialogProps) {
  return (
    <Dialog open={Boolean(negocioSelecionado) && dialogRemocaoAberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remover negócio</DialogTitle>
          <DialogDescription>
            A remoção desativa o negócio. Você pode decidir se os leads vinculados também devem ser removidos.
          </DialogDescription>
        </DialogHeader>

        {negocioSelecionado ? (
          <div className="space-y-3">
            <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{negocioSelecionado.nome}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {negocioSelecionado.lead_principal?.telefone ?? "Sem telefone principal"} • {quantidadeLeadsRelacionados.toLocaleString("pt-BR")} lead{quantidadeLeadsRelacionados === 1 ? "" : "s"} relacionado{quantidadeLeadsRelacionados === 1 ? "" : "s"}
              </p>
            </div>

            {quantidadeLeadsRelacionados > 0 ? (
              <div className="flex items-center justify-between gap-4 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Remover leads vinculados</p>
                  <p className="text-xs text-[var(--text-secondary)]">{descricaoRemocao}</p>
                </div>
                <Switch checked={removerLeadsVinculados} onCheckedChange={setRemoverLeadsVinculados} disabled={removendoNegocio} />
              </div>
            ) : (
              <p className="rounded-[var(--radius-control)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                Este negócio não possui leads vinculados ativos.
              </p>
            )}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={removendoNegocio}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirmar} disabled={removendoNegocio}>
            {removendoNegocio ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Removendo...
              </span>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {quantidadeLeadsRelacionados > 0 && removerLeadsVinculados ? "Remover negócio e leads" : "Remover negócio"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
