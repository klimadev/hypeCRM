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
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md animate-in zoom-in-95 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow-overlay)]">
        {icone ? (
          <div className="mb-4 flex items-center justify-center">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                destrutivo ? "bg-[color:rgba(244,63,94,0.14)] text-[var(--danger)]" : "bg-[color:rgba(255,255,255,0.06)] text-[var(--text-secondary)]",
              )}
            >
              {icone}
            </div>
          </div>
        ) : null}

        <h3 className="mb-2 text-center text-lg font-semibold text-[var(--text-primary)]">{titulo}</h3>
        <div className="mb-6 text-center text-sm text-[var(--text-secondary)]">{descricao}</div>

        {erro ? (
          <div className="mb-4 flex items-start gap-2 rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] px-3 py-2 text-sm text-[color:#fecdd3]">
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
