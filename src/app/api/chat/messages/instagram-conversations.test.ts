import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { listarInboxInstagram } from "@/lib/integracoes/instagram-inbox";
import { ErroInstagramApi } from "@/lib/integracoes/instagram-client";

/**
 * Teste de integracao real — consulta conversas do Instagram via Graph API.
 * Usa token e dados reais do banco de desenvolvimento.
 */
describe.skipIf(!process.env.TEST_INSTAGRAM_REAL)(
  "[INTEGRACAO] Consulta de conversas Instagram — diagnostico direto",
  () => {
    let idEmpresa: string;

    beforeAll(async () => {
      const conta = await prisma.instagramConta.findFirst({
        where: { status: "active" },
        orderBy: { atualizado_em: "desc" },
      });

      if (!conta) {
        throw new Error("Nenhuma conta do Instagram ativa encontrada no banco.");
      }

      idEmpresa = conta.id_empresa;
      console.log(`[TESTE] Conta ativa encontrada: ${conta.username} (id_empresa: ${idEmpresa})`);
    });

    it("deve listar conversas do Instagram com dados completos", async () => {
      console.log(`[TESTE] Consultando conversas do Instagram para empresa ${idEmpresa}...`);

      try {
        const resultado = await listarInboxInstagram(idEmpresa);

        console.log(`[TESTE] ✅ Resposta recebida!`);
        console.log(`[TESTE] Account:`, JSON.stringify(resultado.account, null, 2));
        console.log(`[TESTE] Total de conversas: ${resultado.conversations.length}`);
        console.log(`[TESTE] Conversa selecionada: ${resultado.selectedConversationId}`);
        console.log(`[TESTE] Mensagens carregadas: ${resultado.messages.length}`);

        if (resultado.conversations.length > 0) {
          console.log(`[TESTE] --- Detalhes das conversas ---`);
          resultado.conversations.forEach((conv, i) => {
            console.log(`[TESTE] [${i + 1}] ID: ${conv.id}`);
            console.log(`[TESTE]     Participant: ${conv.participant_name} (@${conv.participant_username})`);
            console.log(`[TESTE]     Participant ID: ${conv.participant_id}`);
            console.log(`[TESTE]     Ultima msg: ${conv.last_message_text?.substring(0, 80) ?? "(sem texto)"}`);
            console.log(`[TESTE]     Nao lidas: ${conv.unread_count} | Total msgs: ${conv.message_count}`);
            console.log(`[TESTE]     Atualizada em: ${conv.updated_at}`);
          });
        }

        if (resultado.messages.length > 0) {
          console.log(`[TESTE] --- Amostras de mensagens (primeiras 5) ---`);
          resultado.messages.slice(0, 5).forEach((msg, i) => {
            console.log(`[TESTE] [${i + 1}] ID: ${msg.id}`);
            console.log(`[TESTE]     From me: ${msg.from_me}`);
            console.log(`[TESTE]     Texto: ${msg.text?.substring(0, 100) ?? "(sem texto)"}`);
            console.log(`[TESTE]     Criada em: ${msg.created_at}`);
            console.log(`[TESTE]     Attachments: ${msg.attachments?.length ?? 0}`);
          });
        }

        expect(resultado.account).not.toBeNull();
        expect(Array.isArray(resultado.conversations)).toBe(true);
      } catch (erro) {
        console.log(`[TESTE] ❌ Falha ao consultar conversas:`);

        if (erro instanceof ErroInstagramApi) {
          console.log(`[TESTE] Tipo: ErroInstagramApi`);
          console.log(`[TESTE] Categoria: ${erro.categoria}`);
          console.log(`[TESTE] Status HTTP: ${erro.status}`);
          console.log(`[TESTE] Code: ${erro.code}`);
          console.log(`[TESTE] Subcode: ${erro.subcode}`);
          console.log(`[TESTE] Mensagem: ${erro.message}`);
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
