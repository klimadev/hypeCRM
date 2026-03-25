"use client";

import { useState } from "react";
import { Clock3, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Automacao, DispatchStats } from "../types";

type DispatchTestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automacao: Automacao;
  onTest: (params?: { only?: string; automacao_id?: string }) => Promise<{ sucesso: boolean; stats?: DispatchStats; erro?: string }>;
};

export function DispatchTestModal({
  open,
  onOpenChange,
  automacao,
  onTest,
}: DispatchTestModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DispatchStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecutarNovamente = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const resposta = await onTest({
      only: "whatsapp",
      automacao_id: automacao.id,
    });

      if (resposta.sucesso && resposta.stats) {
        setResult(resposta.stats);
      } else {
        setError(resposta.erro || "Erro ao processar a fila.");
      }
      setLoading(false);
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fila da automação: {automacao.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-[var(--text-secondary)]">
            <p>
              <strong>Fonte:</strong> WhatsApp
            </p>
            <p>
              <strong>Gatilho:</strong> Mudança de Estágio
            </p>
            <p>
              <strong>Ações:</strong> {automacao.acoes.length}
            </p>
          </div>

          <div className="rounded-[var(--radius-card)] border border-[rgba(56,189,248,0.24)] bg-[rgba(56,189,248,0.1)] p-3 text-sm text-[var(--text-primary)]">
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 text-[var(--info)]" />
              <div className="space-y-1">
                <p className="font-medium">O gatilho de estágio agora roda automaticamente.</p>
                <p className="text-[var(--text-secondary)]">
                  Use esta ação manual apenas para processar agendamentos pendentes,
                  mensagens com atraso ou tentativas em retry.
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--success)]" />
              <span className="ml-2 text-[var(--text-secondary)]">Processando fila...</span>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-[var(--radius-card)] bg-[rgba(244,63,94,0.1)] p-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          {result && !loading && (
            <div className="space-y-2 rounded-[var(--radius-card)] bg-[rgba(16,185,129,0.1)] p-3">
              <p className="font-medium text-[var(--success)]">Resultado:</p>
              <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                {result.processados.total === 0 ? (
                  <p>Nenhum agendamento pendente encontrado para esta automação.</p>
                ) : (
                  <>
                    <p>Total elegível: {result.processados.total}</p>
                    <p>Enviados: <span className="font-medium text-[var(--success)]">{result.processados.enviados}</span></p>
                    <p>Falhas: <span className={result.processados.falhas > 0 ? "font-medium text-[var(--danger)]" : ""}>{result.processados.falhas}</span></p>
                    <p>Em retry: {result.processados.em_retry}</p>
                  </>
                )}
                <p className="pt-1 text-xs text-[var(--text-tertiary)]">
                  Duração: {result.duracao_ms}ms
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={handleExecutarNovamente} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Processar fila"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
