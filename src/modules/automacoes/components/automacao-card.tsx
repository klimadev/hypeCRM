"use client";

import { useState } from "react";
import { Loader2, Zap, Pencil, Trash2, Play, CheckCircle2, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Automacao, DispatchStats } from "../types";
import { DispatchTestModal } from "./dispatch-test-modal";

type AutomacaoCardProps = {
  automacao: Automacao;
  onToggle: () => Promise<{ sucesso: boolean; erro?: string }>;
  onEdit: () => void;
  onDelete: () => Promise<{ sucesso: boolean; erro?: string }>;
  onDispatch: (params?: { only?: string; automacao_id?: string }) => Promise<{ sucesso: boolean; stats?: DispatchStats; erro?: string }>;
};

export function AutomacaoCard({
  automacao,
  onToggle,
  onEdit,
  onDelete,
  onDispatch,
}: AutomacaoCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  const handleToggle = async () => {
    setLoading("toggle");
    await onToggle();
    setLoading(null);
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta automacao?")) return;
    setLoading("delete");
    await onDelete();
    setLoading(null);
  };

  const handleDispatch = async () => {
    setShowTestModal(true);
  };

  let config: { id_estagio_destino?: string } = {};
  try {
    config = JSON.parse(automacao.config_json || "{}");
  } catch {
    config = {};
  }
  const stats = automacao.stats;

  return (
    <>
      <div
        className={cn(
          "rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-sm)] transition-[border-color,background-color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)]",
          automacao.ativo
            ? "border-[rgba(16,185,129,0.24)] bg-[linear-gradient(180deg,rgba(16,185,129,0.1),rgba(12,12,14,0.96))]"
            : "border-[var(--border-subtle)] bg-[var(--surface)]"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {automacao.ativo ? (
                <Zap className="h-4 w-4 text-[var(--success)]" />
              ) : (
                <Zap className="h-4 w-4 text-[var(--text-tertiary)]" />
              )}
              <h3 className="truncate font-medium text-[var(--text-primary)]">{automacao.nome}</h3>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                WhatsApp
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Mudança de Estágio
              </Badge>
              <Badge
                variant={automacao.ativo ? "success" : "secondary"}
                className="text-xs"
              >
                {automacao.ativo ? "Ativa" : "Inativa"}
              </Badge>
            </div>

            <div className="space-y-1 text-sm text-[var(--text-secondary)]">
              {config.id_estagio_destino && (
                <p>Estágio específico configurado</p>
              )}
              <p>{automacao.acoes.length} ação(ões)</p>
            </div>

            {stats && (
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="text-[var(--text-secondary)]">
                  Total: <strong>{stats.total_jobs}</strong>
                </span>
                <span className="flex items-center gap-1 text-[var(--success)]">
                  <CheckCircle2 className="h-3 w-3" />
                  {stats.enviados}
                </span>
                {stats.falhas > 0 && (
                  <span className="flex items-center gap-1 text-[var(--danger)]">
                    <XCircle className="h-3 w-3" />
                    {stats.falhas}
                  </span>
                )}
                <span className="text-[var(--text-secondary)]">
                  Taxa: <strong>{stats.taxa_sucesso}%</strong>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDispatch}
              disabled={loading !== null}
            >
              <Play className="h-4 w-4" />
              Fila
            </Button>

            <Button variant="ghost" size="sm" onClick={onEdit} disabled={loading !== null}>
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={loading !== null}
              className="text-[var(--danger)] hover:bg-[rgba(244,63,94,0.1)] hover:text-[var(--danger)]"
            >
              {loading === "delete" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>

            <Switch
              checked={automacao.ativo}
              onCheckedChange={handleToggle}
              disabled={loading === "toggle"}
            />
          </div>
        </div>
      </div>

      <DispatchTestModal
        open={showTestModal}
        onOpenChange={setShowTestModal}
        automacao={automacao}
        onTest={onDispatch}
      />
    </>
  );
}
