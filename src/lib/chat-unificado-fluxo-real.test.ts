import { describe, expect, it } from "vitest";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? "";
const INSTANCE_NAME = "hype_lima_pessoal";
const runRealIntegration = Boolean(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY);

const describeReal = runRealIntegration ? describe : describe.skip;

type ChatRecord = {
  remoteJid?: string;
  remoteJidAlt?: string | null;
  pushName?: string | null;
  isGroup?: boolean;
  messageTimestamp?: number;
  lastMessage?: {
    key?: {
      remoteJid?: string;
      remoteJidAlt?: string;
      fromMe?: boolean;
    };
    pushName?: string | null;
  };
};

function logSection(title: string, payload: unknown) {
  console.log(`\n[CHAT-RAW] ${title}`);
  console.log(JSON.stringify(payload, null, 2));
}

async function postEvolution(path: string, body: unknown) {
  const response = await fetch(`${EVOLUTION_API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => ({ invalidJson: true, status: response.status }));

  return {
    ok: response.ok,
    status: response.status,
    json,
  };
}

function extractChatRecords(raw: unknown): ChatRecord[] {
  if (Array.isArray(raw)) return raw as ChatRecord[];
  if (raw && typeof raw === "object") {
    const candidate = raw as {
      chats?: unknown;
      data?: unknown;
      messages?: unknown;
      records?: unknown;
    };

    if (Array.isArray(candidate.chats)) return candidate.chats as ChatRecord[];
    if (Array.isArray(candidate.data)) return candidate.data as ChatRecord[];
    if (Array.isArray(candidate.messages)) return candidate.messages as ChatRecord[];
    if (Array.isArray(candidate.records)) return candidate.records as ChatRecord[];
  }

  return [];
}

function pickChat(records: ChatRecord[]) {
  return records.find((chat) => {
    const jid = chat.remoteJidAlt ?? chat.remoteJid ?? "";
    if (!jid) return false;
    if (chat.isGroup) return false;
    if (jid.includes("@g.us")) return false;
    if (jid === "status@broadcast") return false;
    return true;
  });
}

describeReal("chat unificado fluxo real bruto", () => {
  it(
    "busca chats e mensagens brutas da instancia hype_lima_pessoal",
    async () => {
      const findChatsBody = {};
      const chatsResponse = await postEvolution(`/chat/findChats/${INSTANCE_NAME}`, findChatsBody);

      logSection("findChats request body", findChatsBody);
      logSection("findChats raw response", chatsResponse);

      expect(chatsResponse.ok).toBe(true);

      const chatRecords = extractChatRecords(chatsResponse.json);
      logSection("findChats normalized records summary", {
        total: chatRecords.length,
        firstFive: chatRecords.slice(0, 5),
      });

      expect(chatRecords.length).toBeGreaterThan(0);

      const selectedChat = pickChat(chatRecords);
      expect(selectedChat).toBeTruthy();

      const selectedRemoteJid = selectedChat?.remoteJidAlt ?? selectedChat?.remoteJid ?? "";
      expect(selectedRemoteJid).toBeTruthy();

      logSection("selected chat", {
        selectedRemoteJid,
        selectedChat,
      });

      const findMessagesBody = {
        where: {
          key: {
            remoteJid: selectedRemoteJid,
            remoteJidAlt: selectedRemoteJid,
          },
        },
        page: 1,
        offset: 20,
      };

      const messagesResponse = await postEvolution(`/chat/findMessages/${INSTANCE_NAME}`, findMessagesBody);

      logSection("findMessages request body", findMessagesBody);
      logSection("findMessages raw response", messagesResponse);

      expect(messagesResponse.ok).toBe(true);

      const records =
        messagesResponse.json &&
        typeof messagesResponse.json === "object" &&
        "messages" in messagesResponse.json &&
        messagesResponse.json.messages &&
        typeof messagesResponse.json.messages === "object" &&
        "records" in messagesResponse.json.messages &&
        Array.isArray(messagesResponse.json.messages.records)
          ? messagesResponse.json.messages.records
          : [];

      logSection("findMessages records summary", {
        total: records.length,
        firstFive: records.slice(0, 5),
      });

      expect(Array.isArray(records)).toBe(true);
    },
    60_000,
  );
});
