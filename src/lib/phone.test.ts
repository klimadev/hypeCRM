import { describe, expect, it } from "vitest";

import { mascararTelefoneParaLog, normalizarTelefoneParaWhatsapp } from "@/lib/phone";

describe("mascararTelefoneParaLog", () => {
  it("retorna marcador de vazio quando não há dígitos", () => {
    // Arrange
    const input = "   ";

    // Act
    const result = mascararTelefoneParaLog(input);

    // Assert
    expect(result).toBe("(vazio)");
  });

  it("mascara números curtos com prefixo fixo", () => {
    // Arrange
    const input = "12-3";

    // Act
    const result = mascararTelefoneParaLog(input);

    // Assert
    expect(result).toBe("****123");
  });

  it("mantém prefixo e sufixo para números longos", () => {
    // Arrange
    const input = "+55 (11) 98765-4321";

    // Act
    const result = mascararTelefoneParaLog(input);

    // Assert
    expect(result).toBe("55****4321");
  });
});

describe("normalizarTelefoneParaWhatsapp", () => {
  it("normaliza celular BR local para padrão E.164 + waNumber", () => {
    // Arrange
    const input = "(11) 98765-4321";

    // Act
    const result = normalizarTelefoneParaWhatsapp(input);

    // Assert
    expect(result).toEqual({
      raw: "(11) 98765-4321",
      digits: "11987654321",
      e164: "+5511987654321",
      waNumber: "5511987654321",
      valido: true,
      motivoErro: null,
    });
  });

  it("retorna erro quando o valor é vazio", () => {
    // Arrange
    const input = "   ";

    // Act
    const result = normalizarTelefoneParaWhatsapp(input);

    // Assert
    expect(result).toEqual({
      raw: "",
      digits: "",
      e164: null,
      waNumber: null,
      valido: false,
      motivoErro: "Telefone vazio.",
    });
  });

  it("retorna erro quando não há dígitos numéricos", () => {
    // Arrange
    const input = "telefone";

    // Act
    const result = normalizarTelefoneParaWhatsapp(input);

    // Assert
    expect(result).toEqual({
      raw: "telefone",
      digits: "",
      e164: null,
      waNumber: null,
      valido: false,
      motivoErro: "Telefone sem digitos numericos.",
    });
  });

  it("retorna erro quando o número fica fora do padrão E.164", () => {
    // Arrange
    const input = "55113265432";

    // Act
    const result = normalizarTelefoneParaWhatsapp(input);

    // Assert
    expect(result).toEqual({
      raw: "55113265432",
      digits: "55113265432",
      e164: null,
      waNumber: null,
      valido: false,
      motivoErro: "Telefone fora do padrao E.164.",
    });
  });
});
