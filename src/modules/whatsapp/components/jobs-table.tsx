"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, TimerReset, AlertCircle, Send, CheckCircle2, XCircle, Clock, ArrowRight, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { WhatsappJobItem, WhatsappJobsResumo } from "../types";
import { cn } from "@/lib/utils";

type JobsTableProps = {
  resumo: WhatsappJobsResumo;
  jobs: WhatsappJobItem[];
  carregando: boolean;
  erro: string | null;
  onRetryJob?: (jobId: string) => Promise<void>;
};

type ContextoLead = {
  lead_nome: string;
  lead_telefone: string;
  lead_id: string;
  estagio_anterior: string;
  estagio_novo: string;
};

type FilterType = "todos" | "pendentes" | "processando" | "enviados" | "falhas";

function FilterPill({ 
  active, 
  onClick, 
  icon, 
  label, 
  count 
}: {
  active: boolean; 
  onClick: () => void; 
  icon: ReactNode; 
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)]",
        active
          ? "border-[color:rgba(139,92,246,0.24)] bg-[var(--brand-soft)] text-[var(--text-primary)] shadow-[0_16px_40px_-28px_rgba(139,92,246,0.65)]"
          : "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-secondary)] hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[color:rgba(255,255,255,0.06)] hover:text-[var(--text-primary)]",
      )}
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
          active
            ? "bg-[color:rgba(255,255,255,0.08)] text-[var(--text-primary)]"
            : "bg-[color:rgba(255,255,255,0.04)] text-[var(--text-secondary)]",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "warning" | "info" | "success" | "error" | "secondary"; icon: ReactNode }> = {
    PENDENTE: {
      variant: "warning",
      icon: <Clock className="h-3 w-3" />,
    },
    PROCESSANDO: {
      variant: "info",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    ENVIADO: {
      variant: "success",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    FALHA: {
      variant: "error",
      icon: <XCircle className="h-3 w-3" />,
    },
    CANCELADO: {
      variant: "secondary",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const c = config[status] || config.PENDENTE;

  return (
    <Badge variant={c.variant} className="gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em]">
      {c.icon}
      {status}
    </Badge>
  );
}

function ErrorTooltip({ 
  erroCodigo, 
  erroCategoria, 
  erroDetalhe, 
  erroOriginal, 
  acaoRecomendada 
}: { 
  erroCodigo: string | null; 
  erroCategoria: string | null; 
  erroDetalhe: string | null; 
  erroOriginal: string | null;
  acaoRecomendada: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!erroOriginal) return null;

  return (
    <div className="mt-0.5">
      <button 
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-[var(--danger)] transition-colors hover:text-[color:#fb7185]"
      >
        <AlertCircle className="h-3 w-3" />
        Erro: Ver motivo
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {expanded && (
        <div className="mt-2 rounded-[var(--radius-control)] border border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] p-3 text-left">
          <div className="space-y-1">
            <p className="font-semibold text-[var(--danger)]">
              Erro: {erroCodigo || "Desconhecido"}
            </p>
            {erroCategoria && (
              <p className="text-xs text-[var(--text-secondary)]">Categoria: {erroCategoria}</p>
            )}
            <p className="text-xs text-[var(--text-secondary)]">{erroDetalhe || erroOriginal}</p>
            {acaoRecomendada && (
              <p className="mt-1 border-t border-[rgba(244,63,94,0.16)] pt-1 text-xs font-medium text-[var(--success)]">
                {acaoRecomendada}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CountdownTimer({ targetDate, status }: { targetDate: string; status: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status === "ENVIADO" || status === "CANCELADO" || status === "FALHA") return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const diff = useMemo(() => {
    const target = new Date(targetDate).getTime();
    const remaining = target - now;
    return remaining;
  }, [targetDate, now]);

  if (status === "ENVIADO") {
    return <span className="text-xs text-[var(--success)]">Enviado</span>;
  }

  if (status === "CANCELADO") {
    return <span className="text-xs text-[var(--text-tertiary)]">Cancelado</span>;
  }

  if (status === "FALHA") {
    return <span className="text-xs text-[var(--danger)]">Falhou</span>;
  }

  if (diff <= 0) {
    return (
      <span className="animate-pulse text-xs font-medium text-[var(--danger)]">
        Agora!
      </span>
    );
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return (
      <span className="font-mono text-xs text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">{hours}h</span>
        <span className="mx-0.5 text-[var(--text-tertiary)]">:</span>
        <span className="font-semibold text-[var(--text-primary)]">{minutes.toString().padStart(2, "0")}m</span>
        <span className="mx-0.5 text-[var(--text-tertiary)]">:</span>
        <span className="font-semibold text-[var(--text-primary)]">{seconds.toString().padStart(2, "0")}s</span>
      </span>
    );
  }

  if (minutes > 0) {
    return (
      <span className="font-mono text-xs font-medium text-[var(--warning)]">
        {minutes}m {seconds}s
      </span>
    );
  }

  return (
    <span className="animate-pulse font-mono text-xs font-medium text-[var(--danger)]">
      {seconds}s
    </span>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const isHoje = d.toDateString() === hoje.toDateString();
  const isAmanha = d.toDateString() === amanha.toDateString();

  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (isHoje) {
    return `Hoje, ${hora}`;
  }
  if (isAmanha) {
    return `Amanhã, ${hora}`;
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function truncate(str: string, len: number) {
  if (!str) return "-";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

function getContextoLead(contextoJson: string): ContextoLead | null {
  try {
    return JSON.parse(contextoJson);
  } catch {
    return null;
  }
}

export function JobsTable({ resumo, jobs, carregando, erro, onRetryJob }: JobsTableProps) {
  const [filter, setFilter] = useState<FilterType>("todos");
  const [retryingJobs, setRetryingJobs] = useState<Set<string>>(new Set());
  
  const handleRetry = async (jobId: string) => {
    if (!onRetryJob) return;
    setRetryingJobs(prev => new Set(prev).add(jobId));
    try {
      await onRetryJob(jobId);
    } finally {
      setRetryingJobs(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };
  
  const filteredJobs = useMemo(() => {
    if (filter === "todos") return jobs;
    if (filter === "pendentes") return jobs.filter(j => j.status === "PENDENTE");
    if (filter === "processando") return jobs.filter(j => j.status === "PROCESSANDO");
    if (filter === "enviados") return jobs.filter(j => j.status === "ENVIADO");
    if (filter === "falhas") return jobs.filter(j => j.status === "FALHA");
    return jobs;
  }, [jobs, filter]);

  const filterCounts = useMemo(() => ({
    todos: jobs.length,
    pendentes: jobs.filter(j => j.status === "PENDENTE").length,
    processando: jobs.filter(j => j.status === "PROCESSANDO").length,
    enviados: jobs.filter(j => j.status === "ENVIADO").length,
    falhas: jobs.filter(j => j.status === "FALHA").length,
  }), [jobs]);

  if (carregando && jobs.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-8 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Carregando jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[rgba(56,189,248,0.18)] bg-[rgba(56,189,248,0.12)] text-[var(--info)] shadow-[0_16px_36px_-24px_rgba(56,189,248,0.7)]">
            <TimerReset className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-[var(--text-primary)]">Fila de envios em tempo real</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{resumo.pendentes + resumo.processando} jobs agendados</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <FilterPill 
            active={filter === "todos"} 
            onClick={() => setFilter("todos")}
            icon={<TimerReset className="h-3 w-3" />}
            label="Todos"
            count={filterCounts.todos}
          />
          <FilterPill 
            active={filter === "falhas"} 
            onClick={() => setFilter("falhas")}
            icon={<AlertCircle className="h-3 w-3" />}
            label="Falhas"
            count={filterCounts.falhas}
          />
          <FilterPill 
            active={filter === "pendentes"} 
            onClick={() => setFilter("pendentes")}
            icon={<Clock className="h-3 w-3" />}
            label="Pendentes"
            count={filterCounts.pendentes}
          />
          <FilterPill 
            active={filter === "processando"} 
            onClick={() => setFilter("processando")}
            icon={<Loader2 className="h-3 w-3" />}
            label="Processando"
            count={filterCounts.processando}
          />
          <FilterPill 
            active={filter === "enviados"} 
            onClick={() => setFilter("enviados")}
            icon={<Send className="h-3 w-3" />}
            label="Enviados"
            count={filterCounts.enviados}
          />
        </div>
      </div>

      {erro && (
        <div className="mx-4 mt-3 rounded-[var(--radius-control)] border border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] px-3 py-2">
          <p className="text-xs text-[var(--danger)]">{erro}</p>
        </div>
      )}

      <div className="max-h-[400px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-[var(--surface-elevated)]">
            <TableRow className="hover:bg-[color:rgba(255,255,255,0.03)]">
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead className="w-[180px]">Estágio</TableHead>
              <TableHead className="w-[200px]">Mensagem</TableHead>
              <TableHead className="w-[100px]">Agendado</TableHead>
              <TableHead className="w-[80px]">Tempo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-[var(--text-secondary)]">
                  <div className="flex flex-col items-center gap-2">
                    <TimerReset className="h-8 w-8 text-[var(--text-tertiary)]" />
                    <p className="text-sm">Nenhum job encontrado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => {
                const contexto = getContextoLead(job.contexto_json);
                const isProcessing = job.status === "PROCESSANDO";
                
                return (
                  <TableRow key={job.id} className="group relative">
                    {isProcessing && job.progress_pct !== null && (
                      <div 
                        className="absolute left-0 top-0 h-0.5 bg-gradient-to-r from-[var(--brand)] via-[var(--info)] to-[var(--info-alt)] transition-all duration-500"
                        style={{ width: `${job.progress_pct}%` }}
                      />
                    )}
                    <TableCell>
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <span>#{job.id.slice(0, 6)}</span>
                        {job.tentativas > 0 && (
                          <span className="text-[var(--warning)]" title={`${job.tentativas} tentativas`}>
                            ({job.tentativas})
                          </span>
                        )}
                        {job.status === "FALHA" && onRetryJob && (
                          <button
                            type="button"
                            onClick={() => handleRetry(job.id)}
                            disabled={retryingJobs.has(job.id)}
                            className="ml-2 inline-flex items-center gap-1 rounded-full border border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] px-2 py-0.5 text-[var(--danger)] transition-colors hover:bg-[rgba(244,63,94,0.16)] disabled:opacity-50"
                            title="Tentar novamente"
                          >
                            {retryingJobs.has(job.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Retry
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="max-w-[150px] truncate text-sm font-medium text-[var(--text-primary)]">
                          {contexto?.lead_nome || "—"}
                        </p>
                        <p className="max-w-[150px] truncate text-xs text-[var(--text-secondary)]">
                          {contexto?.lead_telefone || "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contexto?.estagio_novo && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-[var(--text-secondary)]">{contexto.estagio_anterior}</span>
                          <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" />
                          <span className="font-medium text-[var(--success)]">{contexto.estagio_novo}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[180px] truncate text-xs text-[var(--text-secondary)]" title={job.mensagem_template}>
                        {truncate(job.mensagem_template, 40)}
                      </p>
                      <ErrorTooltip 
                        erroCodigo={job.erro_codigo}
                        erroCategoria={job.erro_categoria}
                        erroDetalhe={job.erro_detalhe}
                        erroOriginal={job.erro_ultimo}
                        acaoRecomendada={job.acao_recomendada}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap text-xs text-[var(--text-secondary)]">
                        {formatDate(job.agendado_para)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <CountdownTimer targetDate={job.agendado_para} status={job.status} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filteredJobs.length > 0 && (
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)] px-4 py-2">
          <span className="text-xs text-[var(--text-secondary)]">
            Mostrando <strong>{filteredJobs.length}</strong> de <strong>{jobs.length}</strong> jobs
          </span>
          {filterCounts.falhas > 0 && filter !== "falhas" && (
            <button 
              type="button"
              onClick={() => setFilter("falhas")}
              className="text-xs text-[var(--danger)] transition-colors hover:text-[color:#fb7185]"
            >
              {filterCounts.falhas} {filterCounts.falhas === 1 ? "job falhou" : "jobs falharam"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
