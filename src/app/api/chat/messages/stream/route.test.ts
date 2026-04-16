import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  exigirSessaoMock,
  whereLeadsPorPerfilMock,
  buscarMensagensPorContatoMock,
  obterSnapshotCacheadoMock,
  criarRespostaSseMock,
  leadFindFirstMock,
} = vi.hoisted(() => ({
  exigirSessaoMock: vi.fn(),
  whereLeadsPorPerfilMock: vi.fn(),
  buscarMensagensPorContatoMock: vi.fn(),
  obterSnapshotCacheadoMock: vi.fn(),
  criarRespostaSseMock: vi.fn(),
  leadFindFirstMock: vi.fn(),
}));

vi.mock("@/lib/permissoes", () => ({
  exigirSessao: exigirSessaoMock,
  whereLeadsPorPerfil: whereLeadsPorPerfilMock,
}));

vi.mock("@/lib/evolution-api.chat", () => ({
  buscarMensagensPorContato: buscarMensagensPorContatoMock,
}));

vi.mock("@/lib/chat-snapshot-cache", () => ({
  obterSnapshotCacheado: obterSnapshotCacheadoMock,
}));

vi.mock("@/lib/whatsapp-chat-realtime.sse", () => ({
  criarRespostaSse: criarRespostaSseMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lead: {
      findFirst: leadFindFirstMock,
    },
  },
}));

import { GET } from "./route";

function mockSessao() {
  exigirSessaoMock.mockResolvedValue({
    erro: null,
    sessao: {
      id_empresa: "empresa-1",
      id_usuario: "usuario-1",
      perfil: "GERENTE",
    },
  });
  whereLeadsPorPerfilMock.mockResolvedValue({ id_empresa: "empresa-1" });
}

describe("chat messages stream route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();

    leadFindFirstMock.mockImplementation(async ({ where }: { where: { telefone?: { contains?: string } } }) => {
      if (where.telefone?.contains === "5511999999999") {
        return { id: "lead-1" };
      }

      return null;
    });

    obterSnapshotCacheadoMock.mockImplementation(async ({ loader }: { loader: () => Promise<unknown> }) => loader());
    criarRespostaSseMock.mockImplementation((params: { carregarSnapshot: () => Promise<unknown> }) => {
      void params;
      return new Response("stream-ok", { status: 200 });
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify([
        {
          key: {
            remoteJid: "1203630@lid",
            remoteJidAlt: "5511999999999@s.whatsapp.net",
          },
        },
      ]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ));
  });

  it("abre o stream de conversa @lid usando o jid resolvido", async () => {
    mockSessao();
    buscarMensagensPorContatoMock.mockResolvedValue({ messages: [{ id: "m1" }], hasMore: false });

    const response = await GET(new NextRequest(
      "http://localhost:3434/api/chat/messages/stream?instanceName=instancia-1&remoteJid=1203630@lid&limite=10",
    ));

    expect(response.status).toBe(200);
    expect(criarRespostaSseMock).toHaveBeenCalledTimes(1);

    const params = criarRespostaSseMock.mock.calls[0]?.[0] as { carregarSnapshot: () => Promise<unknown> };
    await params.carregarSnapshot();

    expect(buscarMensagensPorContatoMock).toHaveBeenCalledWith(
      "instancia-1",
      "5511999999999@s.whatsapp.net",
      1,
      10,
    );
  });
});
