import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  exigirSessaoMock,
  whereLeadsPorPerfilMock,
  enviarMensagemTextoMock,
  buscarMensagensPorContatoMock,
  leadFindFirstMock,
} = vi.hoisted(() => ({
  exigirSessaoMock: vi.fn(),
  whereLeadsPorPerfilMock: vi.fn(),
  enviarMensagemTextoMock: vi.fn(),
  buscarMensagensPorContatoMock: vi.fn(),
  leadFindFirstMock: vi.fn(),
}));

vi.mock("@/lib/permissoes", () => ({
  exigirSessao: exigirSessaoMock,
  whereLeadsPorPerfil: whereLeadsPorPerfilMock,
}));

vi.mock("@/lib/evolution-api.instances", () => ({
  enviarMensagemTexto: enviarMensagemTextoMock,
}));

vi.mock("@/lib/evolution-api.chat", () => ({
  buscarMensagensPorContato: buscarMensagensPorContatoMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lead: {
      findFirst: leadFindFirstMock,
    },
  },
}));

import { GET, POST } from "./route";

function mockSessao() {
  exigirSessaoMock.mockResolvedValue({
    erro: null,
    sessao: {
      id_empresa: "empresa-1",
      id_usuario: "usuario-1",
      perfil: "EMPRESA",
    },
  });
  whereLeadsPorPerfilMock.mockResolvedValue({ id_empresa: "empresa-1" });
}

function mockLeadPorTelefone(telefoneEsperado: string) {
  leadFindFirstMock.mockImplementation(async ({ where }: { where: { telefone?: { contains?: string } } }) => {
    if (where.telefone?.contains === telefoneEsperado) {
      return { id: "lead-1" };
    }

    return null;
  });
}

describe("chat messages route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("carrega mensagens de conversa @lid usando o jid resolvido e preserva a pagina solicitada", async () => {
    mockSessao();
    mockLeadPorTelefone("1203630");
    buscarMensagensPorContatoMock.mockResolvedValue({ messages: [{ id: "m1" }], hasMore: true });

    const response = await GET(new NextRequest(
      "http://localhost:3434/api/chat/messages?instanceName=instancia-1&remoteJid=1203630@lid&limite=25&page=3",
    ));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ messages: [{ id: "m1" }], hasMore: true });
    expect(leadFindFirstMock).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        telefone: { contains: "1203630" },
      }),
    }));
    expect(buscarMensagensPorContatoMock).toHaveBeenCalledWith(
      "instancia-1",
      "1203630@s.whatsapp.net",
      3,
      25,
    );
  });

  it("envia mensagem de conversa @lid usando o telefone resolvido", async () => {
    mockSessao();
    mockLeadPorTelefone("1203630");
    enviarMensagemTextoMock.mockResolvedValue(undefined);

    const response = await POST(new NextRequest("http://localhost:3434/api/chat/messages", {
      method: "POST",
      body: JSON.stringify({
        instanceName: "instancia-1",
        remoteJid: "1203630@lid",
        text: "Oi",
      }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(enviarMensagemTextoMock).toHaveBeenCalledWith({
      instanceName: "instancia-1",
      telefone: "1203630",
      mensagem: "Oi",
    });
  });
});
