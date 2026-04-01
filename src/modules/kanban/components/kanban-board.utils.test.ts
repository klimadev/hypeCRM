import { describe, expect, it } from "vitest";
import type { Estagio } from "../types";
import {
  formatarTempoRelativoKanban,
  obterBadgeOrigemKanban,
  obterClasseIndicadorEtapaKanban,
  obterSinalVisualNegocioKanban,
  obterTintColunaKanban,
} from "./kanban-board.utils";

const estagioAberto: Estagio = {
  id: "1",
  nome: "Pré Aprovação",
  ordem: 1,
  tipo: "ABERTO",
};

describe("obterTintColunaKanban", () => {
  it("retorna gradiente verde para ganhos", () => {
    expect(
      obterTintColunaKanban({ ...estagioAberto, tipo: "GANHO", nome: "Fechado" }),
    ).toContain("16,185,129");
  });
});

describe("obterSinalVisualNegocioKanban", () => {
  it("destaca estagio perdido com marcador neutro", () => {
    expect(
      obterSinalVisualNegocioKanban({ ...estagioAberto, tipo: "PERDIDO", nome: "Perdido" }),
    ).toEqual({
      circle: "h-2 w-2 rounded-full bg-slate-400",
      border: "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.04)]",
    });
  });
});

describe("formatarTempoRelativoKanban", () => {
  it("resume dias em semanas quando necessario", () => {
    const agoraMs = new Date("2026-04-20T12:00:00.000Z").getTime();

    expect(formatarTempoRelativoKanban("2026-04-10T12:00:00.000Z", agoraMs)).toBe("1 sem atras");
  });
});

describe("obterBadgeOrigemKanban", () => {
  it("traduz origem do whatsapp", () => {
    expect(obterBadgeOrigemKanban("SINCRONIZACAO_WHATSAPP")).toEqual({
      label: "WhatsApp",
      tone: "whatsapp",
    });
  });
});

describe("obterClasseIndicadorEtapaKanban", () => {
  it("usa amber para pre aprovacao aberta", () => {
    expect(obterClasseIndicadorEtapaKanban(estagioAberto)).toBe("bg-amber-400");
  });
});
