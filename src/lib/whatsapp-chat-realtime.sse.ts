import type { ConversasResponse } from "@/modules/whatsapp/types";
import {
  type ChatMessagesSnapshot,
  type MensagensSnapshot,
  type UnifiedChatsSnapshot,
  obterEstadoGlobalRealtime,
  type StreamChannel,
  type StreamChannelParams,
  type StreamEventPayload,
} from "./whatsapp-chat-realtime.state";

const encoder = new TextEncoder();
const HEARTBEAT_MS = 15000;
const DEFAULT_MESSAGES_POLL_MS = 10000;
const DEFAULT_CONVERSATIONS_POLL_MS = 10000;

function serializarEvento(event: string, data: StreamEventPayload) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function publicar(channel: StreamChannel, event: string, data: StreamEventPayload) {
  for (const [subscriberId, subscriber] of channel.subscribers.entries()) {
    try {
      subscriber.controller.enqueue(serializarEvento(event, data));
    } catch {
      channel.subscribers.delete(subscriberId);
    }
  }
}

function limparCanal(chave: string) {
  const estado = obterEstadoGlobalRealtime();
  const channel = estado.channels.get(chave);
  if (!channel) {
    return;
  }

  if (channel.heartbeat) {
    clearInterval(channel.heartbeat);
  }

  if (channel.polling) {
    clearTimeout(channel.polling);
  }

  estado.channels.delete(chave);
}

function agendarPolling(channel: StreamChannel) {
  if (channel.polling) {
    clearTimeout(channel.polling);
  }

  if (channel.subscribers.size === 0) {
    limparCanal(channel.chave);
    return;
  }

  channel.polling = setTimeout(() => {
    void executarPolling(channel);
  }, channel.pollMs);
}

async function executarPolling(channel: StreamChannel) {
  if (channel.inFlight || channel.subscribers.size === 0) {
    agendarPolling(channel);
    return;
  }

  const tarefa = (async () => {
    try {
      const snapshot = await channel.carregarSnapshot();
      const hash = JSON.stringify(snapshot);

      if (hash !== channel.ultimoHash) {
        channel.ultimoHash = hash;

        if (channel.tipo === "chat") {
          const dados = snapshot as MensagensSnapshot;
          publicar(channel, "snapshot", {
            messages: dados.messages,
            unreadCount: dados.unreadCount,
            connectionStatus: dados.connectionStatus,
          });
        } else if (channel.tipo === "conversations") {
          const dados = snapshot as ConversasResponse;
          publicar(channel, "snapshot", {
            conversas: dados.conversas,
            cursor: dados.cursor,
            temMais: dados.temMais,
          });
        } else if (channel.tipo === "messages") {
          const dados = snapshot as ChatMessagesSnapshot;
          publicar(channel, "snapshot", {
            messages: dados.messages,
            hasMore: dados.hasMore,
          });
        } else {
          const dados = snapshot as UnifiedChatsSnapshot;
          publicar(channel, "snapshot", {
            chats: dados.chats,
          });
        }
      }
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro ao sincronizar stream.";
      publicar(channel, "error", {
        erro: mensagem,
        ts: new Date().toISOString(),
      });
    } finally {
      channel.inFlight = null;
      agendarPolling(channel);
    }
  })();

  channel.inFlight = tarefa;
  await tarefa;
}

function criarCanal(params: StreamChannelParams): StreamChannel {
  const channel: StreamChannel = {
    tipo: params.tipo,
    chave: params.chave,
    pollMs: params.pollMs ?? (params.tipo === "chat" ? DEFAULT_MESSAGES_POLL_MS : DEFAULT_CONVERSATIONS_POLL_MS),
    subscribers: new Map(),
    heartbeat: null,
    polling: null,
    inFlight: null,
    carregarSnapshot: params.carregarSnapshot,
    ultimoHash: null,
  };

  channel.heartbeat = setInterval(() => {
    if (channel.subscribers.size === 0) {
      limparCanal(channel.chave);
      return;
    }

    publicar(channel, "heartbeat", { ts: new Date().toISOString() });
  }, HEARTBEAT_MS);

  return channel;
}

export function criarRespostaSse(params: StreamChannelParams, request: Request) {
  const estado = obterEstadoGlobalRealtime();
  const channel = estado.channels.get(params.chave) ?? criarCanal(params);
  estado.channels.set(params.chave, channel);

  const subscriberId = `${params.chave}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      channel.subscribers.set(subscriberId, { id: subscriberId, controller });
      controller.enqueue(serializarEvento("connected", { connectedAt: new Date().toISOString() }));
      void executarPolling(channel);

      request.signal.addEventListener(
        "abort",
        () => {
          channel.subscribers.delete(subscriberId);
          if (channel.subscribers.size === 0) {
            limparCanal(channel.chave);
          }
        },
        { once: true },
      );
    },
    cancel() {
      channel.subscribers.delete(subscriberId);
      if (channel.subscribers.size === 0) {
        limparCanal(channel.chave);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
