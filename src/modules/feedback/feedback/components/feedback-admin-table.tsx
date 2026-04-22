"use client";

import { Bug, Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeedbackItem } from "../types";

type FeedbackAdminTableProps = {
  items: FeedbackItem[];
  carregando: boolean;
  erro: string | null;
  filtroTipo: string;
  filtroStatus: string;
  setFiltroTipo: (tipo: string) => void;
  setFiltroStatus: (status: string) => void;
  pagina: number;
  totalPaginas: number;
  onRecarregar: () => void;
  onSelecionarDetalhe: (id: string | null) => void;
  onPagina: (p: number) => void;
};

const STATUS_LABEL: Record<string, string> = {
  NOVO: "Novo",
  EM_TRIAGEM: "Em Triagem",
  PLANEJADO: "Planejado",
  RESOLVIDO: "Resolvido",
  DESCARTADO: "Descartado",
};

const STATUS_VARIANT: Record<string, string> = {
  NOVO: "border-[var(--info)]/30 bg-[var(--info)]/8 text-[var(--info)]",
  EM_TRIAGEM: "border-[var(--warning)]/30 bg-[var(--warning)]/8 text-[var(--warning)]",
  PLANEJADO: "border-[color:rgba(139,92,246,0.3)] bg-[color:rgba(139,92,246,0.08)] text-[color:rgba(139,92,246,1)]",
  RESOLVIDO: "border-[var(--success)]/30 bg-[var(--success)]/8 text-[var(--success)]",
  DESCARTADO: "border-[var(--text-tertiary)]/30 bg-[var(--text-tertiary)]/8 text-[var(--text-tertiary)]",
};

const PRIORIDADE_LABEL: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

const OPCOES_TIPO = [
  { value: "", label: "Todos" },
  { value: "BUG", label: "Bug" },
  { value: "SUGESTAO", label: "Sugestão" },
];

const OPCOES_STATUS = [
  { value: "", label: "Todos" },
  { value: "NOVO", label: "Novo" },
  { value: "EM_TRIAGEM", label: "Em triagem" },
  { value: "PLANEJADO", label: "Planejado" },
  { value: "RESOLVIDO", label: "Resolvido" },
  { value: "DESCARTADO", label: "Descartado" },
];

export function FeedbackAdminTable({
  items,
  carregando,
  erro,
  filtroTipo,
  filtroStatus,
  setFiltroTipo,
  setFiltroStatus,
  pagina,
  totalPaginas,
  onRecarregar,
  onSelecionarDetalhe,
  onPagina,
}: FeedbackAdminTableProps) {
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {OPCOES_TIPO.map((op) => (
            <Button
              key={`tipo-${op.value}`}
              variant={filtroTipo === op.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroTipo(op.value)}
              className={cn(
                "h-8 px-3 text-xs",
                filtroTipo === op.value
                  ? "bg-[var(--brand)] text-[var(--primary-foreground)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]",
              )}
            >
              {op.label}
            </Button>
          ))}
          <span className="mx-1 inline-block h-3 w-px bg-[var(--border-subtle)]" />
          {OPCOES_STATUS.map((op) => (
            <Button
              key={`status-${op.value}`}
              variant={filtroStatus === op.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroStatus(op.value)}
              className={cn(
                "h-8 px-3 text-xs",
                filtroStatus === op.value
                  ? "bg-[var(--info)] text-[var(--primary-foreground)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]",
              )}
            >
              {op.label}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={onRecarregar} disabled={carregando} className="h-8 gap-2 border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]">
          <RefreshCw className={cn("h-3.5 w-3.5", carregando && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-soft)]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Título</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Módulo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Prioridade</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Enviado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-[var(--text-tertiary)]" />
                  </td>
                </tr>
              ) : erro ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--danger)]">{erro}</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--text-tertiary)]">Nenhum feedback encontrado.</td>
                </tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-elevated)]">
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={cn("text-xs font-medium", item.tipo === "BUG" ? "border-[var(--danger)]/24 bg-[var(--danger)]/12 text-[var(--danger)]" : "border-[var(--success)]/24 bg-[var(--success)]/12 text-[var(--success)]")}>
                      <div className="flex items-center gap-1">
                        {item.tipo === "BUG" ? <Bug className="h-3 w-3" /> : <Lightbulb className="h-3 w-3" />}
                        {item.tipo === "BUG" ? "Bug" : "Sugestão"}
                      </div>
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-[240px] truncate text-sm font-medium text-[var(--text-primary)]">{item.titulo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-[var(--text-tertiary)]">{item.modulo_origem || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={cn("text-xs", STATUS_VARIANT[item.status])}>
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className={cn("text-xs font-medium", item.prioridade === "CRITICA" ? "text-[var(--danger)]" : item.prioridade === "ALTA" ? "text-[var(--warning)]" : "text-[var(--text-secondary)]")}>
                      {PRIORIDADE_LABEL[item.prioridade]}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-tertiary)]">
                    {new Date(item.criado_em).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => onSelecionarDetalhe(item.id)} className="h-7 gap-1 px-2 text-xs">
                      Abrir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: Math.min(totalPaginas, 10) }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={pagina === p ? "default" : "outline"} size="sm" onClick={() => onPagina(p)} className="h-8 w-8">
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
