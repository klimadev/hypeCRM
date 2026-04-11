import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calcularEstadoTrial, podeAcessarSistema } from "@/lib/trial";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-11T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("calcularEstadoTrial", () => {
  it("retorna trial ativo com dias restantes", () => {
    // Arrange
    const empresa = {
      status_assinatura: "TRIAL",
      trial_inicio: new Date("2026-04-01T00:00:00.000Z"),
      trial_fim: new Date("2026-04-15T00:00:00.000Z"),
      assinatura_inicio: null,
      assinatura_fim: null,
      plano: "trial",
    };

    // Act
    const estado = calcularEstadoTrial(empresa);

    // Assert
    expect(estado.trial_ativo).toBe(true);
    expect(estado.trial_expirado).toBe(false);
    expect(estado.dias_restantes).toBe(4);
  });

  it("marca trial como expirado quando a data limite passou", () => {
    // Arrange
    const empresa = {
      status_assinatura: "TRIAL",
      trial_inicio: new Date("2026-03-01T00:00:00.000Z"),
      trial_fim: new Date("2026-04-10T00:00:00.000Z"),
      assinatura_inicio: null,
      assinatura_fim: null,
      plano: "trial",
    };

    // Act
    const estado = calcularEstadoTrial(empresa);

    // Assert
    expect(estado.trial_expirado).toBe(true);
    expect(estado.status).toBe("EXPIRADA");
    expect(estado.dias_restantes).toBe(0);
  });
});

describe("podeAcessarSistema", () => {
  it("permite acesso para assinatura ativa", () => {
    // Arrange
    const empresa = {
      status_assinatura: "ATIVA",
      trial_inicio: null,
      trial_fim: null,
      assinatura_inicio: new Date("2026-01-01T00:00:00.000Z"),
      assinatura_fim: null,
      plano: "pro",
    };

    // Act
    const acesso = podeAcessarSistema(empresa);

    // Assert
    expect(acesso).toBe(true);
  });

  it("bloqueia acesso para assinatura cancelada", () => {
    // Arrange
    const empresa = {
      status_assinatura: "CANCELADA",
      trial_inicio: null,
      trial_fim: null,
      assinatura_inicio: null,
      assinatura_fim: null,
      plano: "trial",
    };

    // Act
    const acesso = podeAcessarSistema(empresa);

    // Assert
    expect(acesso).toBe(false);
  });
});
