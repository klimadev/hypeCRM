import { describe, expect, it } from "vitest";

import { extrairContatoCanonicalDeMensagens } from "./evolution-api.chat";

describe("extrairContatoCanonicalDeMensagens", () => {
  it("prefere o jid real do WhatsApp quando a thread mistura @lid e @s.whatsapp.net", () => {
    const resultado = extrairContatoCanonicalDeMensagens([
      {
        key: {
          fromMe: false,
          remoteJid: "211278165475467@lid",
          remoteJidAlt: "555182728764@s.whatsapp.net",
        },
        pushName: "Nicolas",
      },
      {
        key: {
          fromMe: true,
          remoteJid: "211278165475467@lid",
        },
        pushName: null,
      },
    ]);

    expect(resultado).toEqual({
      pushName: "Nicolas",
      remoteJidCanonico: "555182728764@s.whatsapp.net",
    });
  });
});
