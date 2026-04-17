import { instanciaWhatsappEstaConectada, normalizarStatusInstanciaWhatsapp } from "@/lib/whatsapp-instancia-status";
import type { WhatsappInstancia } from "../types";

export interface StatusConfigWhatsapp {
  label: string;
  labelShort: string;
  labelDetailed: string;
  className: string;
  icon: "connected" | "disconnected" | "qrcode" | "loading" | "error";
}

export function getStatusBadgeWhatsapp(instancia: Pick<WhatsappInstancia, "status" | "phone">): StatusConfigWhatsapp {
  const statusLower = normalizarStatusInstanciaWhatsapp(instancia.status);

  if (instanciaWhatsappEstaConectada(instancia)) {
    return {
      label: "Conectado",
      labelShort: "Online",
      labelDetailed: "Sincronizado e Pronto",
      className: "border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]",
      icon: "connected",
    };
  }

  if (statusLower === "pending" || statusLower === "qrcode" || statusLower === "qr_code") {
    return {
      label: "Escaneie o QR Code",
      labelShort: "QR",
      labelDetailed: "Aguardando Conexão",
      className: "border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)]",
      icon: "qrcode",
    };
  }

  if (statusLower === "loading" || statusLower === "creating") {
    return {
      label: "Carregando...",
      labelShort: "Carregando",
      labelDetailed: "Inicializando",
      className: "border-[var(--info)] bg-[color-mix(in_srgb,var(--info)_12%,transparent)] text-[var(--info)]",
      icon: "loading",
    };
  }

  if (statusLower === "disconnected" || statusLower === "close") {
    return {
      label: "Desconectado",
      labelShort: "Offline",
      labelDetailed: "Desconectado",
      className: "bg-[var(--surface-soft)] text-[var(--text-secondary)] border-[var(--border-subtle)]",
      icon: "disconnected",
    };
  }

  return {
    label: "Erro",
    labelShort: "Erro",
    labelDetailed: "Erro de Conexão",
    className: "border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]",
    icon: "error",
  };
}

export function getInitialsWhatsapp(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function calculateUptimeWhatsapp(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "—";
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hoje";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}
