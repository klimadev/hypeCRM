import type { WhatsappJobItem } from "@/modules/whatsapp/types";
import type { MediaContent } from "./whatsapp.shared";

export function criarBuscaConversasWhatsapp(params: {
  busca?: string;
  cursor?: string | null;
  limite?: number;
  naoLidas?: boolean;
}) {
  const searchParams = new URLSearchParams();

  if (params.busca?.trim()) {
    searchParams.set("busca", params.busca.trim());
  }

  if (params.cursor?.trim()) {
    searchParams.set("cursor", params.cursor.trim());
  }

  if (typeof params.limite === "number") {
    searchParams.set("limite", String(params.limite));
  }

  if (params.naoLidas) {
    searchParams.set("naoLidas", "true");
  }

  return searchParams;
}

export function criarBuscaStreamConversasWhatsapp(params: {
  busca?: string;
  naoLidas?: boolean;
  limite?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params.busca?.trim()) {
    searchParams.set("busca", params.busca.trim());
  }

  if (params.naoLidas) {
    searchParams.set("naoLidas", "true");
  }

  if (typeof params.limite === "number") {
    searchParams.set("limite", String(params.limite));
  }

  return searchParams;
}

export function normalizarResumoJobsWhatsapp(
  resumo?: {
    pendentes?: number;
    processando?: number;
    falhas?: number;
    enviadosHoje?: number;
    atualizadoEm?: string;
  } | null,
) {
  return {
    pendentes: typeof resumo?.pendentes === "number" ? resumo.pendentes : 0,
    processando: typeof resumo?.processando === "number" ? resumo.processando : 0,
    falhas: typeof resumo?.falhas === "number" ? resumo.falhas : 0,
    enviadosHoje: typeof resumo?.enviadosHoje === "number" ? resumo.enviadosHoje : 0,
    atualizadoEm: typeof resumo?.atualizadoEm === "string" ? resumo.atualizadoEm : "",
  };
}

export function normalizarListaJobsWhatsapp(agendamentos?: WhatsappJobItem[] | null) {
  return Array.isArray(agendamentos) ? agendamentos : [];
}

export function criarChaveCacheMidiaWhatsapp(leadId: string, messageId: string) {
  return `${leadId}:${messageId}`;
}

const mediaCache = new Map<string, { media: MediaContent; timestamp: number }>();
const MEDIA_CACHE_TTL_MS = 5 * 60 * 1000;

export function obterMidiaCacheWhatsapp(leadId: string, messageId: string): MediaContent | null {
  const chave = criarChaveCacheMidiaWhatsapp(leadId, messageId);
  const cached = mediaCache.get(chave);
  if (cached && Date.now() - cached.timestamp < MEDIA_CACHE_TTL_MS) {
    return cached.media;
  }

  mediaCache.delete(chave);
  return null;
}

export function salvarMidiaCacheWhatsapp(leadId: string, messageId: string, media: MediaContent) {
  mediaCache.set(criarChaveCacheMidiaWhatsapp(leadId, messageId), { media, timestamp: Date.now() });
}
