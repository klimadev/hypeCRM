import type { ChatConnectionStatus, ConversaResumo, ConversasResponse, WhatsappChatMessage } from "@/modules/whatsapp/types";

export type MensagensSnapshot = {
  messages: WhatsappChatMessage[];
  connectionStatus: ChatConnectionStatus;
  unreadCount: number;
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

export type StreamChannelParams = ChatStreamParams | ConversationsStreamParams;

export type StreamEventPayload = {
  connectedAt?: string;
  erro?: string;
  unreadCount?: number;
  connectionStatus?: ChatConnectionStatus;
  messages?: WhatsappChatMessage[];
  conversas?: ConversaResumo[];
  cursor?: string | null;
  temMais?: boolean;
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
  carregarSnapshot: () => Promise<MensagensSnapshot | ConversasResponse>;
  ultimoHash: string | null;
};

export type ChatSnapshotCache = {
  promise: Promise<MensagensSnapshot> | null;
  snapshot: MensagensSnapshot | null;
  expiresAt: number;
};

type GlobalRealtimeState = {
  channels: Map<string, StreamChannel>;
  chatCache: Map<string, ChatSnapshotCache>;
};

declare global {
  var __whatsappChatRealtimeState: GlobalRealtimeState | undefined;
}

export function obterEstadoGlobalRealtime(): GlobalRealtimeState {
  if (!globalThis.__whatsappChatRealtimeState) {
    globalThis.__whatsappChatRealtimeState = {
      channels: new Map(),
      chatCache: new Map(),
    };
  }

  return globalThis.__whatsappChatRealtimeState;
}
