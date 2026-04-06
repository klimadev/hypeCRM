import { beforeAll, describe, it } from "vitest";
import { prisma } from "@/lib/prisma";

/**
 * Teste de diagnostico — chamada direta ao Instagram Graph API
 * para entender o erro real do envio.
 */
describe.skipIf(!process.env.TEST_INSTAGRAM_REAL)(
  "[DIAGNOSTICO] Chamada direta ao Graph API — envio de mensagem",
  () => {
    let accessToken: string;
    let igUserId: string;
    const conversationId = "aWdfZAG06MzQwMjgyMzY2ODQxNzEwMzAxMjQ0MjU5OTA5MzU5NDg4MzY5Mjg0";
    const participantId = "1602510301006188";

    beforeAll(async () => {
      const conta = await prisma.instagramConta.findFirst({
        where: { status: "active" },
        orderBy: { atualizado_em: "desc" },
      });

      if (!conta) {
        throw new Error("Nenhuma conta ativa encontrada.");
      }

      accessToken = conta.access_token;
      igUserId = conta.instagram_user_id;
      console.log(`[DIAG] IG User ID: ${igUserId}`);
      console.log(`[DIAG] Token (primeiros 30 chars): ${accessToken.substring(0, 30)}...`);
    });

    it("deve chamar endpoint /me/messages diretamente e mostrar resposta crua", async () => {
      const texto = `Diagnostico CRM ${new Date().toISOString()}`;
      const url = `https://graph.instagram.com/v25.0/me/messages?access_token=${accessToken}`;

      console.log(`[DIAG] URL: ${url.substring(0, 80)}...`);
      console.log(`[DIAG] Participant ID: ${participantId}`);
      console.log(`[DIAG] Texto: ${texto}`);

      const resposta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: participantId },
          message: { text: texto },
        }),
      });

      console.log(`[DIAG] Status HTTP: ${resposta.status}`);
      console.log(`[DIAG] Status Text: ${resposta.statusText}`);

      const headers: Record<string, string> = {};
      resposta.headers.forEach((v, k) => { headers[k] = v; });
      console.log(`[DIAG] Headers de resposta:`, JSON.stringify(headers, null, 2));

      const json = await resposta.json().catch(() => null);
      console.log(`[DIAG] Corpo da resposta:`, JSON.stringify(json, null, 2));

      if (!resposta.ok) {
        const erro = json?.error;
        console.log(`[DIAG] --- Detalhes do erro ---`);
        console.log(`[DIAG] message: ${erro?.message}`);
        console.log(`[DIAG] type: ${erro?.type}`);
        console.log(`[DIAG] code: ${erro?.code}`);
        console.log(`[DIAG] error_subcode: ${erro?.error_subcode}`);
        console.log(`[DIAG] fbtrace_id: ${erro?.fbtrace_id}`);
      }
    });

    it("deve chamar endpoint com conversation_id no lugar de recipient e mostrar resposta crua", async () => {
      const texto = `Diagnostico v2 ${new Date().toISOString()}`;
      const url = `https://graph.instagram.com/v25.0/me/messages?access_token=${accessToken}`;

      console.log(`[DIAG v2] Tentando com thread_id no body...`);

      const resposta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: conversationId,
          message: { text: texto },
        }),
      });

      console.log(`[DIAG v2] Status HTTP: ${resposta.status}`);
      const json = await resposta.json().catch(() => null);
      console.log(`[DIAG v2] Corpo da resposta:`, JSON.stringify(json, null, 2));
    });

    it("deve consultar info da conversa para verificar se esta ativa", async () => {
      const url = `https://graph.instagram.com/v25.0/${conversationId}?fields=id,updated_time,unread_count,participants,snippet,message_count&access_token=${accessToken}`;

      console.log(`[DIAG] Verificando status da conversa...`);

      const resposta = await fetch(url);
      console.log(`[DIAG] Status HTTP: ${resposta.status}`);
      const json = await resposta.json().catch(() => null);
      console.log(`[DIAG] Info da conversa:`, JSON.stringify(json, null, 2));
    });

    it("deve listar conversas recentes para verificar timestamp real", async () => {
      const url = `https://graph.instagram.com/v25.0/${igUserId}/conversations?fields=id,updated_time,unread_count,participants,snippet,message_count&limit=5&access_token=${accessToken}`;

      console.log(`[DIAG] Listando conversas recentes...`);

      const resposta = await fetch(url);
      console.log(`[DIAG] Status HTTP: ${resposta.status}`);
      const json = await resposta.json().catch(() => null);
      console.log(`[DIAG] Conversas:`, JSON.stringify(json, null, 2));
    });
  },
);
