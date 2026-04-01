import { describe, expect, it } from "vitest";
import { obterItemIntegracoesNavegacao, podeExibirIntegracoesNaNavegacao } from "./navegacao";

describe("navegacao de integracoes", () => {
  it("exibe integracoes apenas para perfis de gestao", () => {
    expect(podeExibirIntegracoesNaNavegacao("EMPRESA")).toBe(true);
    expect(podeExibirIntegracoesNaNavegacao("GERENTE")).toBe(true);
    expect(podeExibirIntegracoesNaNavegacao("COLABORADOR")).toBe(false);
  });

  it("retorna o item padrao de menu para a nova area", () => {
    expect(obterItemIntegracoesNavegacao()).toEqual({
      href: "/integracoes",
      label: "Integrações",
      descricao: "Conexões e agenda externa",
    });
  });
});
