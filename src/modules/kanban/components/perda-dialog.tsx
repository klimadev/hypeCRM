"use client";

import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MOTIVOS_SUGERIDOS = [
  "Preço muito alto",
  "Cliente escolheu concorrente",
  "Sem orçamento no momento",
  "Outro",
];

type PerdaDialogProps = {
  movimentoPendente: { id_negocio: string; id_estagio: string } | null;
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
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCarregando(true);
    try {
      await onConfirmarPerda(e);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={Boolean(movimentoPendente)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Perder negócio</DialogTitle>
          <p className="text-sm text-[var(--text-secondary)]">
            Tem certeza? Informe o motivo para registrar o aprendizado.
          </p>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Motivo</label>
            <div className="flex flex-wrap gap-1.5">
              {MOTIVOS_SUGERIDOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivoPerda(m)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    motivoPerda === m
                      ? "bg-[var(--danger)] text-white"
                      : "bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={carregando}
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={carregando || !motivoPerda.trim()}
              className="flex-1 rounded-xl bg-[var(--danger)] text-white hover:bg-[var(--danger-strong)]"
            >
              {carregando ? "Salvando..." : "Confirmar perda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
