/**
 * Teste intrusivo para debugar carregamento de mensagens do chat.
 * Rode com: npx tsx test-debug-messages.ts
 */

import { buscarMensagensPorContato } from "./src/lib/evolution-api.chat";
import { resolverDestinoConversaWhatsapp } from "./src/lib/chat-remote-jid";

const TESTE = {
  instanceName: "hype_lima_pessoal",
  remoteJid: "555199309404@s.whatsapp.net",
};

async function main() {
  console.log("=".repeat(60));
  console.log("[DEBUG] Teste de carregamento de mensagens");
  console.log("=".repeat(60));

  // 1. Resolver destino
  console.log("\n[1] Resolvendo destino...");
  const destino = await resolverDestinoConversaWhatsapp(TESTE.instanceName, TESTE.remoteJid);
  console.log("   destino:", JSON.stringify(destino, null, 2));

  if (!destino) {
    console.error("   ERRO: Não resolveu destino!");
    return;
  }

  const telefone = destino.telefone;
  console.log("   telefone extraído:", telefone);

  // 2. Testar com remoteJid original
  console.log("\n[2] Evolution API com remoteJid:", TESTE.remoteJid);
  try {
    const result = await buscarMensagensPorContato(TESTE.instanceName, TESTE.remoteJid, 1, 50);
    console.log("   mensagens:", result.messages.length);
    console.log("   hasMore:", result.hasMore);
    if (result.messages.length > 0) {
      console.log("   sample:", JSON.stringify(result.messages.slice(0, 2), null, 2));
    }
  } catch (err) {
    console.error("   ERRO:", err);
    if (err instanceof Error && err.message) {
      // Tentar extrair mais info do erro
      console.error("   mensagem:", err.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("[DEBUG] Fim do teste");
  console.log("=".repeat(60));
}

main().catch(console.error);