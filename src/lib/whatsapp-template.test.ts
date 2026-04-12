import { describe, expect, it } from "vitest";
import { criarContextoPreviewWhatsapp, renderizarTemplateWhatsapp } from "@/lib/whatsapp-template";

describe("renderizarTemplateWhatsapp", () => {
  it("substitui variaveis conhecidas e normaliza chaves com hifen", () => {
    // Arrange
    const template = "Olá {{ lead-nome }}, canal {{canal}}.";
    const contexto = criarContextoPreviewWhatsapp({ lead_nome: "Ana", canal: "instagram" });

    // Act
    const resultado = renderizarTemplateWhatsapp(template, contexto);

    // Assert
    expect(resultado).toBe("Olá Ana, canal instagram.");
  });

  it("mantem placeholder desconhecido e aplica fallback vazio para variavel conhecida ausente", () => {
    // Arrange
    const template = "{{lead_nome}} {{variavel_inexistente}} {{nome_pdv}}";
    const contexto = { lead_nome: "Carlos", nome_pdv: "" };

    // Act
    const resultado = renderizarTemplateWhatsapp(template, contexto);

    // Assert
    expect(resultado).toBe("Carlos {{variavel_inexistente}} ");
  });
});

describe("criarContextoPreviewWhatsapp", () => {
  it("retorna defaults quando partial nao informado", () => {
    // Arrange
    const partial = undefined;

    // Act
    const contexto = criarContextoPreviewWhatsapp(partial);

    // Assert
    expect(contexto.lead_nome).toBe("Joao da Silva");
    expect(contexto.canal).toBe("whatsapp");
  });

  it("sobrescreve defaults com valores de partial", () => {
    // Arrange
    const partial = { lead_nome: "Beatriz", nome_funcionario: "Pedro" };

    // Act
    const contexto = criarContextoPreviewWhatsapp(partial);

    // Assert
    expect(contexto.lead_nome).toBe("Beatriz");
    expect(contexto.nome_funcionario).toBe("Pedro");
  });
});
