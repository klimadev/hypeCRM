import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { obterSessaoNaRequest } from "@/lib/autenticacao";
import { registrarCallbackOAuthInstagram, responderHtmlInstagram, validarQueryOAuthInstagram } from "@/lib/integracoes/instagram-callbacks";
import {
  calcularExpiracaoTokenInstagram,
  ESCOPOS_INSTAGRAM,
  limparCookieEstadoOAuthInstagram,
  NOME_COOKIE_INSTAGRAM_OAUTH_STATE,
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
    const tokenCurto = await trocarCodePorTokenInstagram(validacao.data.code!);
    const tokenLongo = await trocarPorTokenLongaDuracaoInstagram(tokenCurto.access_token);
    const perfil = await obterPerfilInstagram(tokenLongo.access_token);

    const conta = await prisma.instagramConta.upsert({
      where: {
        id_empresa_instagram_user_id: {
          id_empresa: sessao.id_empresa,
          instagram_user_id: perfil.user_id,
        },
      },
      create: {
        id: randomUUID(),
        id_empresa: sessao.id_empresa,
        id_criador: sessao.id_usuario,
        nome: perfil.name ?? perfil.username,
        instagram_user_id: perfil.user_id,
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
    return responderFalhaOAuthInstagram({
      titulo: "Falha ao conectar Instagram",
      descricao: erro instanceof Error ? erro.message : "Nao foi possivel concluir a conexao agora.",
      detalhes: [{ label: "Status", valor: "Nenhuma conta foi salva com esse retorno" }],
    });
  }
}
