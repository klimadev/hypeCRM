import { describe, expect, it } from "vitest";
import {
  acumularResultadoResumo,
  criarResumoBackfill,
  normalizarStatusNegocioBackfill,
  parseArgsBackfill,
  serializarResumoBackfill,
  tituloNegocioInicialBackfill,
  validarVerificacoesBackfill,
} from "./backfill-leads-para-negocios.utils";

describe("parseArgsBackfill", () => {
  it("interpreta flags suportadas", () => {
    expect(
      parseArgsBackfill([
        "--dry-run",
        "--empresa-id=emp-1",
        "--lead-id=lead-1",
        "--resume-after=abc",
        "--batch-size=250",
      ]),
    ).toEqual({
      dryRun: true,
      empresaId: "emp-1",
      leadId: "lead-1",
      resumeAfter: "abc",
      batchSize: 250,
    });
  });
});

describe("normalizarStatusNegocioBackfill", () => {
  it("mapeia tipo de estagio para status de negocio", () => {
    expect(normalizarStatusNegocioBackfill("GANHO")).toBe("GANHO");
    expect(normalizarStatusNegocioBackfill("PERDIDO")).toBe("PERDIDO");
    expect(normalizarStatusNegocioBackfill("QUALQUER_OUTRO")).toBe("ABERTO");
  });
});

describe("tituloNegocioInicialBackfill", () => {
  it("prioriza o primeiro produto legado", () => {
    expect(
      tituloNegocioInicialBackfill({
        nome: "Maria",
        LeadProduto: [{ nome_snapshot: "Seguro Vida" }],
      }),
    ).toBe("Seguro Vida");
  });

  it("gera fallback com nome do lead", () => {
    expect(tituloNegocioInicialBackfill({ nome: "Maria", LeadProduto: [] })).toBe("Negocio inicial - Maria");
    expect(tituloNegocioInicialBackfill({ nome: "", LeadProduto: [] })).toBe("Negocio inicial");
  });
});

describe("resumoBackfill", () => {
  it("acumula totais por lead", () => {
    const resumo = criarResumoBackfill();
    acumularResultadoResumo(resumo, {
      criado: true,
      parcelasAtualizadas: 2,
      produtosCopiados: 3,
      logsCopiados: 4,
      jobsAtualizados: 5,
    });

    expect(resumo).toMatchObject({
      negocios_criados: 1,
      parcelas_atualizadas: 2,
      produtos_copiados: 3,
      logs_copiados: 4,
      jobs_atualizados: 5,
    });
    expect(serializarResumoBackfill(resumo)).toContain('"negocios_criados": 1');
  });
});

describe("validarVerificacoesBackfill", () => {
  it("lanca erro quando existem divergencias", () => {
    expect(() =>
      validarVerificacoesBackfill({
        totalLeads: 10,
        totalLeadsComNegocio: 9,
        parcelasOrfas: 0,
        logsLegadosSemNegocio: 0,
      }),
    ).toThrow("Total de leads diverge");
  });

  it("aceita verificacoes consistentes", () => {
    expect(() =>
      validarVerificacoesBackfill({
        totalLeads: 10,
        totalLeadsComNegocio: 10,
        parcelasOrfas: 0,
        logsLegadosSemNegocio: 0,
      }),
    ).not.toThrow();
  });
});
