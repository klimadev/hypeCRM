import { createHash, randomUUID } from "crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { badRequest, forbidden, ok } from "@/lib/api/http";

const CABECALHOS_SENSIVEIS = [
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-hub-signature",
  "x-hub-signature-256",
  "x-signature",
  "x-webhook-secret",
  "x-webhook-token",
];

const META_WEBHOOK_VERIFY_TOKEN_PADRAO = "hype";

function cabecalhoEhSensivel(nome: string) {
  const nomeNormalizado = nome.toLowerCase();

  return CABECALHOS_SENSIVEIS.includes(nomeNormalizado)
    || nomeNormalizado.includes("token")
    || nomeNormalizado.includes("secret")
    || nomeNormalizado.includes("signature");
}

function organizarCabecalhos(headers: Headers) {
  return Object.fromEntries(
    Array.from(headers.entries())
      .sort(([nomeA], [nomeB]) => nomeA.localeCompare(nomeB))
      .map(([nome, valor]) => [nome, cabecalhoEhSensivel(nome) ? "[oculto]" : valor]),
  );
}

function organizarQueryParams(searchParams: URLSearchParams) {
  const agrupados = new Map<string, string[]>();

  for (const [chave, valor] of searchParams.entries()) {
    const valoresAtuais = agrupados.get(chave) ?? [];
    valoresAtuais.push(valor);
    agrupados.set(chave, valoresAtuais);
  }

  return Object.fromEntries(
    Array.from(agrupados.entries()).map(([chave, valores]) => [chave, valores.length === 1 ? valores[0] : valores]),
  );
}

function extrairIps(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipsForwarded = forwardedFor
    ? forwardedFor.split(",").map((ip) => ip.trim()).filter(Boolean)
    : [];
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim();
  const ipPrincipal = ipsForwarded[0] ?? realIp ?? cfConnectingIp ?? "unknown";

  return {
    ipPrincipal,
    ipsForwarded,
    realIp: realIp ?? null,
    cfConnectingIp: cfConnectingIp ?? null,
  };
}

function gerarFingerprintOrigem(input: {
  ip: string;
  userAgent: string | null;
  origemHeader: string | null;
  referer: string | null;
  host: string;
}) {
  return createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
}

async function persistirLogWebhook(logWebhook: Record<string, unknown>) {
  const diretorioLogs = join(process.cwd(), "logs");
  const arquivoLogs = join(diretorioLogs, "webhook-events.log");

  await mkdir(diretorioLogs, { recursive: true });
  await appendFile(arquivoLogs, `${JSON.stringify(logWebhook)}\n`, "utf8");

  return arquivoLogs;
}

function detectarTipoBody(textoCorpo: string, tipoConteudo: string | null) {
  if (!textoCorpo) {
    return "sem-body";
  }

  if (tipoConteudo?.includes("application/json")) {
    return "json";
  }

  if (tipoConteudo?.includes("application/x-www-form-urlencoded")) {
    return "form-urlencoded";
  }

  if (tipoConteudo?.includes("multipart/form-data")) {
    return "multipart";
  }

  if (tipoConteudo?.includes("text/")) {
    return "texto";
  }

  return "desconhecido";
}

function tentarParseJson(textoCorpo: string) {
  if (!textoCorpo) {
    return {
      ehJsonValido: false,
      valor: null,
    };
  }

  try {
    return {
      ehJsonValido: true,
      valor: JSON.parse(textoCorpo) as unknown,
    };
  } catch {
    return {
      ehJsonValido: false,
      valor: null,
    };
  }
}

function organizarFormData(textoCorpo: string) {
  if (!textoCorpo) {
    return null;
  }

  const params = new URLSearchParams(textoCorpo);
  if (Array.from(params.keys()).length === 0) {
    return null;
  }

  return organizarQueryParams(params);
}

function obterTokenVerificacaoMeta() {
  return process.env.META_WEBHOOK_VERIFY_TOKEN
    ?? process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
    ?? META_WEBHOOK_VERIFY_TOKEN_PADRAO;
}

