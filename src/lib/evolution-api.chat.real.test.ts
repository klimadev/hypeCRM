import { describe, expect, it } from "vitest";
import { buscarConversas, buscarMensagensPorContato } from "./evolution-api.chat";
import { listarInstancias } from "./evolution-api.instances";

const instanceName = process.env.CHAT_REAL_INSTANCE_NAME;
const remoteJidFromEnv = process.env.CHAT_REAL_REMOTE_JID;
const runRealIntegration = Boolean(
  process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY && instanceName,
);

const describeReal = runRealIntegration ? describe : describe.skip;

describeReal("evolution chat real integration", () => {
  it("conecta na Evolution e encontra a instancia configurada", async () => {
    const instancias = await listarInstancias();

    expect(Array.isArray(instancias)).toBe(true);
    expect(instancias.some((instancia) => instancia.instanceName === instanceName)).toBe(true);
  });

  it("busca conversas da instancia real", async () => {
    const conversas = await buscarConversas(instanceName!);

    expect(Array.isArray(conversas)).toBe(true);
  });

  it("busca mensagens de uma conversa real sem enviar mensagens", async () => {
    const conversas = await buscarConversas(instanceName!);
    const remoteJid = remoteJidFromEnv ?? conversas[0]?.remoteJidAlt ?? conversas[0]?.remoteJid;

    expect(remoteJid).toBeTruthy();

    const resultado = await buscarMensagensPorContato(instanceName!, remoteJid!, 1, 20);

    expect(Array.isArray(resultado.messages)).toBe(true);
    expect(typeof resultado.hasMore).toBe("boolean");
  });
});
