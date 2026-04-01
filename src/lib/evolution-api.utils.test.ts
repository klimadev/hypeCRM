import { describe, expect, it } from "vitest";
import {
  agruparConversasPorBuscaEvolution,
  deduplicarMensagensPorContatoEvolution,
  extrairTelefoneEvolution,
  mapearContatoEvolution,
  mapearConversaEvolution,
  normalizarQrCodeEvolution,
} from "./evolution-api.utils";

describe("extrairTelefoneEvolution", () => {
  it("remove sufixos conhecidos do jid", () => {
    expect(extrairTelefoneEvolution("5511999999999@s.whatsapp.net")).toBe("5511999999999");
    expect(extrairTelefoneEvolution("5511999999999@lid")).toBe("5511999999999");
  });
});

describe("normalizarQrCodeEvolution", () => {
  it("aproveita fallback do objeto raiz", () => {
    expect(normalizarQrCodeEvolution({ base64: "abc", code: "qr" })).toEqual({
      code: "qr",
      base64: "abc",
      pairingCode: null,
      count: null,
    });
  });
});

describe("mapearContatoEvolution", () => {
  it("ignora grupos e normaliza chat valido", () => {
    expect(
      mapearContatoEvolution({ remoteJid: "5511999999999@s.whatsapp.net", pushName: "Maria", isGroup: false }),
    ).toEqual({
      id: "5511999999999@s.whatsapp.net",
      nome: "Maria",
      pushName: "Maria",
      remoteJidAlt: null,
      isGroup: false,
    });
  });
});

describe("mapearConversaEvolution", () => {
  it("normaliza remoteJidAlt somente quando o identificador eh de pessoa", () => {
    expect(
      mapearConversaEvolution({
        remoteJid: "5511999999999@s.whatsapp.net",
        remoteJidAlt: "5511999999999@s.whatsapp.net",
        pushName: "Ana",
      }),
    ).toMatchObject({
      remoteJid: "5511999999999@s.whatsapp.net",
      remoteJidAlt: "5511999999999@s.whatsapp.net",
      pushName: "Ana",
    });
  });
});

describe("agruparConversasPorBuscaEvolution", () => {
  it("mantem a mensagem mais recente por conversa", () => {
    expect(
      agruparConversasPorBuscaEvolution([
        { key: { remoteJid: "1@s.whatsapp.net" }, pushName: "A", messageTimestamp: 1 },
        { key: { remoteJid: "1@s.whatsapp.net" }, pushName: "B", messageTimestamp: 2 },
      ]),
    ).toEqual([
      { remoteJid: "1@s.whatsapp.net", remoteJidAlt: null, pushName: "B", isGroup: false },
    ]);
  });
});

describe("deduplicarMensagensPorContatoEvolution", () => {
  it("preserva apenas a ultima mensagem por chave de contato", () => {
    expect(
      deduplicarMensagensPorContatoEvolution([
        {
          remoteJid: "1@s.whatsapp.net",
          remoteJidAlt: null,
          remoteJidAltLastMessage: null,
          pushName: "A",
          messageTimestamp: 1,
        },
        {
          remoteJid: "1@s.whatsapp.net",
          remoteJidAlt: null,
          remoteJidAltLastMessage: null,
          pushName: "B",
          messageTimestamp: 3,
        },
      ]),
    ).toEqual([
      {
        remoteJid: "1@s.whatsapp.net",
        remoteJidAlt: null,
        remoteJidAltLastMessage: null,
        pushName: "B",
        messageTimestamp: 3,
      },
    ]);
  });
});
