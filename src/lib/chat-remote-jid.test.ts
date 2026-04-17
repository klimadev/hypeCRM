import { describe, expect, it } from "vitest";
import { resolverDestinoConversaWhatsapp } from "./chat-remote-jid";

describe("resolverDestinoConversaWhatsapp", () => {
  it("usa o jid canonico de telefone quando o remoteJid e lid", async () => {
    const destino = await resolverDestinoConversaWhatsapp("instancia-teste", "157862277959928@lid");

    expect(destino).toEqual({
      lookupRemoteJid: "157862277959928@s.whatsapp.net",
      telefone: "157862277959928",
    });
  });

  it("mantem o telefone mesmo quando o jid ja vem canonico", async () => {
    const destino = await resolverDestinoConversaWhatsapp("instancia-teste", "5511980733723@s.whatsapp.net");

    expect(destino).toEqual({
      lookupRemoteJid: "5511980733723@s.whatsapp.net",
      telefone: "5511980733723",
    });
  });
});
