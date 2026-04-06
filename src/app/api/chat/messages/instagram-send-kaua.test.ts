import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { enviarMensagemInstagram } from "@/lib/integracoes/instagram-inbox";
import { ErroInstagramApi } from "@/lib/integracoes/instagram-client";

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
      console.log(`[TESTE] Conta ativa: ${conta.username} (id_empresa: ${idEmpresa})`);
      console.log(`[TESTE] Destinatario: @000_kaua000 (participant_id: ${participantId})`);
      console.log(`[TESTE] Conversation: ${conversationId}`);
    });

    it("deve enviar mensagem de texto para @000_kaua000 com sucesso", async () => {
      const texto = `Teste automatizado CRM ${new Date().toISOString()}`;

      console.log(`[TESTE] Enviando: "${texto}"`);

      try {
        const resultado = await enviarMensagemInstagram(
          idEmpresa,
          conversationId,
          texto,
          participantId,
        );

        console.log(`[TESTE] ✅ Envio realizado com sucesso!`);
        console.log(`[TESTE] message_id: ${resultado.message_id}`);
        console.log(`[TESTE] recipient_id: ${resultado.recipient_id}`);
        console.log(`[TESTE] success: ${resultado.success}`);
        console.log(`[TESTE] Resposta completa:`, JSON.stringify(resultado, null, 2));

        expect(resultado.success).toBe(true);
        expect(resultado.message_id).toBeDefined();
        expect(resultado.message_id).not.toBe("");
        expect(resultado.recipient_id).toBe(participantId);
      } catch (erro) {
        console.log(`[TESTE] ❌ Envio falhou — diagnostico completo:`);

        if (erro instanceof ErroInstagramApi) {
          console.log(`[TESTE] Tipo: ErroInstagramApi`);
          console.log(`[TESTE] Categoria: ${erro.categoria}`);
          console.log(`[TESTE] Status HTTP: ${erro.status}`);
          console.log(`[TESTE] Code: ${erro.code}`);
          console.log(`[TESTE] Subcode: ${erro.subcode}`);
          console.log(`[TESTE] Mensagem: ${erro.message}`);
          console.log(`[TESTE] Desativar token: ${erro.deveDesativarToken}`);
        } else if (erro instanceof Error) {
          console.log(`[TESTE] Tipo: ${erro.name}`);
          console.log(`[TESTE] Mensagem: ${erro.message}`);
          erro.stack?.split("\n").slice(0, 6).forEach((l) => console.log(`[TESTE]   ${l}`));
        } else {
          console.log(`[TESTE] Tipo desconhecido:`, erro);
        }

        throw erro;
      }
    });
  },
);
