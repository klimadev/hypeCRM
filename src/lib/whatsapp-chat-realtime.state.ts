import type { ChatConnectionStatus, ConversaResumo, ConversasResponse, WhatsappChatMessage } from "@/modules/whatsapp/types";
import type { ChatUnificado } from "@/modules/chat/types";

export type MensagensSnapshot = {
  messages: WhatsappChatMessage[];
  connectionStatus: ChatConnectionStatus;
  unreadCount: number;
};

export type UnifiedChatsSnapshot = {
  chats: ChatUnificado[];
};

export type ChatMessagesSnapshot = {
  messages: Array<{
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
  }>;
  hasMore: boolean;
};

export type ChatStreamParams = {
  tipo: "chat";
  chave: string;
  pollMs?: number;
  carregarSnapshot: () => Promise<MensagensSnapshot>;
};

export type ConversationsStreamParams = {
  tipo: "conversations";
  chave: string;
  pollMs?: number;
  carregarSnapshot: () => Promise<ConversasResponse>;
};

export type UnifiedChatsStreamParams = {
  tipo: "unified";
  chave: string;
  pollMs?: number;
  carregarSnapshot: () => Promise<UnifiedChatsSnapshot>;
};

export type ChatMessagesStreamParams = {
  tipo: "messages";
  chave: string;
  pollMs?: number;
  carregarSnapshot: () => Promise<ChatMessagesSnapshot>;
};

export type StreamChannelParams = ChatStreamParams | ConversationsStreamParams | UnifiedChatsStreamParams | ChatMessagesStreamParams;

export type StreamEventPayload = {
  connectedAt?: string;
  erro?: string;
  unreadCount?: number;
  connectionStatus?: ChatConnectionStatus;
  messages?: WhatsappChatMessage[] | ChatMessagesSnapshot["messages"];
  conversas?: ConversaResumo[];
  cursor?: string | null;
  temMais?: boolean;
  chats?: ChatUnificado[];
  hasMore?: boolean;
  ts?: string;
};

export type Subscriber = {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

export type StreamChannel = {
  tipo: StreamChannelParams["tipo"];
  chave: string;
  pollMs: number;
  subscribers: Map<string, Subscriber>;
  heartbeat: ReturnType<typeof setInterval> | null;
  polling: ReturnType<typeof setTimeout> | null;
  inFlight: Promise<void> | null;
  carregarSnapshot: () => Promise<MensagensSnapshot | ConversasResponse | UnifiedChatsSnapshot | ChatMessagesSnapshot>;
  ultimoHash: string | null;
};

type GlobalRealtimeState = {
  channels: Map<string, StreamChannel>;
};

declare global {
  var __whatsappChatRealtimeState: GlobalRealtimeState | undefined;
}

export function obterEstadoGlobalRealtime(): GlobalRealtimeState {
  if (!globalThis.__whatsappChatRealtimeState) {
    globalThis.__whatsappChatRealtimeState = {
      channels: new Map(),
    };
  }

  return globalThis.__whatsappChatRealtimeState;
}
