import { describe, expect, it } from "vitest";
import type { WhatsappJobItem } from "../types";
import {
  contarJobsPorFiltro,
  filtrarJobsWhatsapp,
  formatarDataJobWhatsapp,
  getContextoLeadJob,
  truncateMensagemJob,
} from "./jobs-table.utils";

const jobsBase: WhatsappJobItem[] = [
  {
    id: "1",
    id_lead: "lead-1",
    id_etapa: "etapa-1",
    id_estagio_trigger: null,
    status: "PENDENTE",
    agendado_para: "2026-04-01T10:00:00.000Z",
    contexto_json: "{}",
    mensagem_template: "Mensagem 1",
    tentativas: 0,
    erro_ultimo: null,
    erro_codigo: null,
    erro_categoria: null,
    erro_detalhe: null,
    acao_recomendada: null,
    tentativas_max: 3,
    progress_pct: null,
    enviado_em: null,
    criado_em: "2026-04-01T09:00:00.000Z",
  },
  {
    id: "2",
    id_lead: "lead-2",
    id_etapa: "etapa-1",
    id_estagio_trigger: null,
    status: "FALHA",
    agendado_para: "2026-04-01T10:00:00.000Z",
    contexto_json: "{}",
    mensagem_template: "Mensagem 2",
    tentativas: 1,
    erro_ultimo: null,
    erro_codigo: null,
    erro_categoria: null,
    erro_detalhe: null,
    acao_recomendada: null,
    tentativas_max: 3,
    progress_pct: null,
    enviado_em: null,
    criado_em: "2026-04-01T09:00:00.000Z",
  },
  {
    id: "3",
    id_lead: "lead-3",
    id_etapa: "etapa-1",
    id_estagio_trigger: null,
    status: "ENVIADO",
    agendado_para: "2026-04-01T10:00:00.000Z",
    contexto_json: "{}",
    mensagem_template: "Mensagem 3",
    tentativas: 0,
    erro_ultimo: null,
    erro_codigo: null,
    erro_categoria: null,
    erro_detalhe: null,
    acao_recomendada: null,
    tentativas_max: 3,
    progress_pct: null,
    enviado_em: null,
    criado_em: "2026-04-01T09:00:00.000Z",
  },
];

describe("filtrarJobsWhatsapp", () => {
  it("filtra por status conhecido", () => {
    expect(filtrarJobsWhatsapp(jobsBase, "falhas")).toHaveLength(1);
    expect(filtrarJobsWhatsapp(jobsBase, "todos")).toHaveLength(3);
  });
});

describe("contarJobsPorFiltro", () => {
  it("retorna os totais por filtro", () => {
    expect(contarJobsPorFiltro(jobsBase)).toEqual({
      todos: 3,
      pendentes: 1,
      processando: 0,
      enviados: 1,
      falhas: 1,
    });
  });
});

describe("truncateMensagemJob", () => {
  it("trunca mensagens longas e preserva curtas", () => {
    expect(truncateMensagemJob("curta", 10)).toBe("curta");
    expect(truncateMensagemJob("mensagem muito longa", 8)).toBe("mensagem...");
  });
});

describe("getContextoLeadJob", () => {
  it("faz parse do contexto json e retorna null em caso invalido", () => {
    expect(getContextoLeadJob('{"lead_nome":"Maria"}')?.lead_nome).toBe("Maria");
    expect(getContextoLeadJob("{invalido")).toBeNull();
  });
});

describe("formatarDataJobWhatsapp", () => {
  it("gera uma string legivel", () => {
    expect(formatarDataJobWhatsapp("2026-04-01T10:00:00.000Z")).toMatch(/\d{2}:\d{2}/);
  });
});
