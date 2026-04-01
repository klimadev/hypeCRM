"use client";

import { useMemo, useState } from "react";
import { Loader2, TimerReset } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WhatsappJobItem, WhatsappJobsResumo } from "../types";
import { JobsTableHeader } from "./jobs-table-header";
import { JobsTableRow } from "./jobs-table-row";
import { contarJobsPorFiltro, filtrarJobsWhatsapp, type FilterType } from "./jobs-table.utils";

type JobsTableProps = {
  resumo: WhatsappJobsResumo;
  jobs: WhatsappJobItem[];
  carregando: boolean;
  erro: string | null;
  onRetryJob?: (jobId: string) => Promise<void>;
};

export function JobsTable({ resumo, jobs, carregando, erro, onRetryJob }: JobsTableProps) {
  const [filter, setFilter] = useState<FilterType>("todos");
  const [retryingJobs, setRetryingJobs] = useState<Set<string>>(new Set());

  const handleRetry = async (jobId: string) => {
    if (!onRetryJob) {
      return;
    }

    setRetryingJobs((prev) => new Set(prev).add(jobId));

    try {
      await onRetryJob(jobId);
    } finally {
      setRetryingJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const filteredJobs = useMemo(() => filtrarJobsWhatsapp(jobs, filter), [jobs, filter]);
  const filterCounts = useMemo(() => contarJobsPorFiltro(jobs), [jobs]);

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
      <JobsTableHeader filtro={filter} counts={filterCounts} resumoAgendados={resumo.pendentes + resumo.processando} onFiltroChange={setFilter} />

      {erro ? (
        <div className="mx-4 mt-3 rounded-[var(--radius-control)] border border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] px-3 py-2">
          <p className="text-xs text-[var(--danger)]">{erro}</p>
        </div>
      ) : null}

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
              filteredJobs.map((job) => (
                <JobsTableRow key={job.id} job={job} podeRetry={Boolean(onRetryJob)} retrying={retryingJobs.has(job.id)} onRetry={(jobId) => void handleRetry(jobId)} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)] px-4 py-2">
          <span className="text-xs text-[var(--text-secondary)]">
            Mostrando <strong>{filteredJobs.length}</strong> de <strong>{jobs.length}</strong> jobs
          </span>
          {filterCounts.falhas > 0 && filter !== "falhas" ? (
            <button type="button" onClick={() => setFilter("falhas")} className="text-xs text-[var(--danger)] transition-colors hover:text-[color:#fb7185]">
              {filterCounts.falhas} {filterCounts.falhas === 1 ? "job falhou" : "jobs falharam"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
