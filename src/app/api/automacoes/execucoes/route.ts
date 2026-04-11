import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { handleRouteError } from "@/lib/api/route-errors";
import { listarExecucoesWorkspace } from "@/lib/automacoes";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 50;

  try {
    const execucoes = await listarExecucoesWorkspace(auth.sessao.id_empresa, Number.isFinite(limit) ? limit : 50);

    return NextResponse.json({ execucoes });
  } catch (erro) {
    return handleRouteError(erro, "Erro ao carregar execucoes.", "Erro ao carregar execucoes:");
  }
}
