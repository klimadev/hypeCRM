import { createHmac } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/autenticacao", () => ({
  obterSessaoNaRequest: vi.fn().mockResolvedValue(null),
}));

import { GET as getOauthCallback } from "@/app/api/integracoes/instagram/oauth/callback/route";
import { POST as postDataDeletion } from "@/app/api/integracoes/instagram/webhook/data-deletion/route";
import { GET as getDataDeletionStatus } from "@/app/api/integracoes/instagram/webhook/data-deletion/status/[confirmationCode]/route";
import { POST as postDeauthorize } from "@/app/api/integracoes/instagram/webhook/deauthorize/route";

function codificarBase64Url(valor: string) {
  return Buffer.from(valor).toString("base64url");
}

function criarSignedRequest(payload: Record<string, unknown>, segredo = "meta-secret") {
  const payloadCodificado = codificarBase64Url(JSON.stringify({
    algorithm: "HMAC-SHA256",
    ...payload,
  }));

  const assinatura = createHmac("sha256", segredo)
    .update(payloadCodificado)
    .digest("base64url");

  return `${assinatura}.${payloadCodificado}`;
}

describe("callbacks publicos do Instagram", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retorna uma pagina de expiracao quando o callback chega sem state valido", async () => {
    const resposta = await getOauthCallback(new Request("https://app.hypecrm.com.br/api/integracoes/instagram/oauth/callback?code=abc123&state=empresa-1"));

    const html = await resposta.text();

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("Conexao expirada");
    expect(html).toContain("State OAuth invalido ou expirado");
  });

  it("registra no log os dados recebidos no callback OAuth", async () => {
    const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await getOauthCallback(new Request("https://app.hypecrm.com.br/api/integracoes/instagram/oauth/callback?code=abc123&state=empresa-1&error_description=Teste", {
      headers: {
        "user-agent": "Meta-Teste",
        "x-forwarded-for": "1.2.3.4",
      },
    }));

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      "[Instagram OAuth Callback]",
      expect.objectContaining({
        metodo: "GET",
        pathname: "/api/integracoes/instagram/oauth/callback",
        query: expect.objectContaining({
          code: "abc123",
          state: "empresa-1",
          error_description: "Teste",
        }),
        headers: expect.objectContaining({
          userAgent: "Meta-Teste",
          forwardedFor: "1.2.3.4",
        }),
      }),
    );
  });

  it("retorna 204 no callback de desautorizacao quando o signed_request e valido", async () => {
    process.env.META_APP_SECRET = "meta-secret";

    const resposta = await postDeauthorize(new Request("https://app.hypecrm.com.br/api/integracoes/instagram/webhook/deauthorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        signed_request: criarSignedRequest({ user_id: "ig-user-1" }),
      }),
    }));

    expect(resposta.status).toBe(204);
    expect(await resposta.text()).toBe("");
  });

  it("retorna 200 com confirmation_code e url no callback de exclusao de dados", async () => {
    process.env.META_APP_SECRET = "meta-secret";

    const resposta = await postDataDeletion(new Request("https://app.hypecrm.com.br/api/integracoes/instagram/webhook/data-deletion", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        signed_request: criarSignedRequest({ user_id: "ig-user-1" }),
      }),
    }));

    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(json).toEqual({
      confirmation_code: expect.any(String),
      url: expect.stringMatching(/^https:\/\/app\.hypecrm\.com\.br\/api\/integracoes\/instagram\/webhook\/data-deletion\/status\//),
    });
  });

  it("retorna 400 quando o signed_request da Meta e invalido", async () => {
    process.env.META_APP_SECRET = "meta-secret";

    const resposta = await postDataDeletion(new Request("https://app.hypecrm.com.br/api/integracoes/instagram/webhook/data-deletion", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        signed_request: "invalido",
      }),
    }));

    const json = await resposta.json();

    expect(resposta.status).toBe(400);
    expect(json).toEqual({ erro: "signed_request invalido." });
  });

  it("expoe uma pagina publica para acompanhar o status da exclusao", async () => {
    const resposta = await getDataDeletionStatus(new Request("https://app.hypecrm.com.br/api/integracoes/instagram/webhook/data-deletion/status/abc123"), {
      params: Promise.resolve({ confirmationCode: "abc123" }),
    });

    const html = await resposta.text();

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("abc123");
    expect(html).toContain("solicitacao de exclusao de dados");
  });
});
