import { describe, expect, it } from "vitest";
import {
  escolherStatusMaisForte,
  extrairDadosAdDoMapa,
  extrairNomeDoLeadDoMapa,
  mapearStatusMensagem,
  normalizarMensagensEvolution,
} from "./whatsapp-chat";
import { normalizarRemoteJidParaLead } from "./whatsapp-chat";

describe("normalizarMensagensEvolution", () => {
  it("normaliza conversa simples com status lido", () => {
    const mensagens = normalizarMensagensEvolution([
      {
        key: {
          id: "msg-1",
          remoteJid: "5511999999999@s.whatsapp.net",
          fromMe: false,
        },
        message: {
          conversation: "Olá",
        },
        messageTimestamp: 1710000000,
        MessageUpdate: [{ status: "READ" }],
        messageType: "conversation",
        pushName: "Maria",
      },
    ]);

    expect(mensagens).toHaveLength(1);
    expect(mensagens[0]).toMatchObject({
      messageId: "msg-1",
      text: "Olá",
      status: "READ",
      pushName: "Maria",
    });
  });
});

describe("mapearStatusMensagem", () => {
  it("usa fallback de saida quando status nao existe", () => {
    expect(mapearStatusMensagem(undefined, true)).toBe("SENT");
  });
});

describe("normalizarRemoteJidParaLead", () => {
  it("gera jid valido para telefone brasileiro", () => {
    expect(normalizarRemoteJidParaLead("(11) 99999-9999")).toEqual({
      ok: true,
      waNumber: "5511999999999",
      remoteJid: "5511999999999@s.whatsapp.net",
    });
  });
});

describe("escolherStatusMaisForte", () => {
  it("prioriza erro sobre entregue", () => {
    expect(escolherStatusMaisForte("DELIVERED", "ERROR")).toBe("ERROR");
  });
});

describe("mapa de contatos", () => {
  it("extrai nome e dados de anuncio do mapa", () => {
    const mapa = new Map([
      [
        "5511999999999@s.whatsapp.net",
        {
          pushName: "Maria",
          dadosAd: {
            titulo: "Campanha XPTO",
            corpo: null,
            urlOrigem: null,
            idConversao: null,
            urlThumbnail: null,
            tipoOrigem: null,
            appOrigem: null,
            formato: null,
          },
          timestamp: 1710000000,
          remoteJidAlt: "5511999999999@s.whatsapp.net",
        },
      ],
    ]);

    expect(extrairNomeDoLeadDoMapa(mapa, "5511999999999@s.whatsapp.net")).toBe("Maria");
    expect(extrairDadosAdDoMapa(mapa, "5511999999999@s.whatsapp.net")).toEqual({
      titulo: "Campanha XPTO",
      corpo: null,
      urlOrigem: null,
      idConversao: null,
      urlThumbnail: null,
      tipoOrigem: null,
      appOrigem: null,
      formato: null,
    });
  });
});
