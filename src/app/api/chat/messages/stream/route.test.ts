import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/permissoes", () => ({
  exigirSessao: vi.fn(),
}));

vi.mock("@/lib/whatsapp-chat-realtime.sse", () => ({
  criarRespostaSse: vi.fn(),
}));

vi.mock("@/lib/evolution-api.chat", () => ({
  buscarMensagensPorContato: vi.fn(),
}));

vi.mock("@/lib/integracoes/instagram-inbox", () => ({
  listarMensagensInstagramPorEmpresa: vi.fn(),
}));

import { GET } from "@/app/api/chat/messages/stream/route";
import { buscarMensagensPorContato } from "@/lib/evolution-api.chat";
import { listarMensagensInstagramPorEmpresa } from "@/lib/integracoes/instagram-inbox";
import { exigirSessao } from "@/lib/permissoes";
import { criarRespostaSse } from "@/lib/whatsapp-chat-realtime.sse";

describe("/api/chat/messages/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exigirSessao).mockResolvedValue({
      erro: null,
      sessao: {
        id_empresa: "emp-1",
        id_usuario: "usu-1",
        perfil: "EMPRESA",
      },
    });
    vi.mocked(criarRespostaSse).mockResolvedValue(new Response("ok"));
  });

  it("usa o provider do Instagram no stream", async () => {
    vi.mocked(listarMensagensInstagramPorEmpresa).mockResolvedValue([
      {
        id: "ig-1",
        from_id: "usr-1",
        from_name: "Contato",
        from_username: "contato",
        from_me: false,
        text: "Oi",
        created_at: "2026-04-04T20:00:00.000Z",
        attachments: [],
      },
    ]);

    await GET(new Request("http://localhost/api/chat/messages/stream?instanceName=instagram&remoteJid=conv-1&limite=10") as never);

    const chamada = vi.mocked(criarRespostaSse).mock.calls[0]?.[0];
    expect(chamada).toBeDefined();

    const snapshot = await chamada?.carregarSnapshot();
    expect(listarMensagensInstagramPorEmpresa).toHaveBeenCalledWith("emp-1", "conv-1", 10);
    expect(buscarMensagensPorContato).not.toHaveBeenCalled();
    expect(snapshot?.messages[0]?.fromMe).toBe(false);
  });

  it("mantem provider do WhatsApp para outras instancias", async () => {
    vi.mocked(buscarMensagensPorContato).mockResolvedValue({
      messages: [{ id: "wa-1" }],
      hasMore: false,
    } as never);

    await GET(new Request("http://localhost/api/chat/messages/stream?instanceName=inst-1&remoteJid=5511999999999@s.whatsapp.net&limite=15") as never);

    const chamada = vi.mocked(criarRespostaSse).mock.calls[0]?.[0];
    const snapshot = await chamada?.carregarSnapshot();

    expect(buscarMensagensPorContato).toHaveBeenCalledWith("inst-1", "5511999999999@s.whatsapp.net", 1, 15);
    expect(listarMensagensInstagramPorEmpresa).not.toHaveBeenCalled();
    expect(snapshot?.messages).toHaveLength(1);
  });
});
