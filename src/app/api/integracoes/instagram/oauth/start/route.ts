import { NextRequest, NextResponse } from "next/server";
import { responderHtmlInstagram } from "@/lib/integracoes/instagram-callbacks";
import { criarEstadoOAuthInstagram, definirCookieEstadoOAuthInstagram, montarUrlAutorizacaoInstagram, obterConfiguracaoInstagramOAuth } from "@/lib/integracoes/instagram-oauth";
import { exigirSessao } from "@/lib/permissoes";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    return responderHtmlInstagram({
      titulo: "Sem permissao para conectar",
      descricao: "A conexao do Instagram fica disponivel apenas para perfis de gestao.",
      acao: { href: "/integracoes", label: "Voltar para integracoes" },
    });
  }

  const { clientSecret } = obterConfiguracaoInstagramOAuth();

  if (!clientSecret) {
    return responderHtmlInstagram({
      titulo: "Configuracao incompleta do Instagram",
      descricao: "O aplicativo da Meta ainda nao tem o segredo configurado neste ambiente.",
      acao: { href: "/integracoes/instagram", label: "Voltar para Instagram" },
    });
  }

  const estado = await criarEstadoOAuthInstagram(auth.sessao);
  const resposta = NextResponse.redirect(montarUrlAutorizacaoInstagram(estado));
  definirCookieEstadoOAuthInstagram(resposta, estado);
  return resposta;
}
