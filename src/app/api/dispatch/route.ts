import { NextRequest } from "next/server";
import { processarDispatch } from "@/lib/automacoes/dispatcher";
import { esquemaDispatchQuery } from "@/lib/validacoes";
import { validateQuery } from "@/lib/api/route-validation";
import { ok, badRequest } from "@/lib/api/http";
import { withPerfis } from "@/lib/api/route-guards";

export async function POST(request: NextRequest) {
  return withPerfis(request, ["EMPRESA", "GERENTE"], async ({ sessao }) => {
    const url = new URL(request.url);
    const params = {
      only: url.searchParams.get("only") || undefined,
      automacao_id: url.searchParams.get("automacao_id") || undefined,
      teste: url.searchParams.get("teste") || undefined,
      lead_id: url.searchParams.get("lead_id") || undefined,
    };

    const validacao = validateQuery(esquemaDispatchQuery, params);
    if (!validacao.ok) return validacao.response;

    try {
      const resultado = await processarDispatch({
        only: validacao.data.only as "whatsapp" | undefined,
        id_empresa: sessao.id_empresa,
        automacao_id: validacao.data.automacao_id,
        teste: validacao.data.teste === "true",
        lead_id: validacao.data.lead_id,
      });

      return ok(resultado, 200, true);
    } catch (error) {
      console.error("Erro no dispatch:", error);
      return badRequest(`Erro ao processar dispatch: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  });
}
