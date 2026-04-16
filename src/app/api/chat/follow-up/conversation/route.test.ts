import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  exigirSessaoMock,
  followUpConversaMock,
  followUpTemplateMock,
  whatsappInstanciaMock,
  leadMock,
  mensagemAgendadaMock,
  agendarProximoFollowUpMock,
} = vi.hoisted(() => ({
  exigirSessaoMock: vi.fn(),
  followUpConversaMock: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  followUpTemplateMock: { findFirst: vi.fn() },
  whatsappInstanciaMock: { findFirst: vi.fn() },
  leadMock: { findFirst: vi.fn() },
  mensagemAgendadaMock: { updateMany: vi.fn() },
  agendarProximoFollowUpMock: vi.fn(),
}));

vi.mock("@/lib/permissoes", () => ({ exigirSessao: exigirSessaoMock }));
vi.mock("@/lib/chat/follow-up", () => ({ agendarProximoFollowUp: agendarProximoFollowUpMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    followUpConversa: followUpConversaMock,
    followUpTemplate: followUpTemplateMock,
    whatsappInstancia: whatsappInstanciaMock,
    lead: leadMock,
    mensagemAgendada: mensagemAgendadaMock,
    $transaction: vi.fn(async (queries: Array<Promise<unknown>>) => Promise.all(queries)),
  },
}));

import { POST } from "@/app/api/chat/follow-up/conversation/route";

function request(payload: unknown) {
  return new NextRequest("http://localhost:3434/api/chat/follow-up/conversation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function mockSessao() {
  exigirSessaoMock.mockResolvedValue({
    erro: null,
    sessao: { id_empresa: "empresa-1", id_usuario: "u1", perfil: "GERENTE" },
  });
}

describe("follow-up conversation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ativa follow-up na conversa", async () => {
    mockSessao();
    whatsappInstanciaMock.findFirst.mockResolvedValue({ id: "inst-1" });
    followUpTemplateMock.findFirst.mockResolvedValue({ id: "tpl-1" });
    leadMock.findFirst.mockResolvedValue({ id: "lead-1" });
    followUpConversaMock.findFirst.mockResolvedValueOnce(null);
    followUpConversaMock.create.mockResolvedValue({
      id: "conv-1",
      status: "ATIVO",
      etapa_atual: 0,
      ciclo_atual: 1,
      proximo_disparo_em: null,
      ultima_saida_em: null,
      ultima_resposta_em: null,
      motivo_pausa: null,
      template: { id: "tpl-1", nome: "Cadencia", max_ciclos: 1, permite_repeticao: false },
    });
    followUpConversaMock.findUnique.mockResolvedValue({
      id: "conv-1",
      status: "ATIVO",
      etapa_atual: 1,
      ciclo_atual: 1,
      proximo_disparo_em: new Date("2026-01-01T10:00:00.000Z"),
      ultima_saida_em: null,
      ultima_resposta_em: null,
      motivo_pausa: null,
      template: { id: "tpl-1", nome: "Cadencia", max_ciclos: 1, permite_repeticao: false },
    });

    const response = await POST(request({
      instanceName: "inst",
      remoteJid: "551199999@c.us",
      idLead: "lead-1",
      templateId: "tpl-1",
    }));

    expect(response.status).toBe(201);
    expect(agendarProximoFollowUpMock).toHaveBeenCalledWith("conv-1");
  });

  it("ativa follow-up na conversa sem lead vinculado", async () => {
    mockSessao();
    whatsappInstanciaMock.findFirst.mockResolvedValue({ id: "inst-1" });
    followUpTemplateMock.findFirst.mockResolvedValue({ id: "tpl-1" });
    followUpConversaMock.findFirst.mockResolvedValueOnce(null);
    followUpConversaMock.create.mockResolvedValue({
      id: "conv-2",
      status: "ATIVO",
      etapa_atual: 0,
      ciclo_atual: 1,
      proximo_disparo_em: null,
      ultima_saida_em: null,
      ultima_resposta_em: null,
      motivo_pausa: null,
      template: { id: "tpl-1", nome: "Cadencia", max_ciclos: 1, permite_repeticao: false },
    });
    followUpConversaMock.findUnique.mockResolvedValue({
      id: "conv-2",
      status: "ATIVO",
      etapa_atual: 1,
      ciclo_atual: 1,
      proximo_disparo_em: new Date("2026-01-01T10:00:00.000Z"),
      ultima_saida_em: null,
      ultima_resposta_em: null,
      motivo_pausa: null,
      template: { id: "tpl-1", nome: "Cadencia", max_ciclos: 1, permite_repeticao: false },
    });

    const response = await POST(request({
      instanceName: "inst",
      remoteJid: "551199999@c.us",
      templateId: "tpl-1",
    }));

    expect(response.status).toBe(201);
    expect(leadMock.findFirst).not.toHaveBeenCalled();
    expect(followUpConversaMock.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        id_lead: null,
      }),
    }));
    expect(agendarProximoFollowUpMock).toHaveBeenCalledWith("conv-2");
  });
});
