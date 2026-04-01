import { describe, expect, it } from "vitest";
import { listarIntegracoesDisponiveis, podeAcessarIntegracoes } from "./catalogo";

describe("catalogo de integracoes", () => {
  it("libera o acesso apenas para perfis de gestao", () => {
    expect(podeAcessarIntegracoes("EMPRESA")).toBe(true);
    expect(podeAcessarIntegracoes("GERENTE")).toBe(true);
    expect(podeAcessarIntegracoes("COLABORADOR")).toBe(false);
  });

  it("expoe o card do Cal.com com rota dedicada", () => {
    expect(listarIntegracoesDisponiveis()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        slug: "calcom",
        nome: "Cal.com",
        tituloCurto: "Agendamentos e reunioes",
        resumoCurto: "Use para conectar sua agenda ao CRM.",
        href: "/integracoes/calcom",
        categoria: "Agenda",
        statusLabel: "Disponivel agora",
        acaoLabel: "Abrir integracao",
      }),
    ]));
  });

  it("expoe o card do Instagram como integracao disponivel", () => {
    expect(listarIntegracoesDisponiveis()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        slug: "instagram",
        nome: "Instagram",
        categoria: "Social",
        statusLabel: "Disponivel agora",
        acaoLabel: "Abrir integracao",
        href: "/integracoes/instagram",
        disponibilidade: "disponivel",
      }),
    ]));
  });
});
