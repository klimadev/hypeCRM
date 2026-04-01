import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { obterSessaoNaRequest } from "@/lib/autenticacao";
import { registrarCallbackOAuthInstagram, responderHtmlInstagram, validarQueryOAuthInstagram } from "@/lib/integracoes/instagram-callbacks";
import {
  calcularExpiracaoTokenInstagram,
  ESCOPOS_INSTAGRAM,
  limparCookieEstadoOAuthInstagram,
  NOME_COOKIE_INSTAGRAM_OAUTH_STATE,
  obterConfiguracaoInstagramOAuth,
  obterPerfilInstagram,
  trocarCodePorTokenInstagram,
  trocarPorTokenLongaDuracaoInstagram,
  validarEstadoOAuthInstagram,
} from "@/lib/integracoes/instagram-oauth";
import { prisma } from "@/lib/prisma";

function responderFalhaOAuthInstagram(input: {
  titulo: string;
  descricao: string;
  detalhes?: Array<{ label: string; valor: string }>;
}) {
  const resposta = responderHtmlInstagram({
    ...input,
    acao: { href: "/integracoes/instagram", label: "Voltar para a integracao" },
  });
  limparCookieEstadoOAuthInstagram(resposta);
  return resposta;
}

function obterCookieDaRequest(request: NextRequest, nome: string) {
  const cookieViaNext = request.cookies?.get(nome)?.value;
  if (cookieViaNext) {
    return cookieViaNext;
  }

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const cookie = cookies.find((item) => item.startsWith(`${nome}=`));
  return cookie ? decodeURIComponent(cookie.slice(nome.length + 1)) : undefined;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const validacao = validarQueryOAuthInstagram(url.searchParams);

  registrarCallbackOAuthInstagram(request, {
    code: url.searchParams.get("code") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    error: url.searchParams.get("error") ?? undefined,
    error_reason: url.searchParams.get("error_reason") ?? undefined,
    error_description: url.searchParams.get("error_description") ?? undefined,
  });

  if (!validacao.ok) {
    return validacao.response;
  }

  if (validacao.data.error) {
    return responderFalhaOAuthInstagram({
      titulo: "Conexao com Instagram interrompida",
      descricao: "A Meta devolveu o callback sem concluir a autorizacao da conta.",
      detalhes: [
        { label: "Status", valor: "Fluxo interrompido pela Meta ou pelo usuario" },
        { label: "Codigo de erro", valor: validacao.data.error },
        { label: "Motivo", valor: validacao.data.error_reason ?? "Nao informado" },
      ],
    });
  }

  const stateRecebido = validacao.data.state;
  const stateCookie = obterCookieDaRequest(request, NOME_COOKIE_INSTAGRAM_OAUTH_STATE);

  if (!stateRecebido || !stateCookie || stateRecebido !== stateCookie) {
    return responderFalhaOAuthInstagram({
      titulo: "Conexao expirada",
      descricao: "Nao foi possivel validar o retorno do Instagram com seguranca. Tente conectar novamente pelo CRM.",
      detalhes: [{ label: "Status", valor: "State OAuth invalido ou expirado" }],
    });
  }

  const estado = await validarEstadoOAuthInstagram(stateRecebido);
  if (!estado) {
    return responderFalhaOAuthInstagram({
      titulo: "Conexao expirada",
      descricao: "O state desta autorizacao nao e mais valido. Gere uma nova conexao pelo CRM.",
      detalhes: [{ label: "Status", valor: "State OAuth expirado" }],
    });
  }

  const sessao = await obterSessaoNaRequest(request);
  if (!sessao) {
    return responderFalhaOAuthInstagram({
      titulo: "Sessao nao encontrada",
      descricao: "Entramos no callback do Instagram, mas a sessao do CRM nao estava disponivel para vincular a conta.",
      detalhes: [{ label: "Status", valor: "Faca login novamente e reconecte a conta" }],
    });
  }

  if (
    sessao.id_empresa !== estado.id_empresa
    || sessao.id_usuario !== estado.id_usuario
    || sessao.perfil !== estado.perfil
  ) {
    return responderFalhaOAuthInstagram({
      titulo: "Conexao recusada",
      descricao: "O retorno do Instagram nao corresponde ao usuario que iniciou a conexao no CRM.",
      detalhes: [{ label: "Status", valor: "State OAuth nao corresponde a sessao atual" }],
    });
  }

  if (sessao.perfil !== "EMPRESA" && sessao.perfil !== "GERENTE") {
    return responderFalhaOAuthInstagram({
      titulo: "Sem permissao para conectar",
      descricao: "A conexao do Instagram fica disponivel apenas para perfis de gestao.",
    });
  }

  try {
    let tokenCurto: { access_token: string };
    try {
      tokenCurto = await trocarCodePorTokenInstagram(validacao.data.code!);
    } catch (erroTroca) {
      const msg = erroTroca instanceof Error ? erroTroca.message : "Erro desconhecido";
      console.error("[Instagram OAuth] Falha ao trocar code por token:", msg);
      return responderFalhaOAuthInstagram({
        titulo: "Falha ao trocar code por token",
        descricao: "Nao foi possivel obter o token de acesso curto com o Instagram.",
        detalhes: [
          { label: "Erro", valor: msg },
          { label: "Etapa", valor: "1 de 3 - Troca do authorization code" },
          { label: "Endpoint", valor: "POST https://api.instagram.com/oauth/access_token" },
          { label: "Client ID", valor: obterConfiguracaoInstagramOAuth().clientId },
          { label: "Redirect URI", valor: obterConfiguracaoInstagramOAuth().redirectUri },
        ],
      });
    }

    let tokenLongo: { access_token: string; token_type?: string; expires_in?: number };
    try {
      tokenLongo = await trocarPorTokenLongaDuracaoInstagram(tokenCurto.access_token);
    } catch (erroLongo) {
      const msg = erroLongo instanceof Error ? erroLongo.message : "Erro desconhecido";
      console.error("[Instagram OAuth] Falha ao obter token longo:", msg);
      return responderFalhaOAuthInstagram({
        titulo: "Falha ao obter token de longa duracao",
        descricao: "O token curto foi obtido, mas a conversao para token longo falhou.",
        detalhes: [
          { label: "Erro", valor: msg },
          { label: "Etapa", valor: "2 de 3 - Troca por token longo (60 dias)" },
          { label: "Endpoint", valor: "GET https://graph.instagram.com/access_token" },
        ],
      });
    }

    let perfil: { id: string; username: string; name?: string; account_type?: string; profile_picture_url?: string };
    try {
      perfil = await obterPerfilInstagram(tokenLongo.access_token);
    } catch (erroPerfil) {
      const msg = erroPerfil instanceof Error ? erroPerfil.message : "Erro desconhecido";
      console.error("[Instagram OAuth] Falha ao obter perfil:", msg);
      return responderFalhaOAuthInstagram({
        titulo: "Falha ao carregar perfil do Instagram",
        descricao: "O token foi obtido, mas nao foi possivel ler os dados do perfil.",
        detalhes: [
          { label: "Erro", valor: msg },
          { label: "Etapa", valor: "3 de 3 - Leitura do perfil" },
          { label: "Endpoint", valor: "GET https://graph.instagram.com/v24.0/me" },
          { label: "Token (inicio)", valor: tokenLongo.access_token.slice(0, 20) + "..." },
        ],
      });
    }

    const conta = await prisma.instagramConta.upsert({
      where: {
        id_empresa_instagram_user_id: {
          id_empresa: sessao.id_empresa,
          instagram_user_id: perfil.id,
        },
      },
      create: {
        id: randomUUID(),
        id_empresa: sessao.id_empresa,
        id_criador: sessao.id_usuario,
        nome: perfil.name ?? perfil.username,
        instagram_user_id: perfil.id,
        username: perfil.username,
        account_type: perfil.account_type ?? null,
        profile_picture_url: perfil.profile_picture_url ?? null,
        access_token: tokenLongo.access_token,
        token_type: tokenLongo.token_type ?? null,
        escopos: ESCOPOS_INSTAGRAM.join(","),
        expires_at: calcularExpiracaoTokenInstagram(tokenLongo.expires_in),
        status: "active",
      },
      update: {
        id_criador: sessao.id_usuario,
        nome: perfil.name ?? perfil.username,
        username: perfil.username,
        account_type: perfil.account_type ?? null,
        profile_picture_url: perfil.profile_picture_url ?? null,
        access_token: tokenLongo.access_token,
        token_type: tokenLongo.token_type ?? null,
        escopos: ESCOPOS_INSTAGRAM.join(","),
        expires_at: calcularExpiracaoTokenInstagram(tokenLongo.expires_in),
        status: "active",
        atualizado_em: new Date(),
      },
    });

    const resposta = responderHtmlInstagram({
      titulo: "Conta conectada",
      descricao: "A conta do Instagram foi vinculada ao CRM com sucesso e ja aparece na area de integracoes.",
      detalhes: [
        { label: "Conta", valor: conta.nome },
        { label: "Username", valor: `@${conta.username}` },
        { label: "Status", valor: "Conectada e salva no CRM" },
      ],
      acao: { href: "/integracoes/instagram", label: "Ver conta conectada" },
    });
    limparCookieEstadoOAuthInstagram(resposta);
    return resposta;
  } catch (erro) {
    const msg = erro instanceof Error ? erro.message : "Erro desconhecido";
    const stack = erro instanceof Error ? (erro.stack ?? "").split("\n").slice(0, 3).join(" | ") : "";
    console.error("[Instagram OAuth] Erro inesperado no callback:", msg, stack);
    return responderFalhaOAuthInstagram({
      titulo: "Falha ao conectar Instagram",
      descricao: msg,
      detalhes: [
        { label: "Status", valor: "Erro inesperado no fluxo de conexao" },
        { label: "Detalhe", valor: stack || msg },
      ],
    });
  }
}
