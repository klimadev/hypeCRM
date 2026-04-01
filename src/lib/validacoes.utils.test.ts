import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  mensagemErroValidacao,
  normalizarBuscaFuncionarios,
  normalizarHorarioSchema,
} from "@/lib/validacoes.utils";

describe("normalizarHorarioSchema", () => {
  it("normaliza horario textual valido", () => {
    expect(normalizarHorarioSchema("9h5")).toBe("9h 5min");
  });

  it("retorna null para horario invalido", () => {
    expect(normalizarHorarioSchema("99 horas")).toBeNull();
  });
});

describe("normalizarBuscaFuncionarios", () => {
  it("normaliza busca para filtro interno", () => {
    expect(normalizarBuscaFuncionarios("  Maria SILVA ")).toBe("maria silva");
    expect(normalizarBuscaFuncionarios()).toBe("");
  });
});

describe("mensagemErroValidacao", () => {
  it("usa a primeira issue do zod", () => {
    const schema = z.object({ nome: z.string().min(2, "Nome invalido") });
    const resultado = schema.safeParse({ nome: "a" });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(mensagemErroValidacao(resultado.error)).toBe("Nome invalido");
    }
  });
});
