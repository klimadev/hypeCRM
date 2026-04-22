"use client";

import { useState } from "react";
import { Bug, Lightbulb, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFeedbackDetalhe } from "../hooks/use-feedback-detalhe";
import { cn } from "@/lib/utils";

type FeedbackDetalheProps = {
  id: string | null;
  onClose: () => void;
  onAtualizado?: () => void;
};

const STATUS_OPTIONS = [
  { value: "NOVO", label: "Novo" },
  { value: "EM_TRIAGEM", label: "Em Triagem" },
  { value: "PLANEJADO", label: "Planejado" },
  { value: "RESOLVIDO", label: "Resolvido" },
  { value: "DESCARTADO", label: "Descartado" },
];

const PRIORIDADE_OPTIONS = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Média" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Crítica" },
];

const ACAO_LABEL: Record<string, string> = {
  CRIADO: "Criado",
  STATUS: "Status alterado",
  PRIORIDADE: "Prioridade alterada",
  NOTA: "Nota adicionada",
};

export function FeedbackDetalhe({ id, onClose, onAtualizado }: FeedbackDetalheProps) {
  const { item, eventos, carregando, erro, carregandoStatus, atualizar } = useFeedbackDetalhe(id);
  const [novoStatus, setNovoStatus] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState("");
  const [nota, setNota] = useState("");

  if (!id) return null;

  const hasMudancas = Boolean(
    (novoStatus && novoStatus !== item?.status)
    || (novaPrioridade && novaPrioridade !== item?.prioridade)
    || nota.trim(),
  );

  const handleAtualizarStatus = async () => {
    if (!hasMudancas) {
      return;
    }

    await atualizar(
      novoStatus || item!.status,
      novaPrioridade || item!.prioridade,
      nota.trim() || undefined,
    );
    setNota("");
    onAtualizado?.();
  };

  const handleFechar = () => {
    onClose();
  };

  if (carregando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  if (erro || !item) {
    return <div className="p-4 text-sm text-[var(--danger)]">{erro || "Feedback não encontrado."}</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn("text-xs font-medium", item.tipo === "BUG" ? "border-[var(--danger)]/24 bg-[var(--danger)]/12 text-[var(--danger)]" : "border-[var(--success)]/24 bg-[var(--success)]/12 text-[var(--success)]")}>
            <div className="flex items-center gap-1">
              {item.tipo === "BUG" ? <Bug className="h-3 w-3" /> : <Lightbulb className="h-3 w-3" />}
              {item.tipo === "BUG" ? "Bug" : "Sugestão"}
            </div>
          </Badge>
          <span className="text-xs text-[var(--text-tertiary)]">
            {new Date(item.criado_em).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleFechar} className="h-7 px-2 text-xs">Fechar</Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{item.titulo}</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.descricao}</p>
          {item.impacto && (
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              Impacto: <span className="font-medium text-[var(--text-secondary)]">{item.impacto.replace(/_/g, " ")}</span>
            </p>
          )}
        </div>

        {item.nota_interna && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Nota interna</p>
            <p className="mt-1 text-sm text-[var(--text-primary)]">{item.nota_interna}</p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Contexto técnico</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3">
              <p className="text-[var(--text-tertiary)]">Módulo</p>
              <p className="font-medium text-[var(--text-primary)]">{item.modulo_origem || "—"}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3">
              <p className="text-[var(--text-tertiary)]">Rota</p>
              <p className="truncate font-medium text-[var(--text-primary)]">{item.rota_origem || "—"}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3">
              <p className="text-[var(--text-tertiary)]">Viewport</p>
              <p className="font-medium text-[var(--text-primary)]">{item.viewport || "—"}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3">
              <p className="text-[var(--text-tertiary)]">Perfil</p>
              <p className="font-medium text-[var(--text-primary)]">{item.perfil_usuario}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Status</label>
            <select value={novoStatus || item.status} onChange={(e) => setNovoStatus(e.target.value)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--border-focus)] focus:outline-none">
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Prioridade</label>
            <select value={novaPrioridade || item.prioridade} onChange={(e) => setNovaPrioridade(e.target.value)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--border-focus)] focus:outline-none">
              {PRIORIDADE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Nota interna</label>
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Adicione uma nota visível apenas internamente..." rows={3} className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:outline-none" />
          </div>

            <Button onClick={handleAtualizarStatus} disabled={carregandoStatus || !hasMudancas} className="w-full gap-2">
              {carregandoStatus && <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              Salvar alterações
            </Button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Histórico</p>
          <div className="space-y-2">
            {eventos.map((evt) => (
              <div key={evt.id} className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]">
                  <Clock className="h-3 w-3 text-[var(--text-tertiary)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[var(--text-primary)]">
                    {ACAO_LABEL[evt.acao] || evt.acao}
                    {evt.de_status && evt.para_status && (
                      <span className="ml-2 text-[var(--text-tertiary)]">
                        {evt.de_status} → {evt.para_status}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                    {evt.autor_tipo} · {new Date(evt.criado_em).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
