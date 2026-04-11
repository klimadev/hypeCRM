import { afterEach, describe, expect, it, vi } from "vitest";
import { withRetry } from "@/lib/api/retry";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("withRetry", () => {
  it("retorna resultado quando a operacao funciona na primeira tentativa", async () => {
    // Arrange
    const operacao = vi.fn().mockResolvedValue("ok");

    // Act
    const resultado = await withRetry(operacao, { maxAttempts: 3, delayMs: 0 });

    // Assert
    expect(resultado).toBe("ok");
    expect(operacao).toHaveBeenCalledTimes(1);
  });

  it("faz retry para erro transitorio e depois resolve", async () => {
    // Arrange
    vi.spyOn(Math, "random").mockReturnValue(0);
    const onRetry = vi.fn();
    const operacao = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("database is locked"))
      .mockResolvedValueOnce("ok");

    // Act
    const resultado = await withRetry(operacao, { maxAttempts: 3, delayMs: 0, onRetry });

    // Assert
    expect(resultado).toBe("ok");
    expect(operacao).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("nao faz retry quando erro nao deve ser repetido", async () => {
    // Arrange
    const erro = new Error("regra de negocio invalida");
    const operacao = vi.fn().mockRejectedValue(erro);

    // Act
    const execucao = withRetry(operacao, {
      maxAttempts: 3,
      delayMs: 0,
      shouldRetry: () => false,
    });

    // Assert
    await expect(execucao).rejects.toThrow("regra de negocio invalida");
    expect(operacao).toHaveBeenCalledTimes(1);
  });
});
