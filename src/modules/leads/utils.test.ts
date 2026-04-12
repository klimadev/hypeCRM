import { describe, expect, it } from "vitest";
import type { ApiLeadContato } from "@/lib/api/leads";
import {
  calcularResumoSelecaoDisparo,
  filtrarLeads,
  obterLeadsSelecionados,
} from "./utils";

function criarLead(id: string, nome: string): ApiLeadContato {
  return {
    id,
    id_estagio: "estagio-1",
    id_funcionario: "func-1",
    nome,
    telefone: "5511999999999",
    valor_oportunidade: 0,
    atualizado_em: "2026-01-01T00:00:00.000Z",
    id_pdv: null,
  };
}

describe("leads utils", () => {
  it("mantem selecionados fora do filtro atual", () => {
    const leads = [criarLead("l1", "Ana"), criarLead("l2", "Bruno")];
    const idsSelecionados = ["l1", "l2"];

    const leadsFiltrados = filtrarLeads({
      busca: "Ana",
      leads,
      estagiosPorId: new Map(),
      funcionariosPorId: new Map(),
      pdvsPorId: new Map(),
      negociosPorId: new Map(),
    });

    const selecionadosNoConjuntoCompleto = obterLeadsSelecionados(idsSelecionados, leads);
    const selecionadosNoFiltroAtual = obterLeadsSelecionados(idsSelecionados, leadsFiltrados);

    expect(leadsFiltrados.map((lead) => lead.id)).toEqual(["l1"]);
    expect(selecionadosNoFiltroAtual.map((lead) => lead.id)).toEqual(["l1"]);
    expect(selecionadosNoConjuntoCompleto.map((lead) => lead.id)).toEqual(["l1", "l2"]);
  });

  it("resume PDVs e sem-PDV na selecao completa", () => {
    const leads = [
      { ...criarLead("l1", "Ana"), id_pdv: "pdv-1" },
      { ...criarLead("l2", "Bruno"), id_pdv: null },
      { ...criarLead("l3", "Carla"), id_pdv: "pdv-2" },
    ];
    const idsSelecionados = ["l1", "l2", "l3"];

    const leadsFiltrados = filtrarLeads({
      busca: "Ana",
      leads,
      estagiosPorId: new Map(),
      funcionariosPorId: new Map(),
      pdvsPorId: new Map(),
      negociosPorId: new Map(),
    });

    const selecionadosNoConjuntoCompleto = obterLeadsSelecionados(idsSelecionados, leads);
    const selecionadosNoFiltroAtual = obterLeadsSelecionados(idsSelecionados, leadsFiltrados);

    const resumoCompleto = calcularResumoSelecaoDisparo(
      selecionadosNoConjuntoCompleto,
      new Map([
        ["pdv-1", "Loja Centro"],
        ["pdv-2", "Loja Norte"],
      ]),
    );
    const resumoFiltroAtual = calcularResumoSelecaoDisparo(
      selecionadosNoFiltroAtual,
      new Map([
        ["pdv-1", "Loja Centro"],
        ["pdv-2", "Loja Norte"],
      ]),
    );

    expect(resumoFiltroAtual.pdvsPresentesNaSelecao).toEqual([{ id: "pdv-1", nome: "Loja Centro" }]);
    expect(resumoFiltroAtual.semPdvSelecionados).toBe(0);

    expect(resumoCompleto.pdvsPresentesNaSelecao).toEqual([
      { id: "pdv-1", nome: "Loja Centro" },
      { id: "pdv-2", nome: "Loja Norte" },
    ]);
    expect(resumoCompleto.semPdvSelecionados).toBe(1);
  });
});
