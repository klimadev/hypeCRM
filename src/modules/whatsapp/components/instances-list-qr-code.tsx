"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Clock, QrCode } from "lucide-react";
import type { ResultadoQrWhatsapp } from "../types";

type QrCodeDisplayProps = {
  qrCode: string | null;
  phone: string | null;
  instanciaId: string;
  buscarQrCode: (id: string) => Promise<ResultadoQrWhatsapp | null>;
};

export function InstancesListQrCode({ qrCode, phone, instanciaId, buscarQrCode }: QrCodeDisplayProps) {
  const [tempoRestante, setTempoRestante] = useState(60);
  const [estaExpirado, setEstaExpirado] = useState(false);
  const [qrAtual, setQrAtual] = useState(qrCode);
  const [carregandoQr, setCarregandoQr] = useState(false);

  useEffect(() => {
    setQrAtual(qrCode);
  }, [qrCode]);

  useEffect(() => {
    if (phone) return;
    setTempoRestante(60);
    setEstaExpirado(false);
    const intervalo = setInterval(() => {
      setTempoRestante((antigo) => {
        if (antigo <= 1) {
          setEstaExpirado(true);
          return 0;
        }
        return antigo - 1;
      });
    }, 1000);
    return () => clearInterval(intervalo);
  }, [phone, qrAtual]);

  useEffect(() => {
    if (phone || qrAtual || !instanciaId || instanciaId.startsWith("temp-")) return;
    const carregarQr = async () => {
      setCarregandoQr(true);
      const novoSnapshot = await buscarQrCode(instanciaId);
      if (novoSnapshot?.qrCode) setQrAtual(novoSnapshot.qrCode);
      setCarregandoQr(false);
    };
    void carregarQr();
  }, [instanciaId, phone, qrAtual, buscarQrCode]);

  if (phone) return null;
  if (!qrAtual && !carregandoQr) return null;

  return (
    <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-5">
      {carregandoQr ? (
        <>
          <div className="h-64 w-64 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
          <p className="mt-4 text-sm text-[var(--text-secondary)]">Carregando QR Code...</p>
        </>
      ) : (
        <>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)]">
            <QrCode className="h-5 w-5 text-[var(--warning)]" />
          </div>
          <p className="mb-4 text-sm font-semibold text-[var(--warning)]">Escaneie o QR Code com seu WhatsApp</p>
          <div className="rounded-xl bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)] ring-1 ring-[var(--border-subtle)]">
            <Image src={qrAtual ?? ""} alt="QR Code" width={256} height={256} className="h-64 w-64" unoptimized />
          </div>
          <div className="mt-4 w-full max-w-xs">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1 text-[var(--text-secondary)]"><Clock className="h-3.5 w-3.5" />{estaExpirado ? "Expirado" : `${tempoRestante}s`}</span>
              <span className={estaExpirado ? "text-[var(--danger)]" : "text-[var(--text-tertiary)]"}>{estaExpirado ? "QR Code expirou" : "Tempo restante"}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--warning)]/90">WhatsApp → Configurações → Aparelhos conectados → Conectar ap.</p>
        </>
      )}
    </div>
  );
}
