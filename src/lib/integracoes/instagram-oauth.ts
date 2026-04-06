import { randomUUID } from "crypto";
import { lookup } from "dns";
import { Agent as HttpsAgent, request as httpsRequest } from "https";
import { SignJWT, jwtVerify } from "jose";
import type { NextResponse } from "next/server";
import type { SessaoToken } from "@/lib/tipos";
import { esquemaInstagramOAuthState } from "@/lib/validacoes";

const INSTAGRAM_CLIENT_ID_PADRAO = "1471383481007483";
const INSTAGRAM_REDIRECT_URI_PADRAO = "https://app.hypecrm.com.br/api/integracoes/instagram/oauth/callback";

export const NOME_COOKIE_INSTAGRAM_OAUTH_STATE = "hype_instagram_oauth_state";

export const ESCOPOS_INSTAGRAM = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
] as const;

type TokenCurtaDuracaoInstagram = {
  access_token: string;
  user_id?: string | number;
};

type TokenLongaDuracaoInstagram = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type PerfilInstagram = {
  id: string;
  username: string;
  name?: string;
  account_type?: string;
  profile_picture_url?: string;
};

const agenteHttps = new HttpsAgent({ keepAlive: true });

function obterSegredoJwt() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "segredo-dev-trocar-em-producao");
}

export function obterConfiguracaoInstagramOAuth() {
  const clientId = process.env.INSTAGRAM_APP_ID?.trim() || process.env.META_APP_ID?.trim() || INSTAGRAM_CLIENT_ID_PADRAO;
  const clientSecret = process.env.INSTAGRAM_APP_SECRET?.trim() || process.env.META_APP_SECRET?.trim() || null;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI?.trim() || INSTAGRAM_REDIRECT_URI_PADRAO;

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export async function criarEstadoOAuthInstagram(sessao: SessaoToken) {
  return new SignJWT({
    id_empresa: sessao.id_empresa,
    id_usuario: sessao.id_usuario,
    perfil: sessao.perfil,
    nonce: randomUUID(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(obterSegredoJwt());
}

export async function validarEstadoOAuthInstagram(estado: string) {
  try {
    const { payload } = await jwtVerify(estado, obterSegredoJwt());
    const validacao = esquemaInstagramOAuthState.safeParse(payload);
    return validacao.success ? validacao.data : null;
  } catch {
    return null;
  }
}

export function montarUrlAutorizacaoInstagram(estado: string) {
  const { clientId, redirectUri } = obterConfiguracaoInstagramOAuth();
  const url = new URL("https://www.instagram.com/oauth/authorize");

  url.searchParams.set("force_reauth", "true");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", ESCOPOS_INSTAGRAM.join(","));
  url.searchParams.set("state", estado);

  return url.toString();
}

export function definirCookieEstadoOAuthInstagram(resposta: NextResponse, estado: string) {
  resposta.cookies.set(NOME_COOKIE_INSTAGRAM_OAUTH_STATE, estado, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 10,
  });
}

export function limparCookieEstadoOAuthInstagram(resposta: NextResponse) {
  resposta.cookies.set(NOME_COOKIE_INSTAGRAM_OAUTH_STATE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: new Date(0),
  });
}

async function lerJsonOuErro<T>(resposta: Response, mensagemPadrao: string): Promise<T> {
  const json = await resposta.json().catch(() => null);

  if (!resposta.ok || !json) {
    const corpoBruto = json ? JSON.stringify(json) : "(corpo nao JSON)";
    const mensagem = typeof json === "object" && json !== null && "error_message" in json
      ? String(json.error_message)
      : typeof json === "object" && json !== null && "error" in json
        ? String(json.error)
        : typeof json === "object" && json !== null && "message" in json
          ? String(json.message)
          : mensagemPadrao;
    throw new Error(`${mensagem} (HTTP ${resposta.status}) — ${corpoBruto.slice(0, 300)}`);
  }

  return json as T;
}

function resolverIp(host: string): Promise<string> {
  return new Promise((resolve, reject) => {
    lookup(host, { family: 4 }, (err, address) => {
      if (err) reject(err);
      else resolve(address);
    });
  });
}

async function fetchComDns(url: URL, options?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<Response> {
  const ip = await resolverIp(url.hostname);

  return new Promise((resolve, reject) => {
    const timeoutMs = 15000;

    const req = httpsRequest({
      host: ip,
      port: 443,
      path: url.pathname + url.search,
      method: options?.method ?? "GET",
      headers: {
        Host: url.hostname,
        ...options?.headers,
        ...(options?.body ? {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(options.body).toString(),
        } : {}),
      },
      agent: agenteHttps,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks);
        resolve(new Response(body, {
          status: res.statusCode ?? 500,
          headers: res.headers as Record<string, string>,
        }));
      });
    });

    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Timeout (${timeoutMs}ms) ao conectar em ${url.hostname} via ${ip}`));
    });

    if (options?.body) {
      req.write(options.body);
    }

    req.end();
  });
}

export async function trocarCodePorTokenInstagram(code: string) {
  const { clientId, clientSecret, redirectUri } = obterConfiguracaoInstagramOAuth();

  if (!clientSecret) {
    throw new Error("INSTAGRAM_APP_SECRET nao configurado.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  }).toString();

  console.info("[Instagram OAuth] Trocando code por token curto:", {
    client_id: clientId,
    redirect_uri: redirectUri,
    code_length: code.length,
  });

  const url = new URL("https://api.instagram.com/oauth/access_token");
  const resposta = await fetchComDns(url, { method: "POST", body });

  console.info("[Instagram OAuth] Resposta troca code:", {
    status: resposta.status,
    statusText: resposta.statusText,
    ok: resposta.ok,
  });

  return lerJsonOuErro<TokenCurtaDuracaoInstagram>(resposta, "Nao foi possivel trocar o code do Instagram.");
}

export async function trocarPorTokenLongaDuracaoInstagram(accessToken: string) {
  const { clientSecret } = obterConfiguracaoInstagramOAuth();

  if (!clientSecret) {
    throw new Error("INSTAGRAM_APP_SECRET nao configurado.");
  }

  const url = new URL("https://graph.instagram.com/access_token");
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("access_token", accessToken);

  console.info("[Instagram OAuth] Trocando token curto por longo...");

  const resposta = await fetchComDns(url);

  console.info("[Instagram OAuth] Resposta troca token longo:", {
    status: resposta.status,
    statusText: resposta.statusText,
    ok: resposta.ok,
  });

  return lerJsonOuErro<TokenLongaDuracaoInstagram>(resposta, "Nao foi possivel gerar o token de longa duracao do Instagram.");
}

export async function obterPerfilInstagram(accessToken: string) {
  const url = new URL("https://graph.instagram.com/v24.0/me");
  url.searchParams.set("fields", "id,username,name,account_type,profile_picture_url");
  url.searchParams.set("access_token", accessToken);

  console.info("[Instagram OAuth] Busando perfil do Instagram...");

  const resposta = await fetchComDns(url);

  console.info("[Instagram OAuth] Resposta perfil:", {
    status: resposta.status,
    statusText: resposta.statusText,
    ok: resposta.ok,
  });

  return lerJsonOuErro<PerfilInstagram>(resposta, "Nao foi possivel carregar o perfil conectado do Instagram.");
}

export function calcularExpiracaoTokenInstagram(expiresIn?: number) {
  if (!expiresIn || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    return null;
  }

  return new Date(Date.now() + expiresIn * 1000);
}
