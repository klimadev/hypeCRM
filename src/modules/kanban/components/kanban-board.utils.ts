import type { Estagio, OrigemContato } from "../types";

export type SinalVisualNegocioKanban = {
  circle: string | null;
  border: string | null;
};

export type BadgeOrigemKanban = {
  label: string;
  tone: "anuncio" | "whatsapp" | "manual";
};

export function obterTintColunaKanban(estagio: Estagio): string {
  if (estagio.tipo === "GANHO") {
    return "bg-[color:rgba(16,185,129,0.04)]";
  }

  if (estagio.tipo === "PERDIDO") {
    return "bg-[color:rgba(255,255,255,0.02)]";
  }

  if (estagio.nome === "Pré Aprovação") {
    return "bg-[color:rgba(245,158,11,0.04)]";
  }

  return "";
}

export function obterSinalVisualNegocioKanban(estagio: Estagio): SinalVisualNegocioKanban {
  if (estagio.tipo === "GANHO") {
    return {
      circle: "h-2 w-2 rounded-full bg-emerald-500",
      border: "border-l-2 border-l-emerald-500",
    };
  }

  if (estagio.tipo === "PERDIDO") {
    return {
      circle: "h-2 w-2 rounded-full bg-zinc-500",
      border: "border-l-2 border-l-zinc-500",
    };
  }

  return {
    circle: null,
    border: null,
  };
}

export function formatarTempoRelativoKanban(atualizadoEm: string, agoraMs: number): string {
  const atualizadoMs = new Date(atualizadoEm).getTime();
  if (Number.isNaN(atualizadoMs)) return "";

  const diff = agoraMs - atualizadoMs;
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (dias <= 0) return "Hoje";
  if (dias === 1) return "Ontem";
  if (dias < 7) return `${dias}d atras`;
  if (dias < 30) return `${Math.floor(dias / 7)} sem atras`;
  return `${Math.floor(dias / 30)}m atras`;
}

export function obterBadgeOrigemKanban(origem?: OrigemContato | null): BadgeOrigemKanban | null {
  switch (origem) {
    case "ANUNCIO_CTWA":
      return { label: "Anúncio", tone: "anuncio" };
    case "SINCRONIZACAO_WHATSAPP":
      return { label: "WhatsApp", tone: "whatsapp" };
    case "MANUAL":
      return { label: "Manual", tone: "manual" };
    default:
      return null;
  }
}

export function obterClasseIndicadorEtapaKanban(estagio: Estagio) {
  if (estagio.tipo === "GANHO") return "bg-emerald-500";
  if (estagio.tipo === "PERDIDO") return "bg-zinc-500";
  if (estagio.tipo === "ABERTO" && estagio.nome === "Pré Aprovação") return "bg-amber-400";
  return "bg-blue-400";
}
