import { describe, expect, it } from "vitest";
import { agruparConversasPorBuscaEvolution, mapearContatoEvolution, mapearConversaEvolution } from "./evolution-api.utils";

describe("evolution-api.utils", () => {
  it("normaliza conversas usando o jid canonico quando existe remoteJidAlt", () => {
    const conversa = mapearConversaEvolution({
      remoteJid: "157862277959928@lid",
      remoteJidAlt: "5511980733723@s.whatsapp.net",
      pushName: "Contato",
    });

    expect(conversa).toMatchObject({
      remoteJid: "5511980733723@s.whatsapp.net",
      remoteJidAlt: "5511980733723@s.whatsapp.net",
      pushName: "Contato",
    });
  });

  it("agrupa conversas pelo jid canonico", () => {
    const conversas = agruparConversasPorBuscaEvolution([
      {
        key: { remoteJid: "157862277959928@lid", remoteJidAlt: "5511980733723@s.whatsapp.net" },
        pushName: "Contato",
        messageTimestamp: 10,
      },
      {
        key: { remoteJid: "5511980733723@s.whatsapp.net" },
        pushName: "Contato",
        messageTimestamp: 20,
      },
    ]);

    expect(conversas).toHaveLength(1);
    expect(conversas[0]).toMatchObject({
      remoteJid: "5511980733723@s.whatsapp.net",
      pushName: "Contato",
    });
  });

  it("mapeia contato com id canonico", () => {
    const contato = mapearContatoEvolution({
      remoteJid: "157862277959928@lid",
      remoteJidAlt: "5511980733723@s.whatsapp.net",
      pushName: "Contato",
    });

    expect(contato).toMatchObject({
      id: "5511980733723@s.whatsapp.net",
      remoteJidAlt: "5511980733723@s.whatsapp.net",
      pushName: "Contato",
    });
  });
});
