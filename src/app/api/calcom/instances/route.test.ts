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
    calComInstancia: {
      create: vi.fn(),
    },
  },
}));

import { POST } from "@/app/api/calcom/instances/route";
import { exigirSessao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";

describe("POST /api/calcom/instances", () => {
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

    vi.mocked(prisma.calComInstancia.create).mockResolvedValue({
      id: "inst-1",
      nome: "Agenda comercial",
      status: "active",
      profile_name: "Equipe Comercial",
      profile_email: "agenda@empresa.com",
      criado_em: new Date("2026-03-31T12:00:00.000Z"),
      atualizado_em: new Date("2026-03-31T12:00:00.000Z"),
    } as never);
  });

  it("cria a instancia quando a API key e valida no endpoint oficial /v2/me", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

        if (url === "https://api.cal.com/v2/me") {
          return new Response(JSON.stringify({
            status: "success",
            data: {
              name: "Equipe Comercial",
              email: "agenda@empresa.com",
            },
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response("Not found", { status: 404, statusText: "Not Found" });
      }),
    );

    const request = new Request("http://localhost/api/calcom/instances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: "Agenda comercial",
        api_key: "cal_live_1234567890",
      }),
    });

    const resposta = await POST(request as never);
    const json = await resposta.json();

    expect(resposta.status).toBe(201);
    expect(json.instancia).toMatchObject({
      id: "inst-1",
      nome: "Agenda comercial",
      profile_name: "Equipe Comercial",
      profile_email: "agenda@empresa.com",
    });
  });
});
