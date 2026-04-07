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
      // Busca conta ativa do Instagram no banco
      const conta = await prisma.instagramConta.findFirst({
        where: { status: "active" },
        orderBy: { atualizado_em: "desc" },
      });

      if (!conta) {
        throw new Error("Nenhuma conta do Instagram ativa encontrada no banco de desenvolvimento.");
      }

      idEmpresa = conta.id_empresa;

      // Busca uma conversa existente para usar no teste
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

      console.log(`[TESTE] Tentando enviar mensagem para Instagram...`);
      console.log(`[TESTE] idEmpresa: ${idEmpresa}`);
      console.log(`[TESTE] conversationId: ${conversationId}`);
      console.log(`[TESTE] participantId: ${participantId}`);
      console.log(`[TESTE] Texto: ${textoTeste}`);

      try {
        const resultado = await enviarMensagemInstagram(
          idEmpresa,
          conversationId,
          textoTeste,
          participantId || undefined,
        );

        console.log(`[TESTE] ✅ Envio realizado com sucesso!`);
        console.log(`[TESTE] Resultado:`, JSON.stringify(resultado, null, 2));

        expect(resultado.success).toBe(true);
        expect(resultado.message_id).toBeDefined();
      } catch (erro) {
        console.log(`[TESTE] ❌ Envio falhou — capturando erro real:`);

        if (erro instanceof ErroInstagramApi) {
          console.log(`[TESTE] Tipo: ErroInstagramApi`);
          console.log(`[TESTE] Categoria: ${erro.categoria}`);
          console.log(`[TESTE] Status HTTP: ${erro.status}`);
          console.log(`[TESTE] Code: ${erro.code}`);
          console.log(`[TESTE] Subcode: ${erro.subcode}`);
          console.log(`[TESTE] Mensagem: ${erro.message}`);
          console.log(`[TESTE] Deve desativar token: ${erro.deveDesativarToken}`);

          expect(erro.categoria).toBeDefined();
          expect(erro.status).toBeDefined();
          expect(erro.message).toBeDefined();
        } else if (erro instanceof Error) {
          console.log(`[TESTE] Tipo: Error generico`);
          console.log(`[TESTE] Nome: ${erro.name}`);
          console.log(`[TESTE] Mensagem: ${erro.message}`);
          console.log(`[TESTE] Stack (primeiras 5 linhas):`);
          erro.stack?.split("\n").slice(0, 5).forEach((linha) => {
            console.log(`[TESTE]   ${linha}`);
          });
        } else {
          console.log(`[TESTE] Tipo desconhecido:`, erro);
        }

        // Falha o teste propositalmente para ver o erro no output
        throw erro;
      }
    });

    it("deve retornar erro claro quando conversationId for invalido", async () => {
      console.log(`[TESTE] Testando com conversationId invalido...`);

      try {
        await enviarMensagemInstagram(
          idEmpresa,
          "conversation_id_inexistente_12345",
          "Mensagem de teste com ID invalido",
        );

        // Se chegou aqui sem erro, algo inesperado aconteceu
        console.log(`[TESTE] ⚠️ Nenhum erro lancado com ID invalido — comportamento inesperado`);
      } catch (erro) {
        console.log(`[TESTE] ❌ Erro com ID invalido capturado:`);

        if (erro instanceof ErroInstagramApi) {
          console.log(`[TESTE] Categoria: ${erro.categoria}`);
          console.log(`[TESTE] Status: ${erro.status}`);
          console.log(`[TESTE] Mensagem: ${erro.message}`);
        } else if (erro instanceof Error) {
          console.log(`[TESTE] Mensagem: ${erro.message}`);
        }

        throw erro;
      }
    });
  },
);
