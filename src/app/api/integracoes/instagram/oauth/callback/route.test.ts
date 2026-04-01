import { SignJWT } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/autenticacao", () => ({
  obterSessaoNaRequest: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    instagramConta: {
      upsert: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/integracoes/instagram/oauth/callback/route";
import { obterSessaoNaRequest } from "@/lib/autenticacao";
import { prisma } from "@/lib/prisma";

async function criarStateOAuth() {
  const segredo = new TextEncoder().encode("segredo-teste-instagram");

  return new SignJWT({
    id_empresa: "empresa-1",
    id_usuario: "user-1",
    perfil: "EMPRESA",
    nonce: "nonce-1",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(segredo);
}

describe("GET /api/integracoes/instagram/oauth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "segredo-teste-instagram";
    process.env.INSTAGRAM_APP_ID = "1471383481007483";
    process.env.INSTAGRAM_APP_SECRET = "instagram-secret";
    process.env.INSTAGRAM_REDIRECT_URI = "https://app.hypecrm.com.br/api/integracoes/instagram/oauth/callback";

    vi.mocked(obterSessaoNaRequest).mockResolvedValue({
      id_empresa: "empresa-1",
      id_usuario: "user-1",
      perfil: "EMPRESA",
    });

    vi.mocked(prisma.instagramConta.upsert).mockResolvedValue({
      id: "ig-1",
      nome: "Corretora Hype",
      instagram_user_id: "17841400000000000",
      username: "corretora.hype",
      account_type: "BUSINESS",
      profile_picture_url: "https://cdn.hypecrm.com.br/instagram.png",
      status: "active",
      criado_em: new Date("2026-04-01T12:00:00.000Z"),
      atualizado_em: new Date("2026-04-01T12:00:00.000Z"),
    } as never);
  });

  it("troca o code, salva a conta conectada e limpa o state cookie", async () => {
    const state = await criarStateOAuth();

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      if (url === "https://api.instagram.com/oauth/access_token") {
        return new Response(JSON.stringify({
          access_token: "short-lived-token",
          user_id: 17841400000000000,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.startsWith("https://graph.instagram.com/access_token")) {
        return new Response(JSON.stringify({
          access_token: "long-lived-token",
          token_type: "bearer",
          expires_in: 5183944,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.startsWith("https://graph.instagram.com/v24.0/me")) {
        return new Response(JSON.stringify({
          user_id: "17841400000000000",
          username: "corretora.hype",
          name: "Corretora Hype",
          account_type: "BUSINESS",
          profile_picture_url: "https://cdn.hypecrm.com.br/instagram.png",
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not-found", { status: 404 });
    }));

    const resposta = await GET(new Request(`https://app.hypecrm.com.br/api/integracoes/instagram/oauth/callback?code=oauth-code-1&state=${encodeURIComponent(state)}`, {
      headers: {
        Cookie: `hype_sessao=fake; hype_instagram_oauth_state=${state}`,
      },
    }));

    const html = await resposta.text();

    expect(resposta.status).toBe(200);
    expect(html).toContain("Conta conectada");
    expect(html).toContain("corretora.hype");
    expect(prisma.instagramConta.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id_empresa_instagram_user_id: {
          id_empresa: "empresa-1",
          instagram_user_id: "17841400000000000",
        },
      },
    }));
    expect(resposta.headers.get("set-cookie")).toContain("hype_instagram_oauth_state=");
  });
});
