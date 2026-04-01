import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/permissoes", async () => {
  const atual = await vi.importActual<typeof import("@/lib/permissoes")>("@/lib/permissoes");
  return {
    ...atual,
    exigirSessao: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    instagramConta: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/integracoes/instagram/accounts/route";
import { exigirSessao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";

describe("GET /api/integracoes/instagram/accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(exigirSessao).mockResolvedValue({
      erro: null,
      sessao: {
        id_usuario: "user-1",
        id_empresa: "empresa-1",
        perfil: "EMPRESA",
      },
    });

    vi.mocked(prisma.instagramConta.findMany).mockResolvedValue([
      {
        id: "ig-1",
        nome: "Corretora Hype",
        instagram_user_id: "17841400000000000",
        username: "corretora.hype",
        account_type: "BUSINESS",
        profile_picture_url: "https://cdn.hypecrm.com.br/instagram.png",
        status: "active",
        criado_em: new Date("2026-04-01T12:00:00.000Z"),
        atualizado_em: new Date("2026-04-01T12:00:00.000Z"),
      },
    ] as never);
  });

  it("lista as contas conectadas sem expor o token salvo", async () => {
    const resposta = await GET(new Request("http://localhost/api/integracoes/instagram/accounts") as never);
    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(json.contas).toEqual([
      expect.objectContaining({
        id: "ig-1",
        nome: "Corretora Hype",
        username: "corretora.hype",
      }),
    ]);
    expect(JSON.stringify(json)).not.toContain("access_token");
  });
});