function responderValidacaoMeta(request: Request) {
  const url = new URL(request.url);
  const hubMode = url.searchParams.get("hub.mode");
  const hubChallenge = url.searchParams.get("hub.challenge");
  const hubVerifyToken = url.searchParams.get("hub.verify_token");

  if (!hubMode && !hubChallenge && !hubVerifyToken) {
    return null;
  }

  if (hubMode !== "subscribe" || !hubChallenge || !hubVerifyToken) {
    return badRequest("Parametros de validacao do webhook da Meta estao incompletos.");
  }

  const tokenConfigurado = obterTokenVerificacaoMeta();

  if (hubVerifyToken !== tokenConfigurado) {
    return forbidden("Token de verificacao do webhook invalido.");
  }

  return new NextResponse(hubChallenge, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

async function construirLogWebhook(request: Request) {
  const url = new URL(request.url);
  const recebidoEm = new Date().toISOString();
  const requestId = request.headers.get("x-request-id")?.trim() || randomUUID();
  const cabecalhos = organizarCabecalhos(request.headers);
  const queryParams = organizarQueryParams(url.searchParams);
  const tipoConteudo = request.headers.get("content-type");
  const textoCorpo = await request.text();
  const tipoBodyBase = detectarTipoBody(textoCorpo, tipoConteudo);
  const json = tentarParseJson(textoCorpo);
  const formData = tipoBodyBase === "form-urlencoded" ? organizarFormData(textoCorpo) : null;
  const tipoBody = tipoBodyBase === "json" && !json.ehJsonValido ? "json-invalido" : tipoBodyBase;
  const tamanhoBodyBytes = new TextEncoder().encode(textoCorpo).length;
  const ips = extrairIps(request);
  const userAgent = request.headers.get("user-agent");
  const origemHeader = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const fingerprintOrigem = gerarFingerprintOrigem({
    ip: ips.ipPrincipal,
    userAgent,
    origemHeader,
    referer,
    host: url.host,
  });

  return {
    requestId,
    recebidoEm,
    metodo: request.method,
    url: request.url,
    rota: url.pathname,
    origemUrl: url.origin,
    host: url.host,
    protocolo: url.protocol.replace(":", ""),
    query: {
      raw: url.search,
      total: Array.from(url.searchParams.entries()).length,
      params: queryParams,
    },
    cabecalhos: {
      total: Object.keys(cabecalhos).length,
      valores: cabecalhos,
    },
    origem: {
      ip: ips.ipPrincipal,
      ipsForwarded: ips.ipsForwarded,
      xRealIp: ips.realIp,
      cfConnectingIp: ips.cfConnectingIp,
      userAgent,
      origin: origemHeader,
      referer,
      fingerprint: fingerprintOrigem,
    },
    body: {
      tipo: tipoBody,
      tamanhoBytes: tamanhoBodyBytes,
      ehVazio: textoCorpo.length === 0,
      ehJsonValido: json.ehJsonValido,
      json: json.ehJsonValido ? json.valor : null,
      formData,
      raw: textoCorpo || null,
    },
  };
}

async function responderWebhook(request: Request) {
  const logWebhook = await construirLogWebhook(request);
  const arquivoPersistido = await persistirLogWebhook(logWebhook);

  console.info(`[webhook] requisicao recebida\n${JSON.stringify(logWebhook, null, 2)}`);

  return ok({
    ok: true,
    mensagem: "Webhook recebido e registrado para analise detalhada.",
    resumo: {
      requestId: String(logWebhook.requestId),
      recebidoEm: logWebhook.recebidoEm,
      metodo: logWebhook.metodo,
      url: logWebhook.url,
      rota: logWebhook.rota,
      tipoConteudo: request.headers.get("content-type"),
      tipoBody: logWebhook.body.tipo,
      bodyEhJsonValido: logWebhook.body.ehJsonValido,
      ip: logWebhook.origem.ip,
      fingerprintOrigem: logWebhook.origem.fingerprint,
      arquivoPersistido,
      totalCabecalhos: logWebhook.cabecalhos.total,
      totalQueryParams: logWebhook.query.total,
      tamanhoBodyBytes: logWebhook.body.tamanhoBytes,
    },
  });
}

export async function GET(request: Request) {
  const respostaValidacao = responderValidacaoMeta(request);

  if (respostaValidacao) {
    return respostaValidacao;
  }

  return responderWebhook(request);
}

export async function POST(request: Request) {
  return responderWebhook(request);
}

export async function PUT(request: Request) {
  return responderWebhook(request);
}

export async function PATCH(request: Request) {
  return responderWebhook(request);
}

export async function DELETE(request: Request) {
  return responderWebhook(request);
}

export async function OPTIONS(request: Request) {
  return responderWebhook(request);
}
