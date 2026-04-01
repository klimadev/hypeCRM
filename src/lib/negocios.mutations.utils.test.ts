import { describe, expect, it } from "vitest";
import {
  coletarIdsLeadsVinculadosNegocio,
  construirCamposAtualizacaoNegocio,
  definirStatusNegocioPorTipoEstagio,
} from "@/lib/negocios.mutations.utils";

describe("definirStatusNegocioPorTipoEstagio", () => {
  it("mapeia o tipo do estagio para status do negocio", () => {
    expect(definirStatusNegocioPorTipoEstagio("GANHO")).toBe("GANHO");
    expect(definirStatusNegocioPorTipoEstagio("PERDIDO")).toBe("PERDIDO");
    expect(definirStatusNegocioPorTipoEstagio("ABERTO")).toBe("ABERTO");
  });
});

describe("coletarIdsLeadsVinculadosNegocio", () => {
  it("deduplica lead principal e vinculados", () => {
    expect(
      coletarIdsLeadsVinculadosNegocio({
        id: "neg-1",
        titulo: "Negocio",
        status: "ABERTO",
        valor_estimado: 100,
        valor_fechado: null,
        probabilidade: null,
        motivo_perda: null,
        observacoes_comerciais: null,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        data_fechamento: null,
        data_abertura: new Date().toISOString(),
        id_empresa: "emp-1",
        id_funil: "fun-1",
        id_estagio: "est-1",
        id_funcionario: "func-1",
        lead_principal: { id: "lead-1", nome: "Maria", telefone: "11999999999" },
        leads: [
          { id: "lead-1", nome: "Maria", telefone: "11999999999" },
          { id: "lead-2", nome: "Joao", telefone: "11888888888" },
        ],
        funil: { id: "fun-1", nome: "Principal", slug: "principal", padrao: true },
        estagio: { id: "est-1", nome: "Novo", ordem: 1, tipo: "ABERTO", id_funil: "fun-1" },
        funcionario: { id: "func-1", nome: "Ana" },
      }),
    ).toEqual(["lead-1", "lead-2"]);
  });
});

describe("construirCamposAtualizacaoNegocio", () => {
  it("normaliza strings opcionais antes de montar o update", () => {
    const campos = construirCamposAtualizacaoNegocio({
      titulo: "  Novo titulo  ",
      motivoPerda: "  sem fit  ",
      observacoesComerciais: "  observacao  ",
    });

    expect(campos.titulo).toBe("Novo titulo");
    expect(campos.motivo_perda).toBe("sem fit");
    expect(campos.observacoes_comerciais).toBe("observacao");
    expect(campos).toHaveProperty("atualizado_em");
  });
});
