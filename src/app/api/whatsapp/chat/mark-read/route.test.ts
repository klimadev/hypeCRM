import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  exigirSessaoMock,
  buscarConnectionStatusMock,
  buscarMensagensPorContatoMock,
  marcarMensagensComoLidasEvolutionMock,
} = vi.hoisted(() => ({
  exigirSessaoMock: vi.fn(),
  buscarConnectionStatusMock: vi.fn(),
  buscarMensagensPorContatoMock: vi.fn(),
  marcarMensagensComoLidasEvolutionMock: vi.fn(),
}));

vi.mock("@/lib/permissoes", () => ({
  exigirSessao: exigirSessaoMock,
}));

vi.mock("@/lib/whatsapp-chat.evolution", () => ({
  buscarConnectionStatus: buscarConnectionStatusMock,
  marcarMensagensComoLidasEvolution: marcarMensagensComoLidasEvolutionMock,
}));

vi.mock("@/lib/evolution-api.chat", () => ({
  buscarMensagensPorContato: buscarMensagensPorContatoMock,
}));

import { POST } from "./route";

describe("whatsapp chat mark-read route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exigirSessaoMock.mockResolvedValue({
      erro: null,
      sessao: {
        id_empresa: "empresa-1",
        id_usuario: "usuario-1",
        perfil: "EMPRESA",
      },
    });
    buscarConnectionStatusMock.mockResolvedValue("online");
  });

  it("marca mensagens remotas inbound da conversa atual sem depender do banco local", async () => {
    buscarMensagensPorContatoMock.mockResolvedValue({
      messages: [
        {
          id: "out-1",
          remoteJid: "157862277959928@lid",
          remoteJidAlt: null,
          fromMe: true,
          text: "oi",
          kind: "conversation",
          timestamp: 3,
          timestampIso: "1970-01-01T00:00:03.000Z",
          pushName: null,
          status: "SENT",
          hasMedia: false,
          mediaUrl: null,
        },
        {
          id: "in-1",
          remoteJid: "157862277959928@lid",
          remoteJidAlt: null,
          fromMe: false,
          text: "oi",
          kind: "conversation",
          timestamp: 2,
          timestampIso: "1970-01-01T00:00:02.000Z",
          pushName: "Contato",
          status: "DELIVERED",
          hasMedia: false,
          mediaUrl: null,
        },
        {
          id: "in-2",
          remoteJid: "157862277959928@lid",
          remoteJidAlt: null,
          fromMe: false,
          text: "tudo bem?",
          kind: "conversation",
          timestamp: 1,
          timestampIso: "1970-01-01T00:00:01.000Z",
          pushName: "Contato",
          status: "DELIVERED",
          hasMedia: false,
          mediaUrl: null,
        },
      ],
      hasMore: false,
    });

    const response = await POST(new NextRequest("http://localhost:3434/api/whatsapp/chat/mark-read", {
      method: "POST",
      body: JSON.stringify({
        instanceName: "instancia-1",
        remoteJid: "157862277959928@lid",
      }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, marked: 2 });
    expect(buscarConnectionStatusMock).toHaveBeenCalledWith("instancia-1");
    expect(buscarMensagensPorContatoMock).toHaveBeenCalledWith("instancia-1", "157862277959928@lid", 1, 100);
    expect(marcarMensagensComoLidasEvolutionMock).toHaveBeenCalledWith("instancia-1", [
      { remoteJid: "157862277959928@lid", id: "in-1" },
      { remoteJid: "157862277959928@lid", id: "in-2" },
    ]);
  });
});
