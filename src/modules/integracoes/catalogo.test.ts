import { describe, expect, it } from "vitest";
import { listarIntegracoesDisponiveis, podeAcessarIntegracoes } from "./catalogo";

describe("catalogo de integracoes", () => {
  it("libera o acesso apenas para perfis de gestao", () => {
    expect(podeAcessarIntegracoes("EMPRESA")).toBe(true);
    expect(podeAcessarIntegracoes("GERENTE")).toBe(true);
    expect(podeAcessarIntegracoes("COLABORADOR")).toBe(false);
  });

  it("expoe o card do Cal.com com rota dedicada", () => {
    expect(listarIntegracoesDisponiveis()).toEqual([
      expect.objectContaining({
        slug: "calcom",
        nome: "Cal.com",
        href: "/integracoes/calcom",
        categoria: "Agenda",
        statusLabel: "Disponivel agora",
      }),
    ]);
  });
});
