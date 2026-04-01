"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { OptimisticSync } from "@/components/ui/optimistic-sync";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { Clock, Loader2, QrCode, RefreshCw, RotateCcw, Trash2, Wifi, WifiOff, Zap } from "lucide-react";
import type { WhatsappInstancia } from "../types";
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
    connected: "text-emerald-500",
    disconnected: "text-[var(--text-tertiary)]",
    qrcode: "animate-pulse text-amber-500",
    loading: "text-blue-500 animate-pulse",
    error: "text-rose-500",
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
  buscarQrCode: (id: string) => Promise<string | null>;
};

export function InstancesListCard(props: InstanceCardProps) {
  const { instancia, onExcluir, onAtualizarStatus, onReconectar, estaReconectando, getQrCode, buscarQrCode } = props;
  const isTemporario = instancia.id.startsWith("temp-");
  const badge = getStatusBadgeWhatsapp(instancia);
  const isConnected = badge.icon === "connected";
  const isReconectando = estaReconectando(instancia.id);
  const podeReconectar = !isConnected && !isTemporario;
  const uptime = useMemo(() => calculateUptimeWhatsapp(instancia.last_seen_at || null), [instancia.last_seen_at]);

  return (
    <OptimisticSync key={instancia.id} active={isTemporario} className="cursor-wait">
      <Card className={`group relative overflow-hidden rounded-2xl border transition-all hover:shadow-lg ${isConnected ? "border-[rgba(16,185,129,0.22)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))] shadow-[0_22px_45px_-28px_rgba(16,185,129,0.38)]" : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"}`}>
        <div className={`absolute left-0 top-0 h-1 w-full transition-colors ${isConnected ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : badge.icon === "qrcode" ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-slate-200"}`} />
        <CardContent className={`p-5 pt-6 ${isConnected ? "bg-zinc-900" : ""}`}>
          <div className="flex items-start gap-4">
            <div className="relative">
              {instancia.profile_pic ? (
                <Image src={instancia.profile_pic} alt="Foto de perfil" width={56} height={56} className={`h-14 w-14 rounded-xl object-cover shadow-sm ${isConnected ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-900" : ""}`} unoptimized />
              ) : (
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-sm ${isConnected ? "bg-gradient-to-br from-emerald-900 to-emerald-800 text-emerald-400 ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-900" : "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600"}`}>
                  <span className="text-lg font-bold">{getInitialsWhatsapp(instancia.profile_name || instancia.nome)}</span>
                </div>
              )}
              <div className={`absolute -bottom-0.5 -right-0.5 flex ${isConnected ? "h-4 w-4 bg-emerald-500 ring-2 ring-emerald-400" : "h-5 w-5 border-2 border-[var(--surface)] bg-[var(--surface-elevated)]"} items-center justify-center rounded-full`}>
                {isConnected ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> : <StatusIcon icon={badge.icon} />}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-[var(--text-primary)]">{instancia.profile_name || instancia.nome}</h3>
              {instancia.phone ? <p className={`mt-0.5 truncate text-sm font-mono ${isConnected ? "text-emerald-400/80" : "text-[var(--text-secondary)]"}`}>{instancia.phone}</p> : null}
              {!instancia.phone && instancia.instance_name ? <p className={`mt-0.5 truncate text-xs ${isConnected ? "text-zinc-500" : "text-[var(--text-tertiary)]"}`}>{instancia.instance_name}</p> : null}
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${isConnected ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400" : badge.className}`}>
                  <StatusIcon icon={badge.icon} />
                  {isConnected ? "Sincronizado e Pronto" : badge.labelShort}
                </span>
              </div>
            </div>
          </div>

          {isConnected ? (
            <div className="mt-4 flex items-center gap-4 rounded-lg bg-zinc-800/50 p-3">
              <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-emerald-400" /><span className="text-xs text-zinc-400">{instancia.latency_ms ? `${instancia.latency_ms}ms` : "—"}</span></div>
              <div className="h-3 w-px bg-zinc-700" />
              <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-emerald-400" /><span className="text-xs text-zinc-400">{uptime}</span></div>
            </div>
          ) : null}

          <InstancesListQrCode qrCode={getQrCode(instancia.id)} phone={instancia.phone} instanciaId={instancia.id} buscarQrCode={buscarQrCode} />

          <div className="mt-4 flex gap-2">
            {podeReconectar ? (
              <Button size="sm" className="flex-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" disabled={isReconectando} onClick={() => onReconectar(instancia.id)}>
                {isReconectando ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1.5 h-3.5 w-3.5" />}
                Reconectar
              </Button>
            ) : null}
            <Button variant="outline" size="sm" className={`flex-1 rounded-xl transition-all ${isConnected ? "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800" : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-white/4"}`} disabled={isTemporario} onClick={() => onAtualizarStatus(instancia.id)}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Atualizar
            </Button>
            <Tooltip content="Excluir instância">
              <Button variant="outline" size="sm" className="rounded-xl border-[rgba(244,63,94,0.28)] text-[var(--danger)] transition-all hover:border-[rgba(244,63,94,0.36)] hover:bg-[rgba(244,63,94,0.1)]" disabled={isTemporario} onClick={() => onExcluir(instancia.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </OptimisticSync>
  );
}
