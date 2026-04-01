import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Clock, Loader2, RotateCcw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { WhatsappJobItem } from "../types";
import { formatarDataJobWhatsapp, getContextoLeadJob, truncateMensagemJob } from "./jobs-table.utils";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "warning" | "info" | "success" | "error" | "secondary"; icon: ReactNode }> = {
    PENDENTE: { variant: "warning", icon: <Clock className="h-3 w-3" /> },
    PROCESSANDO: { variant: "info", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    ENVIADO: { variant: "success", icon: <CheckCircle2 className="h-3 w-3" /> },
    FALHA: { variant: "error", icon: <XCircle className="h-3 w-3" /> },
    CANCELADO: { variant: "secondary", icon: <XCircle className="h-3 w-3" /> },
  };
  const c = config[status] || config.PENDENTE;

  return (
    <Badge variant={c.variant} className="gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em]">
      {c.icon}
      {status}
    </Badge>
  );
}

function ErrorTooltip(props: {
  erroCodigo: string | null;
  erroCategoria: string | null;
  erroDetalhe: string | null;
  erroOriginal: string | null;
  acaoRecomendada: string | null;
}) {
  const { erroCodigo, erroCategoria, erroDetalhe, erroOriginal, acaoRecomendada } = props;
  const [expanded, setExpanded] = useState(false);

  if (!erroOriginal) {
    return null;
  }

  return (
    <div className="mt-0.5">
      <button type="button" onClick={() => setExpanded((atual) => !atual)} className="flex items-center gap-1 text-xs text-[var(--danger)] transition-colors hover:text-[color:#fb7185]">
        <AlertCircle className="h-3 w-3" />
        Erro: Ver motivo
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {expanded ? (
        <div className="mt-2 rounded-[var(--radius-control)] border border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] p-3 text-left">
          <div className="space-y-1">
            <p className="font-semibold text-[var(--danger)]">Erro: {erroCodigo || "Desconhecido"}</p>
            {erroCategoria ? <p className="text-xs text-[var(--text-secondary)]">Categoria: {erroCategoria}</p> : null}
            <p className="text-xs text-[var(--text-secondary)]">{erroDetalhe || erroOriginal}</p>
            {acaoRecomendada ? <p className="mt-1 border-t border-[rgba(244,63,94,0.16)] pt-1 text-xs font-medium text-[var(--success)]">{acaoRecomendada}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CountdownTimer({ targetDate, status }: { targetDate: string; status: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (["ENVIADO", "CANCELADO", "FALHA"].includes(status)) {
      return;
    }

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const diff = useMemo(() => new Date(targetDate).getTime() - now, [targetDate, now]);

  if (status === "ENVIADO") return <span className="text-xs text-[var(--success)]">Enviado</span>;
  if (status === "CANCELADO") return <span className="text-xs text-[var(--text-tertiary)]">Cancelado</span>;
  if (status === "FALHA") return <span className="text-xs text-[var(--danger)]">Falhou</span>;
  if (diff <= 0) return <span className="animate-pulse text-xs font-medium text-[var(--danger)]">Agora!</span>;

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
    return <span className="font-mono text-xs font-medium text-[var(--warning)]">{minutes}m {seconds}s</span>;
  }

  return <span className="animate-pulse font-mono text-xs font-medium text-[var(--danger)]">{seconds}s</span>;
}

type JobsTableRowProps = {
  job: WhatsappJobItem;
  podeRetry: boolean;
  retrying: boolean;
  onRetry: (jobId: string) => void;
};

export function JobsTableRow({ job, podeRetry, retrying, onRetry }: JobsTableRowProps) {
  const contexto = getContextoLeadJob(job.contexto_json);
  const isProcessing = job.status === "PROCESSANDO";

  return (
    <TableRow className="group relative">
      {isProcessing && job.progress_pct !== null ? (
        <div className="absolute left-0 top-0 h-0.5 bg-gradient-to-r from-[var(--brand)] via-[var(--info)] to-[var(--info-alt)] transition-all duration-500" style={{ width: `${job.progress_pct}%` }} />
      ) : null}
      <TableCell>
        <StatusBadge status={job.status} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <span>#{job.id.slice(0, 6)}</span>
          {job.tentativas > 0 ? <span className="text-[var(--warning)]" title={`${job.tentativas} tentativas`}>({job.tentativas})</span> : null}
          {job.status === "FALHA" && podeRetry ? (
            <button type="button" onClick={() => onRetry(job.id)} disabled={retrying} className="ml-2 inline-flex items-center gap-1 rounded-full border border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] px-2 py-0.5 text-[var(--danger)] transition-colors hover:bg-[rgba(244,63,94,0.16)] disabled:opacity-50" title="Tentar novamente">
              {retrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
              Retry
            </button>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="min-w-0">
          <p className="max-w-[150px] truncate text-sm font-medium text-[var(--text-primary)]">{contexto?.lead_nome || "—"}</p>
          <p className="max-w-[150px] truncate text-xs text-[var(--text-secondary)]">{contexto?.lead_telefone || "—"}</p>
        </div>
      </TableCell>
      <TableCell>
        {contexto?.estagio_novo ? (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[var(--text-secondary)]">{contexto.estagio_anterior}</span>
            <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" />
            <span className="font-medium text-[var(--success)]">{contexto.estagio_novo}</span>
          </div>
        ) : null}
      </TableCell>
      <TableCell>
        <p className="max-w-[180px] truncate text-xs text-[var(--text-secondary)]" title={job.mensagem_template}>
          {truncateMensagemJob(job.mensagem_template, 40)}
        </p>
        <ErrorTooltip erroCodigo={job.erro_codigo} erroCategoria={job.erro_categoria} erroDetalhe={job.erro_detalhe} erroOriginal={job.erro_ultimo} acaoRecomendada={job.acao_recomendada} />
      </TableCell>
      <TableCell>
        <span className="whitespace-nowrap text-xs text-[var(--text-secondary)]">{formatarDataJobWhatsapp(job.agendado_para)}</span>
      </TableCell>
      <TableCell>
        <CountdownTimer targetDate={job.agendado_para} status={job.status} />
      </TableCell>
    </TableRow>
  );
}
