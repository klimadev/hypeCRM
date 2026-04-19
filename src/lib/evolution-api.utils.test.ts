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
        key: { remoteJid: "157862277959928@lid", remoteJidAlt: "5511980733723@s.whatsapp.net", fromMe: false },
        pushName: "Contato",
        messageTimestamp: 10,
      },
      {
        key: { remoteJid: "5511980733723@s.whatsapp.net", fromMe: true },
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

  it("usa updatedAt como fallback de atividade quando nao ha timestamp de mensagem", () => {
    const conversa = mapearConversaEvolution({
      remoteJid: "5511980733723@s.whatsapp.net",
      pushName: "Contato",
      updatedAt: 1_700_000_000_000,
      lastMessage: {
        key: {
          remoteJid: "5511980733723@s.whatsapp.net",
        },
        pushName: "Contato",
      },
    });

    expect(conversa?.activityTimestamp).toBe(1_700_000_000);
  });

  it("preserva o jid de lookup quando a conversa vem como lid", () => {
    const conversa = mapearConversaEvolution({
      remoteJid: "157862277959928@lid",
      remoteJidAlt: "157862277959928@lid",
      pushName: "Contato",
    });

    expect(conversa).toMatchObject({
      remoteJid: "157862277959928@lid",
      remoteJidAlt: "157862277959928@lid",
      lookupRemoteJid: "157862277959928@lid",
      pushName: "Contato",
    });
  });
});
