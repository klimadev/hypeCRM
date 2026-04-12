import { describe, expect, it } from "vitest";
import type { ChatShortcut } from "@/lib/api/chat-shortcuts";
import {
  filtrarOrdenarAtalhos,
  LIMITE_HISTORICO_ATALHOS,
  normalizarMapaUsosAtalho,
  obterQueryAtalho,
  registrarUsoRecenteAtalho,
  resolverAcaoAtalhoTeclado,
} from "@/modules/chat/shortcuts-composer";

const BASE_ATALHOS: ChatShortcut[] = [
  {
    id: "1",
    nome: "Boas-vindas",
    slug: "boas-vindas",
    conteudo: "Olá {{lead_nome}}",
    tags: ["onboarding"],
    ativo: true,
    criadoEm: "2026-01-01T00:00:00.000Z",
    atualizadoEm: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    nome: "Boleto",
    slug: "boleto",
    conteudo: "Segue boleto",
    tags: ["financeiro"],
    ativo: true,
    criadoEm: "2026-01-01T00:00:00.000Z",
    atualizadoEm: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "3",
    nome: "Bloqueado",
    slug: "bloqueado",
    conteudo: "Atalho inativo",
    tags: ["interno"],
    ativo: false,
    criadoEm: "2026-01-01T00:00:00.000Z",
    atualizadoEm: "2026-01-01T00:00:00.000Z",
  },
];

describe("obterQueryAtalho", () => {
  it("retorna query em minusculo quando texto inicia com barra e sem espacos", () => {
    // Arrange
    const texto = "/BoL";

    // Act
    const query = obterQueryAtalho(texto);

    // Assert
    expect(query).toBe("bol");
  });

  it("retorna vazio quando texto nao representa atalho", () => {
    // Arrange
    const texto = "/bol mensagem";

    // Act
    const query = obterQueryAtalho(texto);

    // Assert
    expect(query).toBe("");
  });
});

describe("filtrarOrdenarAtalhos", () => {
  it("filtra por query e prioriza uso recente", () => {
    // Arrange
    const query = "bo";
    const usosRecentes = { boleto: 200, "boas-vindas": 100 };

    // Act
    const atalhos = filtrarOrdenarAtalhos(BASE_ATALHOS, query, usosRecentes);

    // Assert
    expect(atalhos.map((item) => item.slug)).toEqual(["boleto", "boas-vindas"]);
  });

  it("ignora inativos e aplica ordenacao alfabetica quando nao ha recencia", () => {
    // Arrange
    const query = "";
    const usosRecentes = {};

    // Act
    const atalhos = filtrarOrdenarAtalhos(BASE_ATALHOS, query, usosRecentes);

    // Assert
    expect(atalhos.map((item) => item.slug)).toEqual(["boas-vindas", "boleto"]);
  });
});

describe("registrarUsoRecenteAtalho", () => {
  it("atualiza timestamp e respeita limite de historico", () => {
    // Arrange
    const base = Object.fromEntries(Array.from({ length: LIMITE_HISTORICO_ATALHOS }, (_, idx) => [`atalho-${idx}`, 1000 - idx]));

    // Act
    const atualizado = registrarUsoRecenteAtalho(base, "novo-atalho", 2000);

    // Assert
    expect(Object.keys(atualizado)).toHaveLength(LIMITE_HISTORICO_ATALHOS);
    expect(atualizado["novo-atalho"]).toBe(2000);
    expect(atualizado["atalho-19"]).toBeUndefined();
  });

  it("substitui recencia quando slug ja existe", () => {
    // Arrange
    const base = { boleto: 10, boas: 5 };

    // Act
    const atualizado = registrarUsoRecenteAtalho(base, "boleto", 999);

    // Assert
    expect(atualizado.boleto).toBe(999);
    expect(Object.keys(atualizado)[0]).toBe("boleto");
  });
});

describe("normalizarMapaUsosAtalho", () => {
  it("mantem apenas valores numericos finitos e limita quantidade", () => {
    // Arrange
    const entrada = {
      valido: 10,
      invalido: "11",
      nulo: null,
      infinito: Infinity,
      recente: 20,
    };

    // Act
    const normalizado = normalizarMapaUsosAtalho(entrada, 1);

    // Assert
    expect(normalizado).toEqual({ recente: 20 });
  });

  it("retorna objeto vazio para entrada invalida", () => {
    // Arrange
    const entrada = "nao-objeto";

    // Act
    const normalizado = normalizarMapaUsosAtalho(entrada);

    // Assert
    expect(normalizado).toEqual({});
  });
});

describe("resolverAcaoAtalhoTeclado", () => {
  it("navega para baixo com ArrowDown e Ctrl/Cmd+J", () => {
    // Arrange
    const base = { atalhosAbertos: true, quantidadeAtalhos: 3, indiceAtual: 1 };

    // Act
    const viaSeta = resolverAcaoAtalhoTeclado({ ...base, input: { key: "ArrowDown" } });
    const viaCtrlJ = resolverAcaoAtalhoTeclado({ ...base, input: { key: "j", ctrlKey: true } });

    // Assert
    expect(viaSeta).toEqual({ tipo: "navegar", indice: 2 });
    expect(viaCtrlJ).toEqual({ tipo: "navegar", indice: 2 });
  });

  it("navega para cima com ArrowUp e Ctrl/Cmd+K com wrap", () => {
    // Arrange
    const base = { atalhosAbertos: true, quantidadeAtalhos: 3, indiceAtual: 0 };

    // Act
    const viaSeta = resolverAcaoAtalhoTeclado({ ...base, input: { key: "ArrowUp" } });
    const viaMetaK = resolverAcaoAtalhoTeclado({ ...base, input: { key: "k", metaKey: true } });

    // Assert
    expect(viaSeta).toEqual({ tipo: "navegar", indice: 2 });
    expect(viaMetaK).toEqual({ tipo: "navegar", indice: 2 });
  });

  it("retorna aplicar com Enter/Tab quando lista esta aberta", () => {
    // Arrange
    const base = { atalhosAbertos: true, quantidadeAtalhos: 2, indiceAtual: 0 };

    // Act
    const viaEnter = resolverAcaoAtalhoTeclado({ ...base, input: { key: "Enter", shiftKey: false } });
    const viaTab = resolverAcaoAtalhoTeclado({ ...base, input: { key: "Tab" } });

    // Assert
    expect(viaEnter).toEqual({ tipo: "aplicar" });
    expect(viaTab).toEqual({ tipo: "aplicar" });
  });

  it("fecha com Escape e nao aplica com Shift+Enter", () => {
    // Arrange
    const base = { atalhosAbertos: true, quantidadeAtalhos: 2, indiceAtual: 0 };

    // Act
    const escape = resolverAcaoAtalhoTeclado({ ...base, input: { key: "Escape" } });
    const shiftEnter = resolverAcaoAtalhoTeclado({ ...base, input: { key: "Enter", shiftKey: true } });

    // Assert
    expect(escape).toEqual({ tipo: "fechar" });
    expect(shiftEnter).toEqual({ tipo: "nenhuma" });
  });

  it("fora da lista trata Enter como envio normal", () => {
    // Arrange
    const params = { atalhosAbertos: false, quantidadeAtalhos: 0, indiceAtual: 0, input: { key: "Enter" } };

    // Act
    const acao = resolverAcaoAtalhoTeclado(params);

    // Assert
    expect(acao).toEqual({ tipo: "enviar" });
  });
});
