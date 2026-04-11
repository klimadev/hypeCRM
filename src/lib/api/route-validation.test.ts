import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { parseJson, validateBody, validateQuery } from "@/lib/api/route-validation";

describe("parseJson", () => {
  it("retorna payload quando request.json resolve", async () => {
    // Arrange
    const request = {
      json: vi.fn().mockResolvedValue({ nome: "Maria" }),
    } as never;

    // Act
    const resultado = await parseJson<{ nome: string }>(request);

    // Assert
    expect(resultado).toEqual({ ok: true, data: { nome: "Maria" } });
  });

  it("retorna badRequest quando request.json falha", async () => {
    // Arrange
    const request = {
      json: vi.fn().mockRejectedValue(new Error("invalid json")),
    } as never;

    // Act
    const resultado = await parseJson<{ nome: string }>(request);

    // Assert
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.response.status).toBe(400);
      await expect(resultado.response.json()).resolves.toEqual({ erro: "JSON invalido." });
    }
  });
});

describe("validateBody", () => {
  it("retorna dados validados quando schema e valido", () => {
    // Arrange
    const schema = z.object({ nome: z.string().min(1) });
    const payload = { nome: "Maria" };

    // Act
    const resultado = validateBody(schema, payload);

    // Assert
    expect(resultado).toEqual({ ok: true, data: { nome: "Maria" } });
  });

  it("retorna badRequest quando schema e invalido", async () => {
    // Arrange
    const schema = z.object({ nome: z.string().min(1) });
    const payload = { nome: "" };

    // Act
    const resultado = validateBody(schema, payload);

    // Assert
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.response.status).toBe(400);
      const body = (await resultado.response.json()) as { erro: string };
      expect(typeof body.erro).toBe("string");
      expect(body.erro.length).toBeGreaterThan(0);
    }
  });
});

describe("validateQuery", () => {
  it("retorna query validada quando schema e valido", () => {
    // Arrange
    const schema = z.object({ pagina: z.coerce.number().int().min(1) });
    const payload = { pagina: "2" };

    // Act
    const resultado = validateQuery(schema, payload);

    // Assert
    expect(resultado).toEqual({ ok: true, data: { pagina: 2 } });
  });

  it("retorna fallback quando query e invalida", async () => {
    // Arrange
    const schema = z.object({ pagina: z.coerce.number().int().min(1) });
    const payload = { pagina: "0" };

    // Act
    const resultado = validateQuery(schema, payload, "Consulta inválida.");

    // Assert
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.response.status).toBe(400);
      await expect(resultado.response.json()).resolves.toEqual({ erro: "Consulta inválida." });
    }
  });
});
