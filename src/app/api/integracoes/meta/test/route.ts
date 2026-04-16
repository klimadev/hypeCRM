import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";

type MetaTestBody = { data?: Array<Record<string, unknown>>; test_event_code?: string };

type MetaEventPayload = {
  event_name: string;
  event_time: number;
  action_source: "system_generated";
  event_id: string;
  user_data: {
    external_id: string;
    client_ip_address: string;
    client_user_agent: string;
  };
  custom_data: {
    lead_event_source: string;
    event_source: "crm";
  };
};

const META_GRAPH_API_VERSION = "v25.0";
const DEFAULT_TEST_IP = "127.0.0.1";
const DEFAULT_TEST_USER_AGENT = "hypecrm-meta-capi-test/1.0";

function obterIpCliente(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0]?.trim();
    if (ip) return ip;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || DEFAULT_TEST_IP;
}

function criarPayloadPadraoTeste(request: NextRequest, idEmpresa: string, eventName?: string): { data: MetaEventPayload[] } {
  const agora = Math.floor(Date.now() / 1000);
  return {
    data: [
      {
        event_name: eventName?.trim() || "Lead",
        event_time: agora,
        action_source: "system_generated",
        event_id: `meta-test-${idEmpresa}-${agora}`,
        user_data: {
          external_id: `empresa:${idEmpresa}`,
          client_ip_address: obterIpCliente(request),
          client_user_agent: request.headers.get("user-agent")?.trim() || DEFAULT_TEST_USER_AGENT,
        },
        custom_data: {
          lead_event_source: "CRM HYPE",
          event_source: "crm",
        },
      },
    ],
  };
}

export function criarPayloadTesteMeta(request: NextRequest, idEmpresa: string, configEventName?: string, body?: MetaTestBody): { data: Array<Record<string, unknown>>; test_event_code?: string } {
  if (body?.data?.length) {
    return {
      data: body.data,
      ...(body.test_event_code ? { test_event_code: body.test_event_code } : {}),
    };
  }

  return criarPayloadPadraoTeste(request, idEmpresa, configEventName);
}

