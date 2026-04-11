import { describe, expect, it } from "vitest";

import {
  getDelayMinutos,
  getHorarioErrorMessage,
  isHorarioValido,
  normalizarHorario,
  parseHorarioTexto,
} from "@/lib/parse-horario-texto";

describe("parseHorarioTexto", () => {
  it("converte horas com sufixo de texto para minutos", () => {
    // Arrange
    const input = "9h após";

    // Act
    const result = parseHorarioTexto(input);

    // Assert
    expect(result).toEqual({
      ok: true,
      raw: "9h após",
      normalized: "9 horas",
      delay_minutos: 540,
    });
  });

  it("retorna erro para input vazio", () => {
    // Arrange
    const input = "   ";

    // Act
    const result = parseHorarioTexto(input);

    // Assert
    expect(result).toMatchObject({
      ok: false,
      code: "HORARIO_VAZIO",
    });
  });

  it("aceita minutos no formato min", () => {
    // Arrange
    const input = "30min";

    // Act
    const result = parseHorarioTexto(input);

    // Assert
    expect(result).toEqual({
      ok: true,
      raw: "30min",
      normalized: "30 minutos",
      delay_minutos: 30,
    });
  });

  it("rejeita minutos acima de 59", () => {
    // Arrange
    const input = "60min";

    // Act
    const result = parseHorarioTexto(input);

    // Assert
    expect(result).toMatchObject({
      ok: false,
      code: "HORARIO_MINUTO_INVALIDO",
    });
  });

  it("aceita formato horas e minutos com h e m", () => {
    // Arrange
    const input = "2h30m";

    // Act
    const result = parseHorarioTexto(input);

    // Assert
    expect(result).toEqual({
      ok: true,
      raw: "2h30m",
      normalized: "2h 30min",
      delay_minutos: 150,
    });
  });

  it("rejeita formato invalido", () => {
    // Arrange
    const input = "amanhã";

    // Act
    const result = parseHorarioTexto(input);

    // Assert
    expect(result).toMatchObject({
      ok: false,
      code: "HORARIO_FORMATO_INVALIDO",
    });
  });

  it("aceita sufixo after em inglês", () => {
    // Arrange
    const input = "1h after";

    // Act
    const result = parseHorarioTexto(input);

    // Assert
    expect(result).toEqual({
      ok: true,
      raw: "1h after",
      normalized: "1 hora",
      delay_minutos: 60,
    });
  });

  it("retorna erro para texto acima do limite", () => {
    // Arrange
    const input = "1234567890123456789012345678901";

    // Act
    const result = parseHorarioTexto(input);

    // Assert
    expect(result).toMatchObject({
      ok: false,
      code: "HORARIO_MUITO_LONGO",
    });
  });

  it("retorna erro HORARIO_ZERO quando recebe apenas 0", () => {
    // Arrange
    const input = "0";

    // Act
    const result = parseHorarioTexto(input);

    // Assert
    expect(result).toMatchObject({
      ok: false,
      code: "HORARIO_ZERO",
    });
  });
});

describe("helpers de horário", () => {
  it("isHorarioValido retorna true para entrada válida", () => {
    // Arrange
    const input = "1m";

    // Act
    const result = isHorarioValido(input);

    // Assert
    expect(result).toBe(true);
  });

  it("isHorarioValido retorna false para entrada inválida", () => {
    // Arrange
    const input = "99:99";

    // Act
    const result = isHorarioValido(input);

    // Assert
    expect(result).toBe(false);
  });

  it("getHorarioErrorMessage retorna null para entrada válida", () => {
    // Arrange
    const input = "2:30";

    // Act
    const result = getHorarioErrorMessage(input);

    // Assert
    expect(result).toBeNull();
  });

  it("getHorarioErrorMessage retorna mensagem para entrada inválida", () => {
    // Arrange
    const input = "";

    // Act
    const result = getHorarioErrorMessage(input);

    // Assert
    expect(result).toBe("Delay é obrigatório.");
  });

  it("normalizarHorario retorna texto normalizado para entrada válida", () => {
    // Arrange
    const input = "2:00";

    // Act
    const result = normalizarHorario(input);

    // Assert
    expect(result).toBe("2h");
  });

  it("normalizarHorario retorna null para entrada inválida", () => {
    // Arrange
    const input = "foo";

    // Act
    const result = normalizarHorario(input);

    // Assert
    expect(result).toBeNull();
  });

  it("getDelayMinutos retorna número para entrada válida", () => {
    // Arrange
    const input = "45min";

    // Act
    const result = getDelayMinutos(input);

    // Assert
    expect(result).toBe(45);
  });

  it("getDelayMinutos retorna null para entrada inválida", () => {
    // Arrange
    const input = "0";

    // Act
    const result = getDelayMinutos(input);

    // Assert
    expect(result).toBeNull();
  });
});
