import { appendFile, mkdir } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  appendFile: vi.fn(),
  mkdir: vi.fn(),
}));

vi.mock("crypto", async () => {
  const actual = await vi.importActual<typeof import("crypto")>("crypto");

  return {
    ...actual,
    randomUUID: vi.fn(() => "req_test_123"),
  };
});

import { GET, POST } from "@/app/webhook/route";

describe("POST /webhook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.META_WEBHOOK_VERIFY_TOKEN;
    delete process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    vi.mocked(appendFile).mockResolvedValue(undefined);
    vi.mocked(mkdir).mockResolvedValue(undefined);
  });

  it("usa o token hardcoded como fallback quando nao ha env configurada", async () => {
    const resposta = await GET(new Request("http://localhost/webhook?hub.mode=subscribe&hub.verify_token=hype&hub.challenge=abc123", {
      method: "GET",
      headers: {
        Accept: "text/plain",
      },
    }));

    const texto = await resposta.text();

    expect(resposta.status).toBe(200);
    expect(texto).toBe("abc123");
    expect(mkdir).not.toHaveBeenCalled();
    expect(appendFile).not.toHaveBeenCalled();
  });

  it("responde o hub.challenge da Meta quando o verify token confere", async () => {
    process.env.META_WEBHOOK_VERIFY_TOKEN = "token-meta-correto";

    const resposta = await GET(new Request("http://localhost/webhook?hub.mode=subscribe&hub.verify_token=token-meta-correto&hub.challenge=abc123", {
      method: "GET",
      headers: {
        Accept: "text/plain",
      },
    }));

    const texto = await resposta.text();

    expect(resposta.status).toBe(200);
    expect(texto).toBe("abc123");
    expect(mkdir).not.toHaveBeenCalled();
    expect(appendFile).not.toHaveBeenCalled();
  });

  it("rejeita a validacao da Meta quando o verify token diverge", async () => {
    process.env.META_WEBHOOK_VERIFY_TOKEN = "token-meta-correto";

    const resposta = await GET(new Request("http://localhost/webhook?hub.mode=subscribe&hub.verify_token=token-incorreto&hub.challenge=abc123", {
      method: "GET",
    }));

    const json = await resposta.json();

    expect(resposta.status).toBe(403);
    expect(json).toEqual({ erro: "Token de verificacao do webhook invalido." });
    expect(mkdir).not.toHaveBeenCalled();
    expect(appendFile).not.toHaveBeenCalled();
  });

  it("loga tudo o que recebeu de forma organizada no POST", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const resposta = await POST(new Request("http://localhost/webhook?fonte=ai&modo=estudo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer segredo-super-sensivel",
        "User-Agent": "WebhookTester/1.0",
        "X-Forwarded-For": "203.0.113.10, 10.0.0.1",
        "X-Webhook-Token": "token-secreto",
      },
      body: JSON.stringify({
        evento: "chat.completion",
        dados: {
          id: "evt_123",
          modelo: "gpt-5.4",
        },
      }),
    }));

    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(json).toEqual(expect.objectContaining({
      ok: true,
      mensagem: "Webhook recebido e registrado para analise detalhada.",
      resumo: expect.objectContaining({
        metodo: "POST",
        requestId: "req_test_123",
        url: "http://localhost/webhook?fonte=ai&modo=estudo",
        rota: "/webhook",
        tipoConteudo: "application/json",
        tipoBody: "json",
        bodyEhJsonValido: true,
        totalQueryParams: 2,
      }),
    }));

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(mkdir).toHaveBeenCalledTimes(1);
    expect(appendFile).toHaveBeenCalledTimes(1);

    const log = infoSpy.mock.calls[0]?.[0];
    const persistencia = vi.mocked(appendFile).mock.calls[0];

    expect(log).toContain('"url": "http://localhost/webhook?fonte=ai&modo=estudo"');
    expect(log).toContain('"requestId": "req_test_123"');
    expect(log).toContain('"ip": "203.0.113.10"');
    expect(log).toContain('"userAgent": "WebhookTester/1.0"');
    expect(log).toContain('"rota": "/webhook"');
    expect(log).toContain('"fonte": "ai"');
    expect(log).toContain('"evento": "chat.completion"');
    expect(log).toContain('"raw": "{');
    expect(log).toContain('"authorization": "[oculto]"');
    expect(log).toContain('"x-webhook-token": "[oculto]"');
    expect(persistencia?.[0]).toContain("webhook-events.log");
    expect(String(persistencia?.[1])).toContain('"requestId":"req_test_123"');
  });

  it("loga body invalido sem quebrar e ainda responde 200", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const resposta = await POST(new Request("http://localhost/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": "198.51.100.7, 10.0.0.1",
      },
      body: "{",
    }));

    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(json).toEqual(expect.objectContaining({
      ok: true,
      resumo: expect.objectContaining({
        metodo: "POST",
        requestId: "req_test_123",
        tipoBody: "json-invalido",
        bodyEhJsonValido: false,
      }),
    }));
    expect(infoSpy).toHaveBeenCalledTimes(1);

    const log = infoSpy.mock.calls[0]?.[0];
    expect(log).toContain('"tipo": "json-invalido"');
    expect(log).toContain('"raw": "{"');
    expect(log).toContain('"ip": "198.51.100.7"');
  });

  it("loga requisicoes sem body em outros metodos", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const resposta = await GET(new Request("http://localhost/webhook?health=1", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }));

    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(json).toEqual(expect.objectContaining({
      ok: true,
      resumo: expect.objectContaining({
        metodo: "GET",
        requestId: "req_test_123",
        tipoBody: "sem-body",
        totalQueryParams: 1,
      }),
    }));
    expect(infoSpy).toHaveBeenCalledTimes(1);

    const log = infoSpy.mock.calls[0]?.[0];
    expect(log).toContain('"metodo": "GET"');
    expect(log).toContain('"health": "1"');
  });
});
