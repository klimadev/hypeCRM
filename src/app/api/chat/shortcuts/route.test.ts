import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { exigirSessaoMock, randomUUIDMock, mensagemAtalhoMock } = vi.hoisted(() => ({
  exigirSessaoMock: vi.fn(),
  randomUUIDMock: vi.fn(() => "atalho-id-1"),
  mensagemAtalhoMock: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("crypto", () => ({
  randomUUID: randomUUIDMock,
}));

vi.mock("@/lib/permissoes", () => ({
  exigirSessao: exigirSessaoMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mensagemAtalho: mensagemAtalhoMock,
  },
}));

import { GET, POST } from "@/app/api/chat/shortcuts/route";

function criarRequest(url: string, payload?: unknown): NextRequest {
  return new NextRequest(url, payload ? { method: "POST", body: JSON.stringify(payload) } : undefined);
}

function mockSessao(perfil: "EMPRESA" | "GERENTE" | "COLABORADOR" = "GERENTE") {
  exigirSessaoMock.mockResolvedValue({
    erro: null,
    sessao: {
      id_empresa: "empresa-1",
      id_usuario: "usuario-1",
      perfil,
    },
  });
}

describe("GET /api/chat/shortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna atalhos da empresa e filtra apenas ativos para colaborador", async () => {
    // Arrange
    mockSessao("COLABORADOR");
    mensagemAtalhoMock.findMany.mockResolvedValue([
      {
        id: "a1",
        nome: "Boas vindas",
        slug: "boas",
        conteudo: "Olá",
        tags_json: '["novo","vip"]',
        ativo: true,
        criado_em: new Date("2026-01-01T00:00:00.000Z"),
        atualizado_em: new Date("2026-01-02T00:00:00.000Z"),
      },
    ]);

    const request = criarRequest("http://localhost:3434/api/chat/shortcuts");

    // Act
    const response = await GET(request);
    const body = (await response.json()) as { atalhos: Array<{ slug: string; tags: string[] }> };

    // Assert
    expect(response.status).toBe(200);
    expect(mensagemAtalhoMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id_empresa: "empresa-1", ativo: true }),
      }),
    );
    expect(body.atalhos).toEqual([
      expect.objectContaining({
        slug: "boas",
        tags: ["novo", "vip"],
      }),
    ]);
  });

  it("retorna erro de autenticacao quando exigirSessao falha", async () => {
    // Arrange
    exigirSessaoMock.mockResolvedValue({
      erro: NextResponse.json({ erro: "Nao autenticado." }, { status: 401 }),
    });
    const request = criarRequest("http://localhost:3434/api/chat/shortcuts");

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ erro: "Nao autenticado." });
  });
});

describe("POST /api/chat/shortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria atalho com slug e tags normalizados", async () => {
    // Arrange
    mockSessao("GERENTE");
    mensagemAtalhoMock.findFirst.mockResolvedValue(null);
    mensagemAtalhoMock.create.mockResolvedValue({
      id: "atalho-id-1",
      nome: "Cobrança",
      slug: "cobranca-rapida",
      conteudo: "Mensagem {{lead_nome}}",
      tags_json: '["vip","financeiro"]',
      ativo: true,
      criado_em: new Date("2026-01-01T00:00:00.000Z"),
      atualizado_em: new Date("2026-01-01T00:00:00.000Z"),
    });

    const request = criarRequest("http://localhost:3434/api/chat/shortcuts", {
      nome: "Cobrança",
      slug: "cobranca-rapida",
      conteudo: "Mensagem {{lead_nome}}",
      tags: [" VIP ", "financeiro", "vip"],
      ativo: true,
    });

    // Act
    const response = await POST(request);
    const body = (await response.json()) as { atalho: { slug: string; tags: string[] } };

    // Assert
    expect(response.status).toBe(201);
    expect(randomUUIDMock).toHaveBeenCalled();
    expect(mensagemAtalhoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: "atalho-id-1",
          slug: "cobranca-rapida",
          tags_json: JSON.stringify(["vip", "financeiro"]),
        }),
      }),
    );
    expect(body.atalho.slug).toBe("cobranca-rapida");
    expect(body.atalho.tags).toEqual(["vip", "financeiro"]);
  });

  it("retorna 400 quando payload e invalido", async () => {
    // Arrange
    mockSessao("GERENTE");
    const request = criarRequest("http://localhost:3434/api/chat/shortcuts", {
      nome: "a",
      slug: "A",
      conteudo: "",
      tags: [],
    });

    // Act
    const response = await POST(request);
    const body = (await response.json()) as { erro: string };

    // Assert
    expect(response.status).toBe(400);
    expect(typeof body.erro).toBe("string");
    expect(body.erro.length).toBeGreaterThan(0);
    expect(mensagemAtalhoMock.findFirst).not.toHaveBeenCalled();
  });

  it("retorna 409 quando slug ja existe", async () => {
    // Arrange
    mockSessao("EMPRESA");
    mensagemAtalhoMock.findFirst.mockResolvedValue({ id: "existente" });
    const request = criarRequest("http://localhost:3434/api/chat/shortcuts", {
      nome: "Cobrança",
      slug: "cobranca",
      conteudo: "Mensagem",
      tags: [],
      ativo: true,
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ erro: "Ja existe um atalho com esse nome." });
    expect(mensagemAtalhoMock.create).not.toHaveBeenCalled();
  });

  it("retorna 403 para colaborador sem permissao", async () => {
    // Arrange
    mockSessao("COLABORADOR");
    const request = criarRequest("http://localhost:3434/api/chat/shortcuts", {
      nome: "Cobrança",
      slug: "cobranca",
      conteudo: "Mensagem",
      tags: [],
      ativo: true,
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ erro: "Sem permissao para criar atalhos." });
    expect(mensagemAtalhoMock.findFirst).not.toHaveBeenCalled();
  });
});
