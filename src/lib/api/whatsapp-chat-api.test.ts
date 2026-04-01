import { afterEach, describe, expect, it, vi } from "vitest";

import * as whatsappApi from "./whatsapp";
import * as validacoes from "../validacoes";

type SnapshotListener = (event: { data: string }) => void;

class EventSourceFake {
  static instances: EventSourceFake[] = [];

  readonly url: string;
  readonly listeners = new Map<string, Set<SnapshotListener>>();
  closed = false;

  constructor(url: string) {
    this.url = url;
    EventSourceFake.instances.push(this);
  }

  addEventListener(event: string, listener: SnapshotListener) {
    const atuais = this.listeners.get(event) ?? new Set<SnapshotListener>();
    atuais.add(listener);
    this.listeners.set(event, atuais);
  }

  removeEventListener(event: string, listener: SnapshotListener) {
    this.listeners.get(event)?.delete(listener);
  }

  close() {
    this.closed = true;
  }

  emit(event: string, data: unknown) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener({ data: JSON.stringify(data) });
    }
  }
}

describe("api/whatsapp chat realtime", () => {
  afterEach(() => {
    EventSourceFake.instances = [];
    vi.unstubAllGlobals();
  });

  it("assina snapshots de mensagens e fecha o stream no unsubscribe", () => {
    vi.stubGlobal("EventSource", EventSourceFake);

    const onSnapshot = vi.fn();
    const onError = vi.fn();
    const assinarMensagensWhatsapp = (
      whatsappApi as {
        assinarMensagensWhatsapp?: (
          leadId: string,
          callbacks: {
            onSnapshot: (snapshot: unknown) => void;
            onError?: () => void;
          },
        ) => () => void;
      }
    ).assinarMensagensWhatsapp;

    expect(assinarMensagensWhatsapp).toBeTypeOf("function");

    const unsubscribe = assinarMensagensWhatsapp!("lead-1", {
      onSnapshot,
      onError,
    });

    expect(EventSourceFake.instances).toHaveLength(1);
    expect(EventSourceFake.instances[0]?.url).toBe(
      "/api/whatsapp/chat/messages/stream?leadId=lead-1",
    );

    EventSourceFake.instances[0]?.emit("snapshot", {
      messages: [{ id: "msg-1" }],
      unreadCount: 2,
      connectionStatus: "online",
    });
    EventSourceFake.instances[0]?.emit("error", {});

    expect(onSnapshot).toHaveBeenCalledWith({
      messages: [{ id: "msg-1" }],
      unreadCount: 2,
      connectionStatus: "online",
    });
    expect(onError).toHaveBeenCalledTimes(1);

    unsubscribe();

    expect(EventSourceFake.instances[0]?.closed).toBe(true);
  });

  it("assina snapshots de conversas com filtros serializados na query", () => {
    vi.stubGlobal("EventSource", EventSourceFake);

    const onSnapshot = vi.fn();
    const assinarConversasWhatsapp = (
      whatsappApi as {
        assinarConversasWhatsapp?: (
          params: {
            busca?: string;
            naoLidas?: boolean;
            limite?: number;
          },
          callbacks: {
            onSnapshot: (snapshot: unknown) => void;
            onError?: () => void;
          },
        ) => () => void;
      }
    ).assinarConversasWhatsapp;

    expect(assinarConversasWhatsapp).toBeTypeOf("function");

    const unsubscribe = assinarConversasWhatsapp!(
      {
        busca: "Ana Maria",
        naoLidas: true,
        limite: 30,
      },
      { onSnapshot },
    );

    expect(EventSourceFake.instances).toHaveLength(1);
    expect(EventSourceFake.instances[0]?.url).toBe(
      "/api/whatsapp/chat/conversations/stream?busca=Ana+Maria&naoLidas=true&limite=30",
    );

    EventSourceFake.instances[0]?.emit("snapshot", {
      conversas: [{ leadId: "lead-1" }],
      cursor: null,
      temMais: false,
    });

    expect(onSnapshot).toHaveBeenCalledWith({
      conversas: [{ leadId: "lead-1" }],
      cursor: null,
      temMais: false,
    });

    unsubscribe();

    expect(EventSourceFake.instances[0]?.closed).toBe(true);
  });
});

describe("validacoes do chat standalone", () => {
  it("valida a query de conversas com busca, cursor, limite e filtro de nao lidas", () => {
    const esquemaWhatsappChatConversationsQuery = (
      validacoes as {
        esquemaWhatsappChatConversationsQuery?: {
          parse: (input: unknown) => unknown;
        };
      }
    ).esquemaWhatsappChatConversationsQuery;

    expect(esquemaWhatsappChatConversationsQuery).toBeDefined();
    expect(esquemaWhatsappChatConversationsQuery?.parse({
      busca: " Ana ",
      cursor: "lead-2",
      limite: "30",
      naoLidas: "true",
    })).toEqual({
      busca: "Ana",
      cursor: "lead-2",
      limite: 30,
      naoLidas: true,
    });
  });

  it("valida a query de contexto do chat por lead", () => {
    const esquemaWhatsappChatContextQuery = (
      validacoes as {
        esquemaWhatsappChatContextQuery?: {
          parse: (input: unknown) => unknown;
        };
      }
    ).esquemaWhatsappChatContextQuery;

    expect(esquemaWhatsappChatContextQuery).toBeDefined();
    expect(esquemaWhatsappChatContextQuery?.parse({ leadId: " lead-9 " })).toEqual({
      leadId: "lead-9",
    });
  });
});
