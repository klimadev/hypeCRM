import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    automacao: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/automacoes/agendamentos", () => ({
  buscarJobComRelacoes: vi.fn(),
  cancelarAgendamentosDaAutomacao: vi.fn(),
  cancelarAgendamentosIncompativeisDoLead: vi.fn(),
  prepararAgendamento: vi.fn(),
}));

vi.mock("@/lib/automacoes/dispatch-whatsapp", () => ({
  processarJob: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import {
  buscarJobComRelacoes,
  cancelarAgendamentosIncompativeisDoLead,
  prepararAgendamento,
} from "@/lib/automacoes/agendamentos";
import { processarJob } from "@/lib/automacoes/dispatch-whatsapp";
import { executarAutomacoesLeadStageChanged, gerarReferenciaEventoAcao } from "@/lib/whatsapp-automations";

describe("whatsapp-automations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispara imediatamente acoes sem delay e agenda apenas as compativeis com o estagio", async () => {
    vi.mocked(cancelarAgendamentosIncompativeisDoLead).mockResolvedValue(2);
    vi.mocked(prisma.automacao.findMany).mockResolvedValue([
      {
        id: "auto-1",
        nome: "Boas-vindas",
        id_empresa: "emp-1",
        config_json: JSON.stringify({ id_estagio_destino: "estagio-2" }),
        ativo: true,
        fonte: "WHATSAPP",
        gatilho: "STAGE_CHANGE",
        acoes: [
          {
            id: "acao-1",
            ordem: 0,
            tipo: "WHATSAPP_MSG",
            delay_minutos: 0,
            instancia_whatsapp: { id: "inst-1", instance_name: "wa-centro" },
          },
          {
            id: "acao-2",
            ordem: 1,
            tipo: "WHATSAPP_MSG",
            delay_minutos: 15,
            instancia_whatsapp: { id: "inst-1", instance_name: "wa-centro" },
          },
        ],
      },
      {
        id: "auto-2",
        nome: "Outro estágio",
        id_empresa: "emp-1",
        config_json: JSON.stringify({ id_estagio_destino: "estagio-3" }),
        ativo: true,
        fonte: "WHATSAPP",
        gatilho: "STAGE_CHANGE",
        acoes: [
          {
            id: "acao-3",
            ordem: 0,
            tipo: "WHATSAPP_MSG",
            delay_minutos: 0,
            instancia_whatsapp: { id: "inst-1", instance_name: "wa-centro" },
          },
        ],
      },
    ] as never);

    vi.mocked(prepararAgendamento)
      .mockResolvedValueOnce({ agendamentoId: "ag-1", acao: "criado" })
      .mockResolvedValueOnce({ agendamentoId: "ag-2", acao: "criado" });
    vi.mocked(buscarJobComRelacoes).mockResolvedValue({ id: "ag-1" } as never);
    vi.mocked(processarJob).mockResolvedValue({ status: "ENVIADO" });

    const resultado = await executarAutomacoesLeadStageChanged({
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
      disparadoEm: new Date("2026-03-23T10:00:00.000Z"),
    });

    expect(cancelarAgendamentosIncompativeisDoLead).toHaveBeenCalledWith({
      idEmpresa: "emp-1",
      idLead: "lead-1",
      idEstagioAtual: "estagio-2",
      motivo: "Lead saiu do estagio alvo da automacao.",
    });
    expect(prepararAgendamento).toHaveBeenCalledTimes(2);
    expect(prepararAgendamento).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        idAutomacao: "auto-1",
        idLead: "lead-1",
        referenciaUid: gerarReferenciaEventoAcao("log-1", "auto-1", "acao-1"),
        delayMinutos: 0,
        contextoJson: expect.objectContaining({
          acao: expect.objectContaining({ id: "acao-1" }),
          estagio: expect.objectContaining({ atual_nome: "Qualificado" }),
        }),
      }),
    );
    expect(buscarJobComRelacoes).toHaveBeenCalledTimes(1);
    expect(buscarJobComRelacoes).toHaveBeenCalledWith("ag-1");
    expect(processarJob).toHaveBeenCalledTimes(1);
    expect(resultado).toEqual({
      automacoesCorrespondentes: 1,
      jobsCriados: 2,
      jobsAtualizados: 0,
      jobsCancelados: 2,
      jobsProcessados: 1,
      jobsIgnorados: 0,
    });
  });

  it("preserva idempotencia quando o job do evento ja foi enviado", async () => {
    vi.mocked(cancelarAgendamentosIncompativeisDoLead).mockResolvedValue(0);
    vi.mocked(prisma.automacao.findMany).mockResolvedValue([
      {
        id: "auto-1",
        nome: "Boas-vindas",
        id_empresa: "emp-1",
        config_json: JSON.stringify({ id_estagio_destino: "estagio-2" }),
        ativo: true,
        fonte: "WHATSAPP",
        gatilho: "STAGE_CHANGE",
        acoes: [
          {
            id: "acao-1",
            ordem: 0,
            tipo: "WHATSAPP_MSG",
            delay_minutos: 0,
            instancia_whatsapp: { id: "inst-1", instance_name: "wa-centro" },
          },
        ],
      },
    ] as never);
    vi.mocked(prepararAgendamento).mockResolvedValue({
      agendamentoId: "ag-1",
      acao: "ja_enviado",
    });

    const resultado = await executarAutomacoesLeadStageChanged({
      idEmpresa: "emp-1",
      leadEstagioLogId: "log-1",
      lead: {
        id: "lead-1",
        nome: "Lead 1",
        telefone: "11999999999",
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
    });

    expect(buscarJobComRelacoes).not.toHaveBeenCalled();
    expect(processarJob).not.toHaveBeenCalled();
    expect(resultado.jobsIgnorados).toBe(1);
    expect(resultado.jobsProcessados).toBe(0);
  });
});
