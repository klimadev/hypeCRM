"use client";

import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type AutomacaoWizardDraftBannerProps = {
  aviso: {
    titulo: string;
    descricao: string;
    horario: string | null;
  } | null;
  onDescartar: () => void;
};

export function AutomacaoWizardDraftBanner({ aviso, onDescartar }: AutomacaoWizardDraftBannerProps) {
  if (!aviso) {
    return null;
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[rgba(56,189,248,0.22)] bg-[linear-gradient(135deg,rgba(56,189,248,0.12),rgba(12,12,14,0.96))] px-4 py-3 shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[rgba(56,189,248,0.18)] bg-[rgba(56,189,248,0.12)] text-[var(--info)]">
            <Save className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{aviso.titulo}</p>
            <p className="text-sm text-[var(--text-secondary)]">{aviso.descricao}</p>
            {aviso.horario ? (
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Ultimo salvamento as {aviso.horario}</p>
            ) : null}
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onDescartar}>
          <Trash2 className="mr-2 h-4 w-4" />
          Descartar rascunho
        </Button>
      </div>
    </div>
  );
}