export async function POST(request: NextRequest) {
  console.log("[META-TEST] === INICIANDO TESTE DE CONEXÃO ===");
  console.log("[META-TEST] Request URL:", request.url);
  console.log("[META-TEST] Request method:", request.method);

  const auth = await exigirSessao(request);
  console.log("[META-TEST] Auth result:", { erro: auth.erro, perfil: auth.sessao?.perfil });

  if (auth.erro) {
    console.log("[META-TEST] ERRO: Auth falhou");
    return auth.erro;
  }

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    console.log("[META-TEST] ERRO: Sem permissão. Perfil:", auth.sessao.perfil);
    return respostaSemPermissao();
  }

  const idEmpresa = auth.sessao.id_empresa;
  console.log("[META-TEST] ID Empresa:", idEmpresa);

  let body: MetaTestBody = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  console.log("[META-TEST] Body recebido:", JSON.stringify(body));

  console.log("[META-TEST] Buscando config no banco...");
  const config = await prisma.metaCapiConfig.findUnique({
    where: { id_empresa: idEmpresa },
  });

  console.log("[META-TEST] Config encontrada:", JSON.stringify(config, null, 2));

  if (!config?.pixel_id || !config?.access_token) {
    console.log("[META-TEST] ERRO: Pixel ID ou Access Token ausente");
    console.log("[META-TEST] - pixel_id:", config?.pixel_id ? "presente" : "vazio");
    console.log("[META-TEST] - access_token:", config?.access_token ? "presente" : "vazio");

    const response = {
      ok: false,
      erro: "Configure o Pixel ID e Access Token antes de testar.",
    };
    console.log("[META-TEST] Retorno erro:", JSON.stringify(response));
    return NextResponse.json(response);
  }

  const payload = criarPayloadTesteMeta(request, idEmpresa, config.event_name, body);

  let rawResponse = "";
  let metaHttpStatus = 200;
  try {
    const metaApiUrl = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${config.pixel_id}/events?access_token=${config.access_token}`;
    console.log("[META-TEST] Meta API URL:", metaApiUrl);
    console.log("[META-TEST] Payload enviado:", JSON.stringify(payload));
    const metaResponse = await fetch(metaApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    rawResponse = await metaResponse.text();
    metaHttpStatus = metaResponse.status;
    console.log("[META-TEST] Raw API Response:", rawResponse);
    console.log("[META-TEST] HTTP Status:", metaHttpStatus);
  } catch (err) {
    console.log("[META-TEST] Falha ao buscar dados do Meta:", err);
  }

  type MetaErrorResponse = {
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
};

type MetaSuccessResponse = {
  events_received?: number;
  messages?: Array<unknown>;
  fbtrace_id?: string;
};

function parseMetaResponse(raw: string): { sucesso: boolean; dados: MetaSuccessResponse | null; erro: MetaErrorResponse["error"] | null } {
  try {
    const parsed = JSON.parse(raw) as MetaErrorResponse | MetaSuccessResponse;
    if ("events_received" in parsed && parsed.events_received != null) {
      return { sucesso: true, dados: parsed as MetaSuccessResponse, erro: null };
    }
    if ("error" in parsed) {
      return { sucesso: false, dados: null, erro: parsed.error };
    }
    return { sucesso: false, dados: null, erro: null };
  } catch {
    return { sucesso: false, dados: null, erro: null };
  }
}

function classificarErroMeta(erro: MetaErrorResponse["error"] | null, httpStatus: number): { tipo: string; mensagem: string } {
  if (!erro) {
    return { tipo: "desconhecido", mensagem: "Resposta inválida ou vazia da Meta." };
  }

  if (erro.code === 190 || erro.error_subcode === 490) {
    return { tipo: "token_invalido", mensagem: "Token de acesso expirado ou revokeado. Gere um novo Access Token no Gerenciador de Eventos." };
  }

  if (erro.code === 100 && erro.error_subcode === 2804050) {
    return { tipo: "payload_insuficiente", mensagem: "Dados do evento insuficientes para matching. Adicione parâmetros de identificação do cliente (email hashed, phone, IP, User Agent)." };
  }

  if (erro.code === 100 && erro.error_subcode === 2804023) {
    return { tipo: "pixel_invalido", mensagem: "Pixel ID inválido ou não encontrado na conta." };
  }

  if (erro.code === 200) {
    return { tipo: "sem_permissao", mensagem: "Sem permissão para enviar eventos. O Access Token precisa da permissão 'ads_management' ou 'business_management'." };
  }

  if (httpStatus === 403) {
    return { tipo: "forbidden", mensagem: "Acesso negado. Verifique se o Pixel pertence à mesma empresa do Access Token." };
  }

  if (httpStatus === 404) {
    return { tipo: "nao_encontrado", mensagem: "Pixel não encontrado. Verifique o Pixel ID." };
  }

  return { tipo: "erro_api", mensagem: erro.error_user_msg || erro.message || `Erro Meta: ${erro.code}` };
}
  const metaResult = parseMetaResponse(rawResponse);

  const erroClassificado = !metaResult.sucesso ? classificarErroMeta(metaResult.erro, metaHttpStatus) : null;

  const successResponse = {
    ok: metaResult.sucesso,
    mensagem: metaResult.sucesso
      ? "Envio para a Meta aceito com sucesso."
      : erroClassificado?.mensagem ?? "A Meta não aceitou o envio.",
    erroTipo: erroClassificado?.tipo ?? null,
    dados: {
      pixelId: config.pixel_id,
      automaticoAtivo: config.ativo,
      eventsReceived: metaResult.dados?.events_received ?? 0,
      fbtraceId: metaResult.dados?.fbtrace_id ?? null,
      messages: metaResult.dados?.messages ?? [],
      respostaBruta: rawResponse,
    },
  };
  console.log("[META-TEST] Resultado:", JSON.stringify(successResponse, null, 2));
  console.log("[META-TEST] === FIM TESTE CONEXÃO ===");

  return NextResponse.json(successResponse);
}
