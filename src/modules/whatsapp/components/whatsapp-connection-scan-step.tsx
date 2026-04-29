"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock3, Copy, QrCode, RefreshCw } from "lucide-react";

type WhatsappConnectionScanStepProps = {
  instanciaNome: string | null;
  instanciaPhone: string | null;
  qrCode: string | null;
  pairingCode: string | null;
  carregandoQr: boolean;
  statusAtual: string;
  onGerarNovoQr: () => void;
};

export function WhatsappConnectionScanStep(props: WhatsappConnectionScanStepProps) {
  const { instanciaNome, instanciaPhone, qrCode, pairingCode, carregandoQr, statusAtual, onGerarNovoQr } = props;
  const [tempoRestante, setTempoRestante] = useState(60);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!qrCode || instanciaPhone) {
      setTempoRestante(60);
      return;
    }

    setTempoRestante(60);
    const interval = setInterval(() => {
      setTempoRestante((valor) => (valor <= 1 ? 0 : valor - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [qrCode, instanciaPhone]);

  const marcos = useMemo(
    () => [
      { id: "created", label: "Instancia criada", done: Boolean(instanciaNome) },
      { id: "qr", label: "QR pronto", done: Boolean(qrCode) },
      { id: "connected", label: "Aparelho conectado", done: Boolean(instanciaPhone) },
    ],
    [instanciaNome, instanciaPhone, qrCode],
  );

  const expirado = tempoRestante === 0;
  const progressoQr = (tempoRestante / 60) * 100;

  const copiarCodigo = async () => {
    if (!pairingCode) return;
    try {
      await navigator.clipboard.writeText(pairingCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-[var(--warning)]/35 bg-[color-mix(in_srgb,var(--warning)_9%,transparent)] p-4">
        <p className="mb-3 text-sm font-semibold text-[var(--warning)]">Escaneie com o WhatsApp em Aparelhos conectados</p>
        <div className="rounded-2xl bg-[var(--surface-elevated)] p-4 ring-1 ring-[var(--border-subtle)]">
          {carregandoQr ? <div className="h-[280px] w-full animate-pulse rounded-xl bg-[var(--surface-soft)]" /> : null}
          {!carregandoQr && qrCode ? (
            <Image src={qrCode} alt="QR Code da instancia" width={320} height={320} className="mx-auto h-[280px] w-[280px]" unoptimized />
          ) : null}
          {!carregandoQr && !qrCode ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-xl bg-[var(--surface-soft)] text-[var(--text-tertiary)]">
              <QrCode className="h-8 w-8" />
              <p className="text-sm">Preparando QR...</p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Clock3 className="h-3.5 w-3.5" />
              {expirado ? "QR expirado" : `QR ativo por ${tempoRestante}s`}
            </span>
            <span className={expirado ? "text-[var(--danger)]" : "text-[var(--text-tertiary)]"}>{statusAtual}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-soft)]">
            <div className={cn("h-full transition-all duration-1000 ease-linear", expirado ? "bg-[var(--danger)]" : "bg-[var(--success)]")} style={{ width: `${progressoQr}%` }} />
          </div>
        </div>

        <Button type="button" variant="outline" className="mt-4 w-full" onClick={onGerarNovoQr}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Gerar novo QR
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Status ao vivo</p>
        <div className="space-y-2">
          {marcos.map((marco) => (
            <div key={marco.id} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-sm", marco.done ? "border-[var(--success)]/40 bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--text-primary)]" : "border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-tertiary)]")}>
              <CheckCircle2 className={cn("h-4 w-4", marco.done ? "text-[var(--success)]" : "text-[var(--text-tertiary)]")} />
              <span>{marco.label}</span>
            </div>
          ))}
        </div>

        {pairingCode ? (
          <div className="rounded-xl border border-[var(--info)]/35 bg-[color-mix(in_srgb,var(--info)_12%,transparent)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--info)]">Codigo alternativo</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]">{pairingCode}</code>
              <Button type="button" size="sm" variant="outline" className="min-w-11" onClick={copiarCodigo}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">{copiado ? "Codigo copiado" : "Use esse codigo se nao conseguir escanear."}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
