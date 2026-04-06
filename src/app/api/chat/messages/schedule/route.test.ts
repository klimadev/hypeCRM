import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/permissoes", () => ({
  exigirSessao: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mensagemAgendada: {
      create: vi.fn(),
    },
  },
}));

import { POST } from "@/app/api/chat/messages/schedule/route";
import { exigirSessao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";

describe("POST /api/chat/messages/schedule", () => {
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

  it("agenda a mensagem com os dados esperados", async () => {
    const agendadoPara = "2026-04-10T15:30:00.000Z";

    vi.mocked(prisma.mensagemAgendada.create).mockResolvedValue({
      id: "ag-1",
      agendado_para: new Date(agendadoPara),
      status: "PENDENTE",
    } as never);

    const request = new Request("http://localhost/api/chat/messages/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instanceName: "inst-1",
        remoteJid: "5511999999999@s.whatsapp.net",
        text: "Mensagem futura",
        agendadoPara,
      }),
    });

    const resposta = await POST(request as never);
    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(prisma.mensagemAgendada.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id_empresa: "emp-1",
        criado_por: "usu-1",
        instance_name: "inst-1",
        remote_jid: "5511999999999@s.whatsapp.net",
        conteudo: "Mensagem futura",
        agendado_para: new Date(agendadoPara),
        status: "PENDENTE",
      }),
    });
    expect(json).toEqual({
      ok: true,
      mensagem: {
        id: "ag-1",
        agendadoPara,
        status: "PENDENTE",
      },
    });
  });

  it("retorna erro controlado quando a persistencia falha", async () => {
    vi.mocked(prisma.mensagemAgendada.create).mockRejectedValue(new Error("no such table: MensagemAgendada"));

    const request = new Request("http://localhost/api/chat/messages/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instanceName: "inst-1",
        remoteJid: "5511999999999@s.whatsapp.net",
        text: "Mensagem futura",
        agendadoPara: "2026-04-10T15:30:00.000Z",
      }),
    });

    const resposta = await POST(request as never);
    const json = await resposta.json();

    expect(resposta.status).toBe(500);
    expect(json.erro).toBe("Nao foi possivel salvar o agendamento.");
  });
});
