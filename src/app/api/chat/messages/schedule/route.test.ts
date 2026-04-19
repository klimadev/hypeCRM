import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const {
  exigirSessaoMock,
  whatsappInstanciaFindFirstMock,
  mensagemAgendadaCreateMock,
} = vi.hoisted(() => ({
  exigirSessaoMock: vi.fn(),
  whatsappInstanciaFindFirstMock: vi.fn(),
  mensagemAgendadaCreateMock: vi.fn(),
}));

vi.mock("@/lib/permissoes", () => ({ exigirSessao: exigirSessaoMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    whatsappInstancia: { findFirst: whatsappInstanciaFindFirstMock },
    mensagemAgendada: { create: mensagemAgendadaCreateMock },
  },
}));

import { POST } from "@/app/api/chat/messages/schedule/route";

function mockSessao() {
  exigirSessaoMock.mockResolvedValue({
    erro: null,
    sessao: { id_empresa: "empresa-1", id_usuario: "u1", perfil: "GERENTE" },
  });
}

function criarRequest(formData: FormData) {
  return {
    headers: { get: () => "multipart/form-data" },
    formData: vi.fn(async () => formData),
    json: vi.fn(async () => ({})),
    method: "POST",
  } as unknown as NextRequest;
}

describe("schedule chat message route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessao();
    whatsappInstanciaFindFirstMock.mockResolvedValue({ id: "inst-1" });
    mensagemAgendadaCreateMock.mockResolvedValue({
      id: "msg-1",
      agendado_para: new Date("2026-12-01T10:00:00.000Z"),
      status: "PENDENTE",
    });
  });

  it("aceita midia em multipart e persiste metadados do arquivo", async () => {
    const formData = new FormData();
    formData.append("instanceName", "inst-1");
    formData.append("remoteJid", "5511999999999@c.us");
    formData.append("agendadoPara", "2026-12-01T10:00:00.000Z");
    formData.append("text", "Legenda agendada");
    formData.append("arquivo", new File(["abc"], "foto.png", { type: "image/png" }));

    const response = await POST(criarRequest(formData));

    expect(response.status).toBe(200);
    expect(mensagemAgendadaCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          instance_name: "inst-1",
          remote_jid: "5511999999999@c.us",
          conteudo: "Legenda agendada",
          tipo: "image",
          midia_nome_arquivo: "foto.png",
          midia_mimetype: "image/png",
        }),
      }),
    );
  });
});
