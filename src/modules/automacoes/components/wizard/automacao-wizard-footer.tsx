"use client";

import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PassoAutomacaoWizard } from "../../types";

type AutomacaoWizardFooterProps = {
  automacaoAtivaId: string | null;
  loading: boolean;
  passo: PassoAutomacaoWizard;
  podeAvancar: boolean;
  onFechar: () => void;
  onVoltar: () => void;
  onProximo: () => void;
  onSubmit: () => void;
};

export function AutomacaoWizardFooter({
  automacaoAtivaId,
  loading,
  passo,
  podeAvancar,
  onFechar,
  onVoltar,
  onProximo,
  onSubmit,
}: AutomacaoWizardFooterProps) {
  return (
    <div className="flex justify-between gap-3">
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onFechar} disabled={loading}>
          Fechar e continuar depois
        </Button>
        <Button variant="secondary" onClick={onVoltar} disabled={passo === 1 || loading}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      {passo < 3 ? (
        <Button onClick={onProximo} disabled={!podeAvancar}>
          Próximo
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {automacaoAtivaId ? "Salvando..." : "Criando..."}
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {automacaoAtivaId ? "Salvar" : "Criar Automação"}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
