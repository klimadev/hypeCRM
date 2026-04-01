import { describe, expect, it } from "vitest";
import {
  criarPendenciasPorNegocio,
  criarResumoPendencias,
  detectarNovasPendenciasNaoNotificadas,
  getGravidadePendencia,
} from "./use-pendencias-globais.utils";
import type { PendenciaInfo } from "./use-pendencias-globais";

const pendencias: PendenciaInfo[] = [
  {
    id: "1",
    id_lead: "lead-1",
    tipo: "DOCUMENTO_APROVACAO_PENDENTE",
    descricao: "Doc pendente",
    resolvida: false,
  },
  {
    id: "2",
    id_lead: "lead-1",
    tipo: "SEM_RESPOSTA",
    descricao: "Sem resposta",
    resolvida: false,
  },
];

describe("getGravidadePendencia", () => {
  it("classifica gravidade por tipo", () => {
    expect(getGravidadePendencia("DOCUMENTO_APROVACAO_PENDENTE")).toBe("critica");
    expect(getGravidadePendencia("ESTAGIO_PARADO")).toBe("alerta");
    expect(getGravidadePendencia("SEM_RESPOSTA")).toBe("info");
  });
});

describe("detectarNovasPendenciasNaoNotificadas", () => {
  it("retorna apenas pendencias novas nao resolvidas", () => {
    expect(
      detectarNovasPendenciasNaoNotificadas(
        [pendencias[0]],
        pendencias,
        new Set<string>(),
      ).map((item) => item.id),
    ).toEqual(["2"]);
  });
});

describe("criarResumoPendencias", () => {
  it("agrega totais por tipo e gravidade", () => {
    const resumo = criarResumoPendencias(pendencias);

    expect(resumo.total).toBe(2);
    expect(resumo.totalNegocios).toBe(1);
    expect(resumo.porTipo.DOCUMENTO_APROVACAO_PENDENTE).toBe(1);
    expect(resumo.porGravidade.critica).toBe(1);
  });
});

describe("criarPendenciasPorNegocio", () => {
  it("monta mapa por lead com gravidade maxima", () => {
    expect(criarPendenciasPorNegocio(pendencias)["lead-1"]).toMatchObject({
      total: 2,
      naoResolvidas: 2,
      gravidadeMaxima: "critica",
    });
  });
});
