import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaTx = {
  lead: {
    update: vi.fn(),
  },
  leadEstagioLog: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/permissoes", () => ({
  exigirSessao: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lead: {
      findFirst: vi.fn(),
    },
    estagioFunil: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(((callback: unknown) => (callback as (tx: typeof prismaTx) => Promise<unknown>)(prismaTx)) as never),
  },
}));

vi.mock("@/lib/whatsapp-automations", () => ({
  executarAutomacoesLeadStageChanged: vi.fn().mockResolvedValue({}),
}));

import { PATCH } from "@/app/api/leads/[id]/mover/route";
import { exigirSessao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { executarAutomacoesLeadStageChanged } from "@/lib/whatsapp-automations";

function mockTransactionImplementation() {
  vi.mocked(prisma.$transaction).mockImplementation(
    ((callback: unknown) => (callback as (tx: typeof prismaTx) => Promise<unknown>)(prismaTx)) as never,
  );
}

describe("PATCH /api/leads/[id]/mover", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(exigirSessao).mockResolvedValue({
      erro: null,
      sessao: {
        id_usuario: "func-1",
        id_empresa: "emp-1",
        perfil: "GERENTE",
        id_pdv: "pdv-1",
      },
    });

    mockTransactionImplementation();
  });

  it("retorna erro quando id_estagio nao e enviado", async () => {
    const request = new Request("http://localhost/api/leads/lead-1/mover", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const resposta = await PATCH(request as never, { params: Promise.resolve({ id: "lead-1" }) });
    const json = await resposta.json();

    expect(resposta.status).toBe(400);
    expect(json.erro).toBe("Destino obrigatorio.");
  });

  it("retorna no-op quando lead ja esta no destino", async () => {
    vi.mocked(prisma.lead.findFirst).mockResolvedValue({
      id: "lead-1",
      nome: "Lead 1",
      telefone: "11999999999",
      email: "lead@example.com",
      empresa: { nome: "Empresa 1" },
      estagio: { id: "estagio-1", nome: "Novo", tipo: "ABERTO" },
      funcionario: { id_pdv: "pdv-1" },
    } as never);

    vi.mocked(prisma.estagioFunil.findFirst).mockResolvedValue({
      id: "estagio-1",
      nome: "Novo",
      tipo: "ABERTO",
    } as never);

    const request = new Request("http://localhost/api/leads/lead-1/mover", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_estagio: "estagio-1" }),
    });

    const resposta = await PATCH(request as never, { params: Promise.resolve({ id: "lead-1" }) });
    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(json.noop).toBe(true);
    expect(json.mensagem).toBe("Lead ja esta neste estagio.");
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(executarAutomacoesLeadStageChanged).not.toHaveBeenCalled();
  });

  it("move em transacao e dispara automacoes apos gravar o log", async () => {
    const dataLog = new Date("2026-03-23T10:00:00.000Z");

    vi.mocked(prisma.lead.findFirst).mockResolvedValue({
      id: "lead-1",
      nome: "Lead 1",
      telefone: "11999999999",
      email: "lead@example.com",
      empresa: { nome: "Empresa 1" },
      estagio: { id: "estagio-1", nome: "Novo", tipo: "ABERTO" },
      funcionario: { id_pdv: "pdv-1" },
    } as never);

    vi.mocked(prisma.estagioFunil.findFirst).mockResolvedValue({
      id: "estagio-2",
      nome: "Qualificado",
      tipo: "ABERTO",
    } as never);

    prismaTx.lead.update.mockResolvedValue({
      id: "lead-1",
      nome: "Lead 1",
      telefone: "11999999999",
      email: "lead@example.com",
      estagio: { id: "estagio-2", nome: "Qualificado", tipo: "ABERTO" },
    });

    prismaTx.leadEstagioLog.create.mockResolvedValue({
      id: "log-1",
      criado_em: dataLog,
    });

    const request = new Request("http://localhost/api/leads/lead-1/mover", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_estagio: "estagio-2" }),
    });

    const resposta = await PATCH(request as never, { params: Promise.resolve({ id: "lead-1" }) });
    const json = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(prismaTx.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lead-1" },
        data: expect.objectContaining({ id_estagio: "estagio-2" }),
      }),
    );
    expect(prismaTx.leadEstagioLog.create).toHaveBeenCalledWith({
      data: {
        id_lead: "lead-1",
        id_estagio_anterior: "estagio-1",
        id_estagio_novo: "estagio-2",
        empresa_id: "emp-1",
      },
    });
    expect(executarAutomacoesLeadStageChanged).toHaveBeenCalledWith({
      idEmpresa: "emp-1",
      leadEstagioLogId: "log-1",
      lead: {
        id: "lead-1",
        nome: "Lead 1",
        telefone: "11999999999",
        email: "lead@example.com",
      },
      estagioAnterior: {
        id: "estagio-1",
        nome: "Novo",
      },
      estagioAtual: {
        id: "estagio-2",
        nome: "Qualificado",
      },
      empresa: {
        nome: "Empresa 1",
      },
      disparadoEm: dataLog,
    });
    expect(json.lead).toEqual(
      expect.objectContaining({
        id: "lead-1",
        estagio: expect.objectContaining({ id: "estagio-2" }),
      }),
    );
  });
});
