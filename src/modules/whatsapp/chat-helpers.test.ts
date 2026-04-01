import { afterEach, describe, expect, it, vi } from "vitest";

import type { WhatsappChatMessage } from "./types";
import {
  criarItensListaMensagensWhatsapp,
  mergeWhatsappChatMessages,
  resolverLeadIdWhatsappChat,
} from "./chat-helpers";

function criarMensagem(
  sobrescrever: Partial<WhatsappChatMessage> & Pick<WhatsappChatMessage, "id" | "messageId" | "leadId" | "timestamp">,
): WhatsappChatMessage {
  return {
    id: sobrescrever.id,
    messageId: sobrescrever.messageId,
    leadId: sobrescrever.leadId,
    remoteJid: sobrescrever.remoteJid ?? "5511999999999@s.whatsapp.net",
    remoteJidAlt: sobrescrever.remoteJidAlt ?? null,
    fromMe: sobrescrever.fromMe ?? false,
    direction: sobrescrever.direction ?? "incoming",
    text: sobrescrever.text ?? "Teste",
    kind: sobrescrever.kind ?? "text",
    tipoLabel: sobrescrever.tipoLabel ?? "Texto",
    status: sobrescrever.status ?? "SENT",
    timestamp: sobrescrever.timestamp,
    timestampIso: sobrescrever.timestampIso ?? new Date(sobrescrever.timestamp * 1000).toISOString(),
    createdAtIso: sobrescrever.createdAtIso ?? new Date(sobrescrever.timestamp * 1000).toISOString(),
    readAtIso: sobrescrever.readAtIso ?? null,
    optimistic: sobrescrever.optimistic ?? false,
    error: sobrescrever.error ?? null,
    dadosAd: sobrescrever.dadosAd ?? null,
    hasMedia: sobrescrever.hasMedia,
    mediaUrl: sobrescrever.mediaUrl,
  };
}

describe("chat helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("prefere o leadId canonico e ignora valores vazios", () => {
    expect(resolverLeadIdWhatsappChat({ leadId: " lead-1 ", contatoId: "contato-1" })).toBe("lead-1");
    expect(resolverLeadIdWhatsappChat({ leadId: "   ", contatoId: " contato-2 " })).toBe("contato-2");
    expect(resolverLeadIdWhatsappChat({ leadId: undefined, contatoId: "   " })).toBeUndefined();
  });

  it("mescla mensagens repetidas preservando o status mais forte", () => {
    const base = [
      criarMensagem({
        id: "msg-1",
        messageId: "wamid-1",
        leadId: "lead-1",
        timestamp: 1_700_000_000,
        status: "PENDING",
        optimistic: true,
        text: "Ola",
      }),
    ];

    const incoming = [
      criarMensagem({
        id: "msg-1-db",
        messageId: "wamid-1",
        leadId: "lead-1",
        timestamp: 1_700_000_000,
        status: "READ",
        optimistic: false,
        text: "Ola mundo",
      }),
    ];

    expect(mergeWhatsappChatMessages(base, incoming)).toEqual([
      expect.objectContaining({
        id: "msg-1-db",
        messageId: "wamid-1",
        status: "READ",
        optimistic: false,
        text: "Ola mundo",
      }),
    ]);
  });

  it("cria separadores de data sem perder a ordem das mensagens", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-31T15:00:00.000Z"));

    const itens = criarItensListaMensagensWhatsapp([
      criarMensagem({
        id: "msg-1",
        messageId: "wamid-1",
        leadId: "lead-1",
        timestamp: Math.floor(new Date("2026-03-30T18:00:00.000Z").getTime() / 1000),
        text: "Mensagem ontem",
      }),
      criarMensagem({
        id: "msg-2",
        messageId: "wamid-2",
        leadId: "lead-1",
        timestamp: Math.floor(new Date("2026-03-31T10:00:00.000Z").getTime() / 1000),
        text: "Mensagem hoje",
      }),
    ]);

    expect(itens).toEqual([
      { type: "separator", key: "separator-2026-03-30", label: "Ontem" },
      { type: "message", key: "wamid-1", message: expect.objectContaining({ id: "msg-1" }) },
      { type: "separator", key: "separator-2026-03-31", label: "Hoje" },
      { type: "message", key: "wamid-2", message: expect.objectContaining({ id: "msg-2" }) },
    ]);
  });
});
