"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { OptimisticSync } from "@/components/ui/optimistic-sync";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { Loader2, QrCode, RefreshCw, RotateCcw, Trash2, Wifi, WifiOff } from "lucide-react";
import type { ResultadoQrWhatsapp, WhatsappInstancia } from "../types";
import { calculateUptimeWhatsapp, getInitialsWhatsapp, getStatusBadgeWhatsapp } from "./instances-list.utils";
import { InstancesListQrCode } from "./instances-list-qr-code";

function StatusIcon({ icon }: { icon: "connected" | "disconnected" | "qrcode" | "loading" | "error" }) {
  const icons = {
    connected: <Wifi className="h-4 w-4" />,
    disconnected: <WifiOff className="h-4 w-4" />,
    qrcode: <QrCode className="h-4 w-4" />,
    loading: <Loader2 className="h-4 w-4 animate-spin" />,
    error: <WifiOff className="h-4 w-4" />,
  };
  const iconClasses = {
    connected: "text-[var(--success)]",
    disconnected: "text-[var(--text-tertiary)]",
    qrcode: "animate-pulse text-[var(--warning)]",
    loading: "text-[var(--info)] animate-pulse",
    error: "text-[var(--danger)]",
  };
  return <span className={iconClasses[icon]}>{icons[icon]}</span>;
}

type InstanceCardProps = {
  instancia: WhatsappInstancia;
  onExcluir: (id: string) => Promise<void>;
  onAtualizarStatus: (id: string) => Promise<void>;
  onReconectar: (id: string) => Promise<void>;
  estaReconectando: (id: string) => boolean;
  getQrCode: (id: string) => string | null;
  buscarQrCode: (id: string) => Promise<ResultadoQrWhatsapp | null>;
};

export function InstancesListCard(props: InstanceCardProps) {
  const { instancia, onExcluir, onAtualizarStatus, onReconectar, estaReconectando, getQrCode, buscarQrCode } = props;
  const isTemporario = instancia.id.startsWith("temp-");
  const badge = getStatusBadgeWhatsapp(instancia);
  const isConnected = badge.icon === "connected";
  const isReconectando = estaReconectando(instancia.id);
  const uptime = useMemo(() => calculateUptimeWhatsapp(instancia.last_seen_at || null), [instancia.last_seen_at]);
  const [showQrCode, setShowQrCode] = useState(false);

  return (
    <OptimisticSync key={instancia.id} active={isTemporario} className="cursor-wait">
      <Card className={`group relative overflow-hidden rounded-2xl border transition-all hover:shadow-lg ${isConnected ? "border-[var(--success)] bg-[var(--surface)] shadow-[var(--shadow-md)]" : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"}`}>
        <CardContent className={`p-5 ${isConnected ? "bg-[var(--surface-elevated)]" : ""}`}>
          <div className="flex items-start gap-4">
            <div className="relative">
              {instancia.profile_pic ? (
                <Image src={instancia.profile_pic} alt="Foto de perfil" width={56} height={56} className="h-14 w-14 rounded-xl object-cover shadow-sm" unoptimized />
              ) : (
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-sm ${isConnected ? "bg-[color-mix(in_srgb,var(--success)_18%,var(--surface))] text-[var(--success)]" : "bg-[var(--surface-soft)] text-[var(--success)]"}`}>
                  <span className="text-lg font-bold">{getInitialsWhatsapp(instancia.profile_name || instancia.nome)}</span>
                </div>
              )}
              <div className={`absolute -bottom-0.5 -right-0.5 flex ${isConnected ? "h-4 w-4 bg-[var(--success)] ring-2 ring-[color-mix(in_srgb,var(--success)_70%,transparent)]" : "h-5 w-5 border-2 border-[var(--surface)] bg-[var(--surface-elevated)]"} items-center justify-center rounded-full`}>
                {isConnected ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary-foreground)]" /> : <StatusIcon icon={badge.icon} />}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-[var(--text-primary)]">{instancia.profile_name || instancia.nome}</h3>
              {instancia.phone ? <p className={`mt-0.5 truncate text-sm font-mono ${isConnected ? "text-[color-mix(in_srgb,var(--success)_80%,var(--text-secondary))]" : "text-[var(--text-secondary)]"}`}>{instancia.phone}</p> : null}
              {!instancia.phone && instancia.instance_name ? <p className={`mt-0.5 truncate text-xs ${isConnected ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>{instancia.instance_name}</p> : null}
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${isConnected ? "border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_20%,transparent)] text-[var(--success)]" : badge.className}`}>
                  <StatusIcon icon={badge.icon} />
                  {isConnected ? "Sincronizado e Pronto" : badge.labelShort}
                </span>
              </div>
            </div>
          </div>

          {isConnected ? (
            <p className="mt-4 text-xs text-[var(--text-secondary)]">{instancia.latency_ms ? `${instancia.latency_ms}ms` : "—"} &middot; {uptime}</p>
          ) : null}

          {!instancia.phone ? (
            <button type="button" onClick={() => setShowQrCode(!showQrCode)} className="mt-3 text-xs text-[var(--text-tertiary)] underline-offset-2 hover:text-[var(--text-secondary)] hover:underline">
              {showQrCode ? "Ocultar QR Code" : "Mostrar QR Code"}
            </button>
          ) : null}
          {showQrCode ? <InstancesListQrCode qrCode={getQrCode(instancia.id)} phone={instancia.phone} instanciaId={instancia.id} buscarQrCode={buscarQrCode} /> : null}

          <div className="mt-4 flex gap-2">
            {!isTemporario ? (
              <Button size="sm" className={`flex-1 rounded-xl transition-all ${isConnected ? "bg-[var(--surface-soft)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]" : "bg-[var(--success)] text-[var(--primary-foreground)] hover:brightness-110"}`} disabled={isReconectando} onClick={() => isConnected ? onAtualizarStatus(instancia.id) : onReconectar(instancia.id)}>
                {isReconectando ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : isConnected ? <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> : <RotateCcw className="mr-1.5 h-3.5 w-3.5" />}
                {isConnected ? "Atualizar" : "Reconectar"}
              </Button>
            ) : null}
            <Tooltip content="Excluir instância">
              <Button variant="outline" size="sm" className="rounded-xl border-[var(--danger)] text-[var(--danger)] transition-all hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]" disabled={isTemporario} onClick={() => onExcluir(instancia.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </OptimisticSync>
  );
}
