import { useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActionButton } from "./action-button";

type ConfirmDialogProps = {
  aberto: boolean;
  titulo: string;
  descricao: ReactNode;
  erro: string | null;
  confirmando: boolean;
  textoConfirmar: string;
  textoConfirmando?: string;
  textoCancel?: string;
  onCancelar: () => void;
  onConfirmar: () => void | Promise<void>;
  modo?: "padrao" | "destrutivo";
  icone?: ReactNode;
};

export function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  erro,
  confirmando,
  textoConfirmar,
  textoConfirmando,
  textoCancel = "Cancelar",
  onCancelar,
  onConfirmar,
  modo = "padrao",
  icone,
}: ConfirmDialogProps) {
  const botaoCancelarRef = useRef<HTMLButtonElement | null>(null);

  if (!aberto) return null;

  const destrutivo = modo === "destrutivo";

  return createPortal(
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[color-mix(in_srgb,var(--canvas)_72%,black)] p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow-overlay)]">
        {icone ? (
          <div className="mb-4 flex items-center justify-center">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                destrutivo ? "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[var(--danger)]" : "bg-[var(--surface-soft)] text-[var(--text-secondary)]",
              )}
            >
              {icone}
            </div>
          </div>
        ) : null}

        <h3 className="mb-2 text-center text-lg font-semibold text-[var(--text-primary)]">{titulo}</h3>
        <div className="mb-6 text-center text-sm text-[var(--text-secondary)]">{descricao}</div>

        {erro ? (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--danger)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{erro}</span>
          </div>
        ) : null}

        <div className="flex gap-3">
          <Button ref={botaoCancelarRef} variant="outline" className="flex-1 rounded-xl" onClick={onCancelar} disabled={confirmando}>
            {textoCancel}
          </Button>
          <ActionButton
            variant={destrutivo ? "destructive" : "default"}
            className="flex-1 rounded-xl"
            onClick={() => void onConfirmar()}
            loading={confirmando}
            loadingText={textoConfirmando ?? textoConfirmar}
          >
            {textoConfirmar}
          </ActionButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export type { ConfirmDialogProps };
