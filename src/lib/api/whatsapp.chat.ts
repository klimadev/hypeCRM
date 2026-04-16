import type {
  ChatConnectionStatus,
  ChatContextResponse,
  ConversasResponse,
  ConversasStreamSnapshot,
  WhatsappChatMessage,
} from "@/modules/whatsapp/types";
import {
  type ApiErro,
  type ChatApiErro,
  type ChatApiResponse,
  type ChatMessagesStreamSnapshot,
  type MediaContent,
  type ResultadoApi,
  type SseCallbacks,
  criarAssinaturaSse,
  lerJsonSeguro,
} from "./whatsapp.shared";
import {
  criarBuscaConversasWhatsapp,
  criarBuscaStreamConversasWhatsapp,
  obterMidiaCacheWhatsapp,
  salvarMidiaCacheWhatsapp,
} from "./whatsapp.utils";

export async function listarMensagensWhatsapp(
  leadId: string,
  signal?: AbortSignal,
): Promise<
  | { ok: true; dados: { messages: WhatsappChatMessage[]; connectionStatus: ChatConnectionStatus; unreadCount: number } }
  | { ok: false; erro: string; codigo?: string; pdv?: { id: string; nome: string } | null; rotaConfiguracao?: string | null }
> {
  const resposta = await fetch(`/api/whatsapp/chat/messages?leadId=${leadId}`, { signal, cache: "no-store" });
  const json = await lerJsonSeguro<ChatApiResponse & ChatApiErro>(resposta);

  if (!resposta.ok) {
    return {
      ok: false,
      erro: json.erro ?? "Erro ao carregar mensagens.",
      codigo: json.codigo,
      pdv: json.pdv,
      rotaConfiguracao: json.rotaConfiguracao,
    };
  }

  return {
    ok: true,
    dados: {
      messages: json.messages ?? [],
      connectionStatus: json.connectionStatus ?? "unknown",
      unreadCount: json.unreadCount ?? 0,
    },
  };
}

export function assinarMensagensWhatsapp(
  leadId: string,
  callbacks: SseCallbacks<ChatMessagesStreamSnapshot>,
) {
  const searchParams = new URLSearchParams({ leadId });
  return criarAssinaturaSse(`/api/whatsapp/chat/messages/stream?${searchParams.toString()}`, callbacks);
}

export function assinarConversasWhatsapp(
  params: {
    busca?: string;
    naoLidas?: boolean;
    limite?: number;
  },
  callbacks: SseCallbacks<ConversasStreamSnapshot>,
) {
  const searchParams = criarBuscaStreamConversasWhatsapp(params);
  return criarAssinaturaSse(`/api/whatsapp/chat/conversations/stream?${searchParams.toString()}`, callbacks);
}

export async function listarConversasWhatsapp(
  params: {
    busca?: string;
    cursor?: string | null;
    limite?: number;
    naoLidas?: boolean;
  },
  signal?: AbortSignal,
): Promise<ResultadoApi<ConversasResponse>> {
  const searchParams = criarBuscaConversasWhatsapp(params);
  const resposta = await fetch(`/api/whatsapp/chat/conversations?${searchParams.toString()}`, {
    signal,
    cache: "no-store",
  });
  const json = await lerJsonSeguro<ConversasResponse & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar conversas." };
  }

  return {
    ok: true,
    dados: {
      conversas: Array.isArray(json.conversas) ? json.conversas : [],
      cursor: typeof json.cursor === "string" ? json.cursor : null,
      temMais: json.temMais === true,
    },
  };
}

export async function buscarContextoChat(
  leadId: string,
  signal?: AbortSignal,
): Promise<ResultadoApi<ChatContextResponse>> {
  const searchParams = new URLSearchParams({ leadId });
  const resposta = await fetch(`/api/whatsapp/chat/context?${searchParams.toString()}`, {
    signal,
    cache: "no-store",
  });
  const json = await lerJsonSeguro<ChatContextResponse & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar contexto do chat." };
  }

  return { ok: true, dados: json };
}

export async function enviarMensagemWhatsapp(payload: {
  leadId: string;
  text: string;
  clientTempId: string;
}): Promise<
  | { ok: true; dados: { message: WhatsappChatMessage; clientTempId: string } }
  | { ok: false; erro: string; codigo?: string; pdv?: { id: string; nome: string } | null; rotaConfiguracao?: string | null }
