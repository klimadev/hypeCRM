import { describe, expect, it } from "vitest";
import {
  calcularFromMe,
  classificarFalhaInstagram,
  criarUrlGraphInstagram,
  deduplicarMensagensInstagram,
  identificarParticipante,
  resolverConversationIdSelecionada,
} from "./instagram-inbox";

describe("criarUrlGraphInstagram", () => {
  it("monta URLs do Instagram Login no host graph.instagram.com", () => {
    const url = criarUrlGraphInstagram("26160319576992690/conversations?fields=id,updated_time&limit=10", "token-teste");

    expect(url.origin).toBe("https://graph.instagram.com");
    expect(url.pathname).toBe("/v25.0/26160319576992690/conversations");
    expect(url.searchParams.get("fields")).toBe("id,updated_time");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("access_token")).toBe("token-teste");
  });
});

describe("identificarParticipante", () => {
  it("retorna o participante que NAO eh a conta business quando ha dois participantes", () => {
    const participantes = [
      { id: "business_123", name: "Minha Loja", username: "minhaloja" },
      { id: "customer_456", name: "Joao Silva", username: "joaosilva" },
    ];

    const resultado = identificarParticipante(participantes, "business_123", "minhaloja");

    expect(resultado).toEqual({ id: "customer_456", name: "Joao Silva", username: "joaosilva" });
  });

  it("retorna o primeiro participante quando business nao esta na lista (fallback)", () => {
    const participantes = [
      { id: "customer_789", name: "Maria Souza", username: "mariasouza" },
    ];

    const resultado = identificarParticipante(participantes, "business_999", "minhaloja");

    expect(resultado).toEqual({ id: "customer_789", name: "Maria Souza", username: "mariasouza" });
  });

  it("retorna null quando lista de participantes esta vazia", () => {
    const resultado = identificarParticipante([], "business_123", "minhaloja");

    expect(resultado).toBeNull();
  });

  it("retorna null quando participantes eh undefined", () => {
    const resultado = identificarParticipante(undefined, "business_123", "minhaloja");

    expect(resultado).toBeNull();
  });

  it("filtra corretamente mesmo quando business esta em segundo na lista", () => {
    const participantes = [
      { id: "customer_456", name: "Joao Silva", username: "joaosilva" },
      { id: "business_123", name: "Minha Loja", username: "minhaloja" },
    ];

    const resultado = identificarParticipante(participantes, "business_123", "minhaloja");

    expect(resultado).toEqual({ id: "customer_456", name: "Joao Silva", username: "joaosilva" });
  });

  it("retorna primeiro participante quando todos os participantes sao a conta business (edge case)", () => {
    const participantes = [
      { id: "business_123", name: "Minha Loja", username: "minhaloja" },
    ];

    const resultado = identificarParticipante(participantes, "business_123", "minhaloja");

    expect(resultado).toEqual({ id: "business_123", name: "Minha Loja", username: "minhaloja" });
  });

  it("filtra por username quando IDs sao diferentes (messaging vs publishing ID)", () => {
    const participantes = [
      { id: "17841470348340237", name: "Lima Webvision", username: "lima_tests" },
      { id: "1602510301006188", name: "Kaua", username: "000_kaua000" },
    ];

    const resultado = identificarParticipante(participantes, "26160319576992690", "lima_tests");

    expect(resultado).toEqual({ id: "1602510301006188", name: "Kaua", username: "000_kaua000" });
  });

  it("fallback para ID quando username nao esta disponivel", () => {
    const participantes = [
      { id: "business_123", name: "Minha Loja" },
      { id: "customer_456", name: "Joao Silva" },
    ];

    const resultado = identificarParticipante(participantes, "business_123");

    expect(resultado).toEqual({ id: "customer_456", name: "Joao Silva" });
  });
});

describe("calcularFromMe", () => {
  it("retorna true quando from_username eh igual ao accountUsername", () => {
    const resultado = calcularFromMe("lima_tests", "lima_tests");

    expect(resultado).toBe(true);
  });

  it("retorna false quando from_username eh diferente do accountUsername", () => {
    const resultado = calcularFromMe("000_kaua000", "lima_tests");

    expect(resultado).toBe(false);
  });

  it("retorna false quando from_username eh null", () => {
    const resultado = calcularFromMe(null, "lima_tests");

    expect(resultado).toBe(false);
  });

  it("retorna false quando accountUsername eh vazio", () => {
    const resultado = calcularFromMe("000_kaua000", "");

    expect(resultado).toBe(false);
  });
});

describe("resolverConversationIdSelecionada", () => {
  it("usa a conversationId solicitada quando ela existe na lista", () => {
    const resultado = resolverConversationIdSelecionada(
      [
        { id: "conv-1" },
        { id: "conv-2" },
      ],
      "conv-2",
    );

    expect(resultado).toBe("conv-2");
  });

  it("faz fallback para a primeira conversa quando a solicitada nao existe", () => {
    const resultado = resolverConversationIdSelecionada(
      [
        { id: "conv-1" },
        { id: "conv-2" },
      ],
      "conv-invalida",
    );

    expect(resultado).toBe("conv-1");
  });

  it("retorna null quando nao ha conversas", () => {
    const resultado = resolverConversationIdSelecionada([], "conv-1");

    expect(resultado).toBeNull();
  });
});

describe("classificarFalhaInstagram", () => {
  it("classifica token expirado com status explicito", () => {
    const resultado = classificarFalhaInstagram({
      status: 401,
      code: 190,
      message: "Invalid OAuth access token.",
      type: "OAuthException",
    });

    expect(resultado.categoria).toBe("token_invalido");
    expect(resultado.deveDesativarToken).toBe(true);
  });

  it("classifica falta de permissao", () => {
    const resultado = classificarFalhaInstagram({
      status: 403,
      code: 10,
      message: "Application does not have permission for this action",
      type: "OAuthException",
    });

    expect(resultado.categoria).toBe("sem_permissao");
    expect(resultado.deveDesativarToken).toBe(false);
  });

  it("classifica endpoint incorreto quando a API indicar recurso inexistente", () => {
    const resultado = classificarFalhaInstagram({
      status: 400,
      code: 100,
      message: "Unsupported get request. Object with ID '123' does not exist",
      type: "GraphMethodException",
    });

    expect(resultado.categoria).toBe("endpoint_invalido");
  });
});

describe("deduplicarMensagensInstagram", () => {
  it("mantem uma unica mensagem por id priorizando a mais recente", () => {
    const resultado = deduplicarMensagensInstagram([
      {
        id: "msg-1",
        text: "primeira",
        created_at: "2026-04-04T10:00:00.000Z",
      },
      {
        id: "msg-1",
        text: "mais recente",
        created_at: "2026-04-04T11:00:00.000Z",
      },
      {
        id: "msg-2",
        text: "outra",
        created_at: "2026-04-04T09:00:00.000Z",
      },
    ]);

    expect(resultado).toHaveLength(2);
    expect(resultado.find((item) => item.id === "msg-1")?.text).toBe("mais recente");
  });
});
