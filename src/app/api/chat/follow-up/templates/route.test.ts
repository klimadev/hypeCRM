import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { exigirSessaoMock, randomUUIDMock, followUpTemplateMock, followUpConversaMock, followUpTemplateEtapaMock } = vi.hoisted(() => ({
  exigirSessaoMock: vi.fn(),
  randomUUIDMock: vi.fn(() => "template-id-1"),
  followUpTemplateMock: {
    findMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  followUpConversaMock: {
    findFirst: vi.fn(),
  },
  followUpTemplateEtapaMock: {
    deleteMany: vi.fn(),
  },
}));

vi.mock("crypto", () => ({ randomUUID: randomUUIDMock }));
vi.mock("@/lib/permissoes", () => ({ exigirSessao: exigirSessaoMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    followUpTemplate: followUpTemplateMock,
    followUpConversa: followUpConversaMock,
    followUpTemplateEtapa: followUpTemplateEtapaMock,
  },
}));

import { GET, POST } from "@/app/api/chat/follow-up/templates/route";

function criarRequest(url: string, payload?: unknown): NextRequest {
  return new NextRequest(url, payload ? { method: "POST", body: JSON.stringify(payload) } : undefined);
}

function mockSessao(perfil: "EMPRESA" | "GERENTE" | "COLABORADOR" = "GERENTE") {
  exigirSessaoMock.mockResolvedValue({
    erro: null,
    sessao: { id_empresa: "empresa-1", id_usuario: "user-1", perfil },
  });
}

describe("follow-up templates route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista templates da empresa", async () => {
    mockSessao("GERENTE");
    followUpTemplateMock.findMany.mockResolvedValue([]);

    const response = await GET(criarRequest("http://localhost:3434/api/chat/follow-up/templates"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.templates).toEqual([]);
    expect(followUpTemplateMock.findMany).toHaveBeenCalled();
  });

  it("cria template com etapa unica", async () => {
    mockSessao("EMPRESA");
    followUpTemplateMock.create.mockResolvedValue({
      id: "template-id-1",
      nome: "Cobrar retorno",
      descricao: null,
      canal: "whatsapp",
      ativo: true,
      permite_repeticao: false,
      max_ciclos: 1,
      pausar_se_responder: true,
      criado_em: new Date("2026-01-01T00:00:00.000Z"),
      atualizado_em: new Date("2026-01-01T00:00:00.000Z"),
      etapas: [{ id: "e1", ordem: 1, delay_minutos: 60, conteudo: "Oi", ativo: true }],
    });

    const response = await POST(
      criarRequest("http://localhost:3434/api/chat/follow-up/templates", {
        nome: "Cobrar retorno",
        canal: "whatsapp",
        ativo: true,
        permiteRepeticao: false,
        maxCiclos: 1,
        pausarSeResponder: true,
        etapas: [{ ordem: 1, delayMinutos: 60, conteudo: "Oi", ativo: true }],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.template.id).toBe("template-id-1");
    expect(followUpTemplateMock.create).toHaveBeenCalled();
  });

  it("nega criacao para colaborador", async () => {
    mockSessao("COLABORADOR");
    const response = await POST(
      criarRequest("http://localhost:3434/api/chat/follow-up/templates", {
        nome: "x",
        etapas: [{ ordem: 1, delayMinutos: 60, conteudo: "Oi", ativo: true }],
      }),
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ erro: "Sem permissao para criar cadencias." });
  });
});