> {
  const resposta = await fetch("/api/whatsapp/chat/send-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await lerJsonSeguro<{ message?: WhatsappChatMessage; clientTempId?: string } & ChatApiErro>(resposta);

  if (!resposta.ok || !json.message) {
    return {
      ok: false,
      erro: json.erro ?? "Erro ao enviar mensagem.",
      codigo: json.codigo,
      pdv: json.pdv,
      rotaConfiguracao: json.rotaConfiguracao,
    };
  }

  return {
    ok: true,
    dados: {
      message: json.message,
      clientTempId: json.clientTempId ?? payload.clientTempId,
    },
  };
}

export async function marcarMensagensComoLidas(leadId: string): Promise<ResultadoApi<{ unreadCount: number }>> {
  const resposta = await fetch("/api/whatsapp/chat/mark-read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId }),
  });
  const json = await lerJsonSeguro<{ unreadCount?: number } & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao marcar mensagens como lidas." };
  }

  return { ok: true, dados: { unreadCount: json.unreadCount ?? 0 } };
}

export async function buscarMediaWhatsapp(
  leadId: string,
  messageId: string,
  retries: number = 2,
): Promise<ResultadoApi<{ media: MediaContent }>> {
  const cached = obterMidiaCacheWhatsapp(leadId, messageId);
  if (cached) {
    return { ok: true, dados: { media: cached } };
  }

  let lastError = "Erro ao buscar mídia.";
  let controller: AbortController | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    controller?.abort();
    if (timeoutId) clearTimeout(timeoutId);

    const currentController = new AbortController();
    controller = currentController;
    timeoutId = setTimeout(() => currentController.abort(), 10000);

    try {
      const resposta = await fetch(
        `/api/whatsapp/chat/media?leadId=${encodeURIComponent(leadId)}&messageId=${encodeURIComponent(messageId)}`,
        { cache: "no-store", signal: controller.signal },
      );

      if (!resposta.ok) {
        const erroJson = await resposta.json().catch(() => ({}));
        lastError = erroJson.erro ?? `Erro HTTP ${resposta.status}`;

        if (resposta.status >= 500) {
          await new Promise((resolver) => setTimeout(resolver, 500 * (attempt + 1)));
          continue;
        }
        break;
      }

      const json = await resposta.json().catch(() => ({}));

      if (!json.media) {
        lastError = "Mídia não encontrada.";
        break;
      }

      salvarMidiaCacheWhatsapp(leadId, messageId, json.media);
      if (timeoutId) clearTimeout(timeoutId);
      return { ok: true, dados: { media: json.media } };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        lastError = "Tempo limite excedido.";
      } else {
        lastError = err instanceof Error ? err.message : "Erro ao buscar mídia.";
      }

      if (attempt < retries) {
        await new Promise((resolver) => setTimeout(resolver, 500 * (attempt + 1)));
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  return { ok: false, erro: lastError };
}

export type UnifiedChatMessage = {
  id: string;
  remoteJid: string;
  fromMe: boolean;
  text: string;
  kind: string;
  timestamp: number;
  pushName: string | null;
  status: string;
  hasMedia: boolean;
  mediaUrl: string | null;
  optimistic?: boolean;
  error?: string | null;
};

export type UnifiedMessagesSnapshot = {
  messages: UnifiedChatMessage[];
  hasMore: boolean;
};

export async function buscarMediaChatUnificado(params: {
  instanceName: string;
  messageId: string;
}): Promise<ResultadoApi<{ media: MediaContent }>> {
  const searchParams = new URLSearchParams({
    instanceName: params.instanceName,
    messageId: params.messageId,
  });

  const resposta = await fetch(`/api/chat/messages/media?${searchParams.toString()}`, { cache: "no-store" });
  const json = await resposta.json().catch(() => ({}));

  if (!resposta.ok || !json.media) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar mídia." };
  }

  return { ok: true, dados: { media: json.media } };
}

export function assinarMensagensChatUnificado(
  params: { instanceName: string; remoteJid: string; limite?: number; page?: number },
  callbacks: SseCallbacks<UnifiedMessagesSnapshot>,
) {
  const searchParams = new URLSearchParams({
    instanceName: params.instanceName,
    remoteJid: params.remoteJid,
  });
  if (params.limite) searchParams.set("limite", String(params.limite));
  if (params.page) searchParams.set("page", String(params.page));
  return criarAssinaturaSse(`/api/chat/messages/stream?${searchParams.toString()}`, callbacks);
}

