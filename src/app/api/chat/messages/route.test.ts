import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/permissoes", () => ({
  exigirSessao: vi.fn(),
}));

vi.mock("@/lib/evolution-api.instances", () => ({
  enviarMensagemTexto: vi.fn(),
}));

vi.mock("@/lib/evolution-api.chat", () => ({
  buscarMensagensPorContato: vi.fn(),
}));

vi.mock("@/lib/integracoes/instagram-inbox", () => ({
  listarMensagensInstagramPorEmpresa: vi.fn(),
  enviarMensagemInstagram: vi.fn(),
}));

import { GET, POST } from "@/app/api/chat/messages/route";
import { exigirSessao } from "@/lib/permissoes";
import { enviarMensagemTexto } from "@/lib/evolution-api.instances";
import { buscarMensagensPorContato } from "@/lib/evolution-api.chat";
import { listarMensagensInstagramPorEmpresa, enviarMensagemInstagram } from "@/lib/integracoes/instagram-inbox";

describe("/api/chat/messages", () => {
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
  });

  it("rejeita payload invalido no POST", async () => {
    const request = new Request("http://localhost/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceName: "inst-1", remoteJid: "5511999999999@s.whatsapp.net" }),
    });

    const resposta = await POST(request as never);
    const json = await resposta.json();

    expect(resposta.status).toBe(400);
    expect(json.erro).toBeDefined();
  });

  it("carrega mensagens no GET com instanceName e remoteJid", async () => {
    vi.mocked(buscarMensagensPorContato).mockResolvedValue({ messages: [{ id: "m1" }] as never, hasMore: false } as never);

    const request = new Request(
      "http://localhost/api/chat/messages?instanceName=inst-1&remoteJid=5511999999999@s.whatsapp.net&limite=25",
      { method: "GET" },
    );

    const resposta = await GET(request as never);
    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(buscarMensagensPorContato).toHaveBeenCalledWith("inst-1", "5511999999999@s.whatsapp.net", 1, 25);
    expect(json.messages).toHaveLength(1);
  });

  it("carrega mensagens do Instagram preservando fromMe", async () => {
    vi.mocked(listarMensagensInstagramPorEmpresa).mockResolvedValue([
      {
        id: "ig-1",
        from_id: "user-1",
        from_name: "Conta",
        from_username: "conta",
        from_me: true,
        text: "resposta",
        created_at: "2026-04-04T20:00:00.000Z",
        attachments: [],
      },
    ]);

    const request = new Request(
      "http://localhost/api/chat/messages?instanceName=instagram&remoteJid=conv-1&limite=25",
      { method: "GET" },
    );

    const resposta = await GET(request as never);
    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(listarMensagensInstagramPorEmpresa).toHaveBeenCalledWith("emp-1", "conv-1", 25);
    expect(json.messages[0]?.fromMe).toBe(true);
  });

  it("envia mensagem de texto no POST", async () => {
    vi.mocked(enviarMensagemTexto).mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instanceName: "inst-1",
        remoteJid: "5511999999999@s.whatsapp.net",
        text: "Olá chat",
      }),
    });

    const resposta = await POST(request as never);
    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(enviarMensagemTexto).toHaveBeenCalledWith({
      instanceName: "inst-1",
      telefone: "5511999999999",
      mensagem: "Olá chat",
    });
    expect(json.ok).toBe(true);
  });

  it("envia mensagem no Instagram no POST", async () => {
    vi.mocked(enviarMensagemInstagram).mockResolvedValue({
      success: true,
      message_id: "ig-msg-1",
      recipient_id: "dest-1",
    });

    const request = new Request("http://localhost/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instanceName: "instagram",
        remoteJid: "dest-1",
        text: "Ola Instagram",
      }),
    });

    const resposta = await POST(request as never);
    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(enviarMensagemInstagram).toHaveBeenCalledWith("emp-1", "dest-1", "Ola Instagram");
    expect(json.messageId).toBe("ig-msg-1");
  });
});
