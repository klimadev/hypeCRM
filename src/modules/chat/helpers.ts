import type { ChatUnificado } from "./types";

type MetaOrigemLead = {
  label: string;
  variant: "success" | "info" | "secondary";
};

export function formatarTelefoneChat(tel?: string | null): string {
  if (!tel) return "-";

  const digits = tel.replace(/\D/g, "");
  if (!digits) return tel;

  if (digits.length === 13 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const parte = digits.slice(4);
    return `+${digits.slice(0, 2)} (${ddd}) ${parte.slice(0, 5)}-${parte.slice(5)}`;
  }
  return `+${digits}`;
}

export function formatarTimestampRelativoChat(timestamp?: number | null): string {
  if (!timestamp) return "";

  try {
    const data = new Date(timestamp * 1000);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin}min`;
    if (diffHoras < 24) return `${diffHoras}h`;
    if (diffDias < 7) return `${diffDias}d`;

    return data.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

export function formatarDataAbsolutaChat(timestamp: number): string {
  try {
    const data = new Date(timestamp * 1000);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function obterNomeChat(chat: ChatUnificado): string {
  return (
    chat.leadMatch?.nome ??
    (chat.pushName && chat.pushName !== "Você" ? chat.pushName : null) ??
    formatarTelefoneChat(chat.telefone)
  );
}

export function marcarChatComoLidoLocalmente(chat: ChatUnificado): ChatUnificado {
  return { ...chat, unreadCount: 0 };
}

export function obterMetaOrigemLead(origem?: string | null): MetaOrigemLead | null {
  switch (origem) {
    case "ANUNCIO_CTWA":
      return { label: "Anúncio", variant: "info" };
    case "SINCRONIZACAO_WHATSAPP":
      return { label: "WhatsApp", variant: "success" };
    case "MANUAL":
      return { label: "Manual", variant: "secondary" };
    default:
      return null;
  }
}

export function obterFiltroOrigemLead(origem?: string | null): "anuncio" | "whatsapp" | "manual" | "outros" {
  switch (origem) {
    case "ANUNCIO_CTWA":
      return "anuncio";
    case "SINCRONIZACAO_WHATSAPP":
      return "whatsapp";
    case "MANUAL":
      return "manual";
    default:
      return "outros";
  }
}
