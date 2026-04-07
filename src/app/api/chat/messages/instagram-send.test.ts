import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { enviarMensagemInstagram } from "@/lib/integracoes/instagram-inbox";
import { ErroInstagramApi } from "@/lib/integracoes/instagram-client";

/**
 * Teste de integracao real com o Instagram Graph API.
 *
 * Objetivo: descobrir o erro REAL que ocorre ao enviar mensagem,
 * sem mocks, para corrigir o tratamento de erros do sistema.
 *
 * Usa dados reais do banco de desenvolvimento.
 * Nao deve rodar em CI automatico — apenas local sob demanda.
 */
describe.skipIf(!process.env.TEST_INSTAGRAM_REAL)(
  "[INTEGRACAO] Envio de mensagem Instagram — diagnostico de erro real",
  () => {
    let idEmpresa: string;
    let conversationId: string;
    let participantId: string;

    beforeAll(async () => {
      const conta = await prisma.instagramConta.findFirst({
        where: { status: "active" },
        orderBy: { atualizado_em: "desc" },
      });

      if (!conta) {
        throw new Error("Nenhuma conta do Instagram ativa encontrada no banco de desenvolvimento.");
      }

      idEmpresa = conta.id_empresa;

      const msgExistente = await prisma.instagramMensagem.findFirst({
        where: { id_instagram_conta: conta.id },
        orderBy: { criado_em: "desc" },
      });

      if (!msgExistente) {
        throw new Error("Nenhuma conversa encontrada para a conta do Instagram ativa.");
      }

      conversationId = msgExistente.conversation_id;
      participantId = msgExistente.participant_id ?? "";
    });

    it("deve enviar mensagem de texto e retornar sucesso ou erro detalhado", async () => {
      const textoTeste = `Teste automatizado CRM ${new Date().toISOString()}`;

      try {
        const resultado = await enviarMensagemInstagram(
          idEmpresa,
          conversationId,
          textoTeste,
          participantId || undefined,
        );

        expect(resultado.success).toBe(true);
        expect(resultado.message_id).toBeDefined();
      } catch (erro) {
        if (erro instanceof ErroInstagramApi) {
          expect(erro.categoria).toBeDefined();
          expect(erro.status).toBeDefined();
          expect(erro.message).toBeDefined();
        }

        throw erro;
      }
    });

    it("deve retornar erro claro quando conversationId for invalido", async () => {
      await expect(
        enviarMensagemInstagram(
          idEmpresa,
          "conversation_id_inexistente_12345",
          "Mensagem de teste com ID invalido",
        ),
      ).rejects.toBeInstanceOf(Error);
    });
  },
);
