import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { listarInboxInstagram } from "@/lib/integracoes/instagram-inbox";

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
    });

    it("deve listar conversas do Instagram com dados completos", async () => {
      const resultado = await listarInboxInstagram(idEmpresa);

      expect(resultado.account).not.toBeNull();
      expect(Array.isArray(resultado.conversations)).toBe(true);
    });
  },
);
