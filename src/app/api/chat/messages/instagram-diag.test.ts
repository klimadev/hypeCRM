import { beforeAll, describe, expect, it } from "vitest";
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
    });

    it("deve chamar endpoint /me/messages diretamente e mostrar resposta crua", async () => {
      const texto = `Diagnostico CRM ${new Date().toISOString()}`;
      const url = `https://graph.instagram.com/v25.0/me/messages?access_token=${accessToken}`;

      const resposta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: participantId },
          message: { text: texto },
        }),
      });

      const json = await resposta.json().catch(() => null);

      expect(resposta.status).toBeGreaterThan(0);
      if (!resposta.ok) {
        expect(json?.error).toBeDefined();
      }
    });

    it("deve chamar endpoint com conversation_id no lugar de recipient e mostrar resposta crua", async () => {
      const texto = `Diagnostico v2 ${new Date().toISOString()}`;
      const url = `https://graph.instagram.com/v25.0/me/messages?access_token=${accessToken}`;

      const resposta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: conversationId,
          message: { text: texto },
        }),
      });

      const json = await resposta.json().catch(() => null);

      expect(resposta.status).toBeGreaterThan(0);
      expect(json).not.toBeNull();
    });

    it("deve consultar info da conversa para verificar se esta ativa", async () => {
      const url = `https://graph.instagram.com/v25.0/${conversationId}?fields=id,updated_time,unread_count,participants,snippet,message_count&access_token=${accessToken}`;

      const resposta = await fetch(url);
      const json = await resposta.json().catch(() => null);

      expect(resposta.status).toBeGreaterThan(0);
      expect(json).not.toBeNull();
    });

    it("deve listar conversas recentes para verificar timestamp real", async () => {
      const url = `https://graph.instagram.com/v25.0/${igUserId}/conversations?fields=id,updated_time,unread_count,participants,snippet,message_count&limit=5&access_token=${accessToken}`;

      const resposta = await fetch(url);
      const json = await resposta.json().catch(() => null);

      expect(resposta.status).toBeGreaterThan(0);
      expect(json).not.toBeNull();
    });
  },
);
