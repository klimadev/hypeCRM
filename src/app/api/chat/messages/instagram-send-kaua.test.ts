import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { enviarMensagemInstagram } from "@/lib/integracoes/instagram-inbox";

/**
 * Teste de integracao real — envio de mensagem para @000_kaua000.
 * Usa token e dados reais do banco de desenvolvimento.
 */
describe.skipIf(!process.env.TEST_INSTAGRAM_REAL)(
  "[INTEGRACAO] Envio de mensagem para @000_kaua000",
  () => {
    let idEmpresa: string;
    const conversationId = "aWdfZAG06MzQwMjgyMzY2ODQxNzEwMzAxMjQ0MjU5OTA5MzU5NDg4MzY5Mjg0";
    const participantId = "1602510301006188";

    beforeAll(async () => {
      const conta = await prisma.instagramConta.findFirst({
        where: { status: "active" },
        orderBy: { atualizado_em: "desc" },
      });

      if (!conta) {
        throw new Error("Nenhuma conta do Instagram ativa encontrada no banco.");
      }

      idEmpresa = conta.id_empresa;
    });

    it("deve enviar mensagem de texto para @000_kaua000 com sucesso", async () => {
      const texto = `Teste automatizado CRM ${new Date().toISOString()}`;

      const resultado = await enviarMensagemInstagram(
        idEmpresa,
        conversationId,
        texto,
        participantId,
      );

      expect(resultado.success).toBe(true);
      expect(resultado.message_id).toBeDefined();
      expect(resultado.message_id).not.toBe("");
      expect(resultado.recipient_id).toBe(participantId);
    });
  },
);
