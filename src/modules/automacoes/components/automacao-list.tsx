"use client";

import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutomacaoCard } from "./automacao-card";
import type { Automacao, DispatchStats } from "../types";

type AutomacaoListProps = {
  automacoes: Automacao[];
  carregando: boolean;
  onToggle: (id: string) => Promise<{ sucesso: boolean; erro?: string }>;
  onDelete: (id: string) => Promise<{ sucesso: boolean; erro?: string }>;
  onDispatch: (params?: { only?: string; automacao_id?: string }) => Promise<{ sucesso: boolean; stats?: DispatchStats; erro?: string }>;
  onCreate: () => void;
  onEdit: (automacao: Automacao) => void;
};

export function AutomacaoList({
  automacoes,
  carregando,
  onToggle,
  onDelete,
  onDispatch,
  onCreate,
  onEdit,
}: AutomacaoListProps) {
  if (carregando) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (automacoes.length === 0) {
    return (
      <div className="rounded-[var(--radius-shell)] border border-dashed border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] py-12 text-center shadow-[var(--shadow-sm)]">
        <p className="mb-4 text-[var(--text-secondary)]">
          Nenhuma automação criada ainda.
        </p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Primeira Automação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      <div className="grid gap-4">
        {automacoes.map((automacao) => (
          <AutomacaoCard
            key={automacao.id}
            automacao={automacao}
            onToggle={() => onToggle(automacao.id)}
            onEdit={() => onEdit(automacao)}
            onDelete={() => onDelete(automacao.id)}
            onDispatch={onDispatch}
          />
        ))}
      </div>
    </div>
  );
}
