import { describe, expect, it } from "vitest";
import type { Pdv } from "../types";
import { abrirPainelPdv, fecharPainelPdv, resolverLojaSelecionada } from "./pdv-management-panel.utils";

const pdvsBase: Pdv[] = [
  { id: "pdv-1", nome: "Centro" },
  { id: "pdv-2", nome: "Zona Sul" },
];

describe("resolverLojaSelecionada", () => {
  it("retorna o pdv atualizado da lista quando o id existir", () => {
    const resultado = resolverLojaSelecionada(pdvsBase, "pdv-2");

    expect(resultado).toEqual({ id: "pdv-2", nome: "Zona Sul" });
  });

  it("retorna null quando o id nao existir mais", () => {
    expect(resolverLojaSelecionada(pdvsBase, "pdv-inexistente")).toBeNull();
  });
});

describe("estado do painel de pdvs", () => {
  it("abre o drawer com o id selecionado", () => {
    expect(abrirPainelPdv("pdv-1")).toEqual({
      drawerAberto: true,
      lojaSelecionadaId: "pdv-1",
    });
  });

  it("fecha o drawer e limpa a loja selecionada", () => {
    expect(fecharPainelPdv()).toEqual({
      drawerAberto: false,
      lojaSelecionadaId: null,
    });
  });
});
