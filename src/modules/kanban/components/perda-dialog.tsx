"use client";

import type { FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type PerdaDialogProps = {
  movimentoPendente: { id_lead: string; id_estagio: string } | null;
  motivoPerda: string;
  setMotivoPerda: (motivo: string) => void;
  onConfirmarPerda: (evento: FormEvent<HTMLFormElement>) => Promise<void>;
  onOpenChange: (aberto: boolean) => void;
};

export function PerdaDialog({
  movimentoPendente,
  motivoPerda,
  setMotivoPerda,
  onConfirmarPerda,
  onOpenChange,
}: PerdaDialogProps) {
  return (
    <Dialog open={Boolean(movimentoPendente)} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-[var(--radius-card)]">
        <DialogHeader>
          <DialogTitle>Motivo de perda</DialogTitle>
        </DialogHeader>

        <form className="space-y-3" onSubmit={onConfirmarPerda}>
          <Textarea
            className="min-h-[100px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]"
            value={motivoPerda}
            onChange={(e) => setMotivoPerda(e.target.value)}
            placeholder="Descreva o motivo da perda..."
            required
          />
          <Button className="w-full rounded-[var(--radius-control)] font-medium" type="submit">
            Confirmar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
