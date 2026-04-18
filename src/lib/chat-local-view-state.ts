import { normalizarRemoteJidCanonico } from "./chat-remote-jid";

export type ChatViewedLocalState = {
  updatedAt: number;
  messageIds: string[];
};

const MAX_VIEWED_IDS = 200;

export function buildWhatsappViewedKey(instanceName: string, remoteJid: string): string {
  const jidCanonico = normalizarRemoteJidCanonico(remoteJid);
  return `crm:viewed:whatsapp:${instanceName}:${jidCanonico}`;
}

export function buildInstagramViewedKey(conversationId: string): string {
  return `crm:viewed:instagram:${conversationId}`;
}

export function readViewedMessageIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: ChatViewedLocalState = JSON.parse(raw);
    if (!parsed.messageIds || !Array.isArray(parsed.messageIds)) return [];
    return parsed.messageIds;
  } catch {
    return [];
  }
}

export function writeViewedMessageIds(key: string, messageIds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const uniqueIds = [...new Set(messageIds)].slice(0, MAX_VIEWED_IDS);
    const state: ChatViewedLocalState = {
      updatedAt: Date.now(),
      messageIds: uniqueIds,
    };
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Silently fail if localStorage is unavailable or quota exceeded
  }
}

export function mergeViewedMessageIds(key: string, newIds: string[]): string[] {
  const existing = readViewedMessageIds(key);
  const merged = [...existing, ...newIds];
  const unique = [...new Set(merged)];
  return unique.slice(0, MAX_VIEWED_IDS);
}

export function markMessagesAsViewed(key: string, messageIds: string[]): void {
  const merged = mergeViewedMessageIds(key, messageIds);
  writeViewedMessageIds(key, merged);
}

export function isMessageViewedLocally(key: string, messageId: string): boolean {
  const ids = readViewedMessageIds(key);
  return ids.includes(messageId);
}

export function clearViewedMessages(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}