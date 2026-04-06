import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/permissoes", () => ({
  exigirSessao: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mensagemAgendada: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/chat/messages/scheduled/route";
import { exigirSessao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";

describe("GET /api/chat/messages/scheduled", () => {
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

  it("serializa a data agendada com nome camelCase para a UI", async () => {
    vi.mocked(prisma.mensagemAgendada.findMany).mockResolvedValue([
      {
        id: "ag-1",
        conteudo: "Mensagem futura",
        agendado_para: new Date("2026-04-05T17:19:00.000Z"),
        status: "PENDENTE",
        erro: null,
        tentativas: 0,
        criado_em: new Date("2026-04-05T16:00:00.000Z"),
      },
    ] as never);

    const request = new Request("http://localhost/api/chat/messages/scheduled?instanceName=inst-1&remoteJid=5511999999999@s.whatsapp.net");

    const resposta = await GET(request as never);
    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(json).toEqual({
      agendadas: [
        {
          id: "ag-1",
          conteudo: "Mensagem futura",
          agendadoPara: "2026-04-05T17:19:00.000Z",
          status: "PENDENTE",
          erro: null,
          tentativas: 0,
          criadoEm: "2026-04-05T16:00:00.000Z",
        },
      ],
    });
  });
});
