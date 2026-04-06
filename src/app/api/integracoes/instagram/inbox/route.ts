import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { listarInboxInstagram } from "@/lib/integracoes/instagram-inbox";
import { mensagemErroValidacao } from "@/lib/validacoes";
import { esquemaInstagramInboxQuery } from "@/lib/validacoes.instagram";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    return respostaSemPermissao();
  }

  const { searchParams } = new URL(request.url);
  const validacao = esquemaInstagramInboxQuery.safeParse({
    conversationId: searchParams.get("conversationId") ?? undefined,
  });

  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const inbox = await listarInboxInstagram(auth.sessao.id_empresa, validacao.data.conversationId ?? null);

  return NextResponse.json({
    ...inbox,
    selectedConversationId: inbox.selectedConversationId,
  });
}
