import { describe, expect, it } from "vitest";
import { extrairLookupParaMensagens, resolverDestinoConversaWhatsapp, selecionarRemoteJidPreferencial } from "./chat-remote-jid";

describe("resolverDestinoConversaWhatsapp", () => {
  it("usa o jid canonico de telefone quando o remoteJid e lid", async () => {
    const destino = await resolverDestinoConversaWhatsapp("instancia-teste", "157862277959928@lid");

    expect(destino).toMatchObject({
      instanceName: "instancia-teste",
      remoteJid: "157862277959928@lid",
      remoteJidCanonico: "157862277959928@s.whatsapp.net",
      remoteJidAlt: "157862277959928@lid",
      lookupRemoteJid: "157862277959928@lid",
      telefone: "157862277959928",
    });
  });

  it("mantem o telefone mesmo quando o jid ja vem canonico", async () => {
    const destino = await resolverDestinoConversaWhatsapp("instancia-teste", "5511980733723@s.whatsapp.net");

    expect(destino).toMatchObject({
      instanceName: "instancia-teste",
      remoteJid: "5511980733723@s.whatsapp.net",
      remoteJidCanonico: "5511980733723@s.whatsapp.net",
      remoteJidAlt: null,
      lookupRemoteJid: "5511980733723@s.whatsapp.net",
      telefone: "5511980733723",
    });
  });

  it("prefere o jid real quando o remoteJidAlt ainda vem como lid", () => {
    expect(selecionarRemoteJidPreferencial("555182728764@s.whatsapp.net", "211278165475467@lid")).toBe(
      "555182728764@s.whatsapp.net",
    );
    expect(extrairLookupParaMensagens("555182728764@s.whatsapp.net", "211278165475467@lid")).toBe(
      "555182728764@s.whatsapp.net",
    );
  });
});
