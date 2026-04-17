import { Loader2, TimerReset, AlertCircle, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { WhatsappJobsResumo } from "../types";

type JobsStatusProps = {
  resumo: WhatsappJobsResumo;
  carregando: boolean;
  erro: string | null;
};

export function JobsStatus({ resumo, carregando, erro }: JobsStatusProps) {
  const jobsAgendados = resumo.pendentes + resumo.processando;

  return (
    <Card className="border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-[var(--info)] bg-[color-mix(in_srgb,var(--info)_12%,transparent)] text-[var(--info)] shadow-[var(--shadow-sm)]">
          {carregando ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <TimerReset className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{jobsAgendados}</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Jobs agendados</p>
          {erro ? (
            <p className="mt-1 truncate text-[11px] text-[var(--danger)]">{erro}</p>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-2.5 py-1">
                <Loader2 className={`h-3 w-3 ${resumo.processando > 0 ? "animate-spin" : ""}`} />
                Proc. {resumo.processando}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-2.5 py-1">
                <AlertCircle className="h-3 w-3" />
                Falhas {resumo.falhas}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-2.5 py-1">
                <Send className="h-3 w-3" />
                Hoje {resumo.enviadosHoje}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
