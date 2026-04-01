import { describe, expect, it } from "vitest";
import type { KanbanFilters } from "../types";
import {
  aplicarFiltroRapidoKanban,
  criarResumoKanban,
  filtroRapidoKanbanAtivo,
  temFiltrosKanbanAtivos,
  toggleContatoSelecionado,
} from "./kanban-header.utils";

const filtrosBase: KanbanFilters = {
  status: "todos",
  gravidade: "todas",
  tipo: "todos",
  pdv: null,
  origem: "todos",
};

describe("criarResumoKanban", () => {
  it("resume pipeline com pluralizacao e moeda", () => {
    expect(criarResumoKanban({ totalNegocios: 2, totalPipeline: 123400, negociosParados: 1 })).toContain("2 negócios");
    expect(criarResumoKanban({ totalNegocios: 2, totalPipeline: 123400, negociosParados: 1 })).toContain("R$");
    expect(criarResumoKanban({ totalNegocios: 2, totalPipeline: 123400, negociosParados: 1 })).toContain("1 precisando de ação");
  });
});

describe("temFiltrosKanbanAtivos", () => {
  it("detecta filtros alem do estado padrao", () => {
    expect(temFiltrosKanbanAtivos(filtrosBase)).toBe(false);
    expect(temFiltrosKanbanAtivos({ ...filtrosBase, origem: "MANUAL" })).toBe(true);
    expect(temFiltrosKanbanAtivos({ ...filtrosBase, pdv: "pdv-1" })).toBe(true);
  });
});

describe("aplicarFiltroRapidoKanban", () => {
  it("limpa filtros quando seleciona todos", () => {
    expect(aplicarFiltroRapidoKanban({ tipo: "todos", filtros: { ...filtrosBase, origem: "MANUAL" }, modoFocoPendencias: true })).toEqual({
      filtros: filtrosBase,
      modoFocoPendencias: false,
    });
  });

  it("ativa foco de urgencias", () => {
    expect(aplicarFiltroRapidoKanban({ tipo: "urgencias", filtros: filtrosBase, modoFocoPendencias: false })).toEqual({
      filtros: { ...filtrosBase, status: "com_pendencia", gravidade: "todas", origem: "todos" },
      modoFocoPendencias: true,
    });
  });

  it("filtra por origem e desliga foco de urgencias", () => {
    expect(aplicarFiltroRapidoKanban({ tipo: "SINCRONIZACAO_WHATSAPP", filtros: { ...filtrosBase, status: "com_pendencia" }, modoFocoPendencias: true })).toEqual({
      filtros: { ...filtrosBase, origem: "SINCRONIZACAO_WHATSAPP", status: "todos", gravidade: "todas" },
      modoFocoPendencias: false,
    });
  });
});

describe("filtroRapidoKanbanAtivo", () => {
  it("detecta chip ativo corretamente", () => {
    expect(filtroRapidoKanbanAtivo({ tipo: "todos", filtros: filtrosBase, modoFocoPendencias: false })).toBe(true);
    expect(filtroRapidoKanbanAtivo({ tipo: "urgencias", filtros: { ...filtrosBase, status: "com_pendencia" }, modoFocoPendencias: false })).toBe(true);
    expect(filtroRapidoKanbanAtivo({ tipo: "MANUAL", filtros: { ...filtrosBase, origem: "MANUAL" }, modoFocoPendencias: false })).toBe(true);
  });
});

describe("toggleContatoSelecionado", () => {
  it("adiciona e remove contato da lista", () => {
    expect(toggleContatoSelecionado([], "lead-1")).toEqual(["lead-1"]);
    expect(toggleContatoSelecionado(["lead-1", "lead-2"], "lead-1")).toEqual(["lead-2"]);
  });
});