export async function buscarMensagensChatUnificado(
  params: { instanceName: string; remoteJid: string; limite?: number; page?: number },
  signal?: AbortSignal,
): Promise<ResultadoApi<UnifiedMessagesSnapshot>> {
  const searchParams = new URLSearchParams({
    instanceName: params.instanceName,
    remoteJid: params.remoteJid,
  });
  if (params.limite) searchParams.set("limite", String(params.limite));
  if (params.page) searchParams.set("page", String(params.page));
  const resposta = await fetch(`/api/chat/messages?${searchParams.toString()}`, {
    signal,
    cache: "no-store",
  });

  if (!resposta.ok) {
    const json = await resposta.json().catch(() => ({}));
    return { ok: false, erro: json.erro ?? "Erro ao carregar mensagens." };
  }

  const json = await resposta.json();
  return {
    ok: true,
    dados: {
      messages: json.messages ?? [],
      hasMore: json.hasMore ?? false,
    },
  };
}

export async function enviarMensagemChatUnificado(payload: {
  instanceName: string;
  remoteJid: string;
  text: string;
}): Promise<ResultadoApi<{ ok: true }>> {
  let json: Record<string, unknown>;

  try {
    const resposta = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    json = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return { ok: false, erro: (json.erro as string) ?? "Erro ao enviar mensagem." };
    }
  } catch (erroFetch) {
    console.error("[Chat] Erro de rede ao enviar mensagem", {
      erro: erroFetch instanceof Error ? erroFetch.message : String(erroFetch),
    });
    return { ok: false, erro: "Nao foi possivel conectar ao servidor. Verifique sua conexao." };
  }

  return { ok: true, dados: { ok: true } };
}

export type MensagemAgendada = {
  id: string;
  conteudo: string;
  agendadoPara: string;
  status: string;
  erro: string | null;
  tentativas: number;
  criadoEm: string;
};

export async function agendarMensagemChatUnificado(payload: {
  instanceName: string;
  remoteJid: string;
  text: string;
  agendadoPara: string;
  idLead?: string;
}): Promise<ResultadoApi<{ id: string; agendadoPara: string; status: string }>> {
  try {
    const resposta = await fetch("/api/chat/messages/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return { ok: false, erro: (json.erro as string) ?? "Erro ao agendar mensagem." };
    }

    return { ok: true, dados: json.mensagem };
  } catch (erroFetch) {
    console.error("[Chat] Erro de rede ao agendar mensagem", {
      erro: erroFetch instanceof Error ? erroFetch.message : String(erroFetch),
    });
    return { ok: false, erro: "Nao foi possivel conectar ao servidor." };
  }
}

export async function listarMensagensAgendadas(params: {
  instanceName: string;
  remoteJid: string;
}): Promise<ResultadoApi<{ agendadas: MensagemAgendada[] }>> {
  const searchParams = new URLSearchParams({
    instanceName: params.instanceName,
    remoteJid: params.remoteJid,
  });

  try {
    const resposta = await fetch(`/api/chat/messages/scheduled?${searchParams.toString()}`, {
      cache: "no-store",
    });

    const json = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return { ok: false, erro: (json.erro as string) ?? "Erro ao listar mensagens agendadas." };
    }

    return { ok: true, dados: { agendadas: json.agendadas ?? [] } };
  } catch (erroFetch) {
    console.error("[Chat] Erro de rede ao listar agendadas", {
      erro: erroFetch instanceof Error ? erroFetch.message : String(erroFetch),
    });
    return { ok: false, erro: "Nao foi possivel conectar ao servidor." };
  }
}

export async function cancelarMensagemAgendada(id: string): Promise<ResultadoApi<{ ok: true }>> {
  try {
    const resposta = await fetch("/api/chat/messages/scheduled", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const json = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return { ok: false, erro: (json.erro as string) ?? "Erro ao cancelar mensagem agendada." };
    }

    return { ok: true, dados: { ok: true } };
  } catch (erroFetch) {
    console.error("[Chat] Erro de rede ao cancelar agendada", {
      erro: erroFetch instanceof Error ? erroFetch.message : String(erroFetch),
    });
    return { ok: false, erro: "Nao foi possivel conectar ao servidor." };
  }
}
