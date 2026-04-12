import { describe, expect, it } from "vitest";
import {
  calcularAgendaPorInstancia,
  calcularResumoCampanha,
  gerarAtrasoDinamicoMs,
  type LeadElegivelCampanha,
} from "./disparo-campanha.utils";

describe("disparo-campanha.utils", () => {
  it("gera atraso dentro da faixa com jitter", () => {
    const atrasos = Array.from({ length: 50 }, () => gerarAtrasoDinamicoMs({
      delayMinSegundos: 120,
      delayMaxSegundos: 240,
      jitterMaxMs: 900,
    }));

    for (const atraso of atrasos) {
      expect(atraso).toBeGreaterThanOrEqual(120000);
      expect(atraso).toBeLessThanOrEqual(240900);
    }
  });

  it("calcula agenda paralela por instancia", () => {
    const inicio = "2026-05-01T12:00:00.000Z";
    const leads: LeadElegivelCampanha[] = [
      { leadId: "l1", instanceName: "inst-a" },
      { leadId: "l2", instanceName: "inst-b" },
      { leadId: "l3", instanceName: "inst-a" },
      { leadId: "l4", instanceName: "inst-b" },
    ];

    const agenda = calcularAgendaPorInstancia({
      inicio,
      leads,
      delayMinSegundos: 120,
      delayMaxSegundos: 120,
      jitterMaxMs: 0,
    });

    expect(agenda).toHaveLength(4);
    expect(agenda[0]?.agendadoPara.toISOString()).toBe("2026-05-01T12:00:00.000Z");
    expect(agenda[1]?.agendadoPara.toISOString()).toBe("2026-05-01T12:00:00.000Z");
    expect(agenda[2]?.agendadoPara.toISOString()).toBe("2026-05-01T12:02:00.000Z");
    expect(agenda[3]?.agendadoPara.toISOString()).toBe("2026-05-01T12:02:00.000Z");
  });

  it("resume campanha com duracao estimada", () => {
    const resumo = calcularResumoCampanha({
      selecionadosTotal: 90,
      elegiveisTotal: 76,
      inicio: "2026-05-01T12:00:00.000Z",
      ultimoAgendamento: "2026-05-01T14:30:30.000Z",
    });

    expect(resumo.ignoradosTotal).toBe(14);
    expect(resumo.duracaoEstimadaSegundos).toBe(9030);
  });
});
