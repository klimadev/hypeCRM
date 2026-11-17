import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { autoDetectMapping } from "@/lib/meta-campos";
import type { CampoMappingForm } from "@/lib/meta-campos";

const API_BASE = "https://graph.facebook.com/v22.0";

type MetaApiError = { code?: number; message?: string };
type MetaApiResponse<T> = { data?: T[]; error?: MetaApiError };
type MetaForm = { id: string; name: string; status?: string; locale?: string };
type MetaLead = {
  id: string;
  created_time: string;
  ad_id?: string;
  form_id: string;
  field_data: Array<{ name: string; values: string[] }>;
};

function debugLog(step: string, detail: unknown) {
  const ts = new Date().toISOString();
  const body = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
  console.error(`[meta-leads:test] [${ts}] ${step}:\n${body}`);
}

async function apiCall<T>(url: string, token: string, label: string): Promise<T> {
  const qs = new URLSearchParams({ access_token: token });
  const fullUrl = `${url}&${qs.toString()}`;
  debugLog(`REQ ${label}`, fullUrl.replace(token, "TOKEN_REDACTED"));
  const res = await fetch(fullUrl);
  const json: unknown = await res.json();
  debugLog(`RES ${label} status=${res.status}`, json);
  return json as T;
}

async function buscarForms(pageId: string, token: string): Promise<MetaForm[]> {
  const data = await apiCall<MetaApiResponse<MetaForm>>(
    `${API_BASE}/${pageId}/leadgen_forms?fields=id,name,status,locale`,
    token,
    `forms:${pageId}`,
  );
  return data?.data ?? [];
}

async function buscarLeads(formId: string, pageId: string, token: string, maxLeads = 5) {
  // Tentativa 1: /{form_id}/leads
  let data = await apiCall<MetaApiResponse<MetaLead>>(
    `${API_BASE}/${formId}/leads?fields=id,created_time,ad_id,form_id,field_data&limit=${maxLeads}`,
    token,
    `leads-form:${formId}`,
  );
  if (!data?.error) return data?.data ?? [];

  debugLog(`FALLBACK leads-form:${formId}`, `erro #${data.error.code}: ${data.error.message}`);

  // Fallback: /{page_id}/leads
  data = await apiCall<MetaApiResponse<MetaLead>>(
    `${API_BASE}/${pageId}/leads?fields=id,created_time,ad_id,form_id,field_data&limit=${maxLeads}`,
    token,
    `leads-page:${pageId}`,
  );
  if (!data?.error && data?.data) {
    const filtered = data.data.filter((l) => l.form_id === formId);
    debugLog(`FALLBACK OK leads-page:${pageId}`, `${filtered.length} leads filtrados do form ${formId}`);
    return filtered;
  }

  if (data?.error) {
    debugLog(`FALLBACK FAIL leads-page:${pageId}`, `erro #${data.error.code}: ${data.error.message}`);
  }

  return [];
}

async function extrairPageTokens(userToken: string) {
  const data = await apiCall<MetaApiResponse<{ id: string; name: string; access_token: string }>>(
    `${API_BASE}/me/accounts?fields=id,name,access_token`,
    userToken,
    "me/accounts",
  );
  debugLog("me/accounts", data);

  if (data?.error) {
    const msg = data.error.message ?? JSON.stringify(data.error);
    throw new Error(`Meta API: ${msg}`);
  }

  const pages = data?.data ?? [];
  if (!pages.length) {
    debugLog("me/accounts WARN", "array vazio — sem paginas. Token expirado ou sem permissao pages_show_list?");
  }

  return pages.map((p) => ({
    pageId: p.id,
    pageName: p.name,
    token: p.access_token,
  }));
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    return respostaSemPermissao();
  }

  try {
    const body: unknown = await request.json();
    // Aceita user tokens (raw) ou page tokens (já com pageId)
    const bodyTokens: unknown[] =
      body && typeof body === "object" && "tokens" in body && Array.isArray(body.tokens)
        ? (body.tokens as unknown[])
        : [];
    const rawTokens = bodyTokens.flatMap((token) => {
      if (!token || typeof token !== "object" || !("raw" in token) || typeof token.raw !== "string") {
        return [];
      }

      const pageId = "pageId" in token && typeof token.pageId === "string" ? token.pageId : undefined;
      const pageName = "pageName" in token && typeof token.pageName === "string" ? token.pageName : undefined;
      return [{ raw: token.raw, pageId, pageName }];
    });

    debugLog("BODY recebido", { count: rawTokens.length, tipos: rawTokens.map(t => t.pageId ? "page-token" : "user-token") });

    if (!rawTokens.length) {
      return NextResponse.json({ sucesso: false, erro: "Nenhum token informado." }, { status: 400 });
    }

    // Extrai page tokens via /me/accounts se for user token
    let tokens: Array<{ pageId: string; pageName: string; token: string }> = [];
    try {
      for (const t of rawTokens) {
        if (t.pageId) {
          debugLog("Token ja eh page token", { pageId: t.pageId, pageName: t.pageName });
          tokens.push({ pageId: t.pageId, pageName: t.pageName ?? "Pagina", token: t.raw });
        } else {
          debugLog("Extraindo page tokens do user token...", "");
          const pages = await extrairPageTokens(t.raw);
          tokens = tokens.concat(pages);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao acessar Meta API";
      debugLog("FALHA extracao", msg);
      return NextResponse.json({
        sucesso: false,
        erro: `Falha ao listar paginas: ${msg}. Verifique se o token eh valido e tem permissao pages_show_list.`,
      }, { status: 400 });
    }

    debugLog("Tokens extraidos", { count: tokens.length, pages: tokens.map(t => ({ id: t.pageId, name: t.pageName })) });

    if (!tokens.length) {
      return NextResponse.json({
        sucesso: false,
        erro: "Nenhuma pagina encontrada. Verifique se o token tem permissao pages_show_list e leads_retrieval.",
      }, { status: 400 });
    }

    const pages: Array<{
      pageId: string;
      pageName: string;
      token: string;
      forms: Array<{
        id: string;
        name: string;
        status?: string;
        locale?: string;
        campos_disponiveis: string[];
        auto_mapping: CampoMappingForm;
        leads: MetaLead[];
      }>;
      leads: MetaLead[];
    }> = [];
    for (const t of tokens) {
      const forms = await buscarForms(t.pageId, t.token);
      const formObjects: Array<{
        id: string;
        name: string;
        status?: string;
        locale?: string;
        campos_disponiveis: string[];
        auto_mapping: CampoMappingForm;
        leads: MetaLead[];
      }> = [];
      const pageLeads: MetaLead[] = [];
      for (const form of forms.slice(0, 5)) {
        const leads = await buscarLeads(form.id, t.pageId, t.token, 5);
        const camposDisponiveis = [...new Set(leads.flatMap(l => l.field_data.map(fd => fd.name)))];
        formObjects.push({
          id: form.id,
          name: form.name,
          status: form.status,
          locale: form.locale,
          campos_disponiveis: camposDisponiveis,
          auto_mapping: autoDetectMapping(camposDisponiveis),
          leads,
        });
        pageLeads.push(...leads);
      }
      pages.push({
        pageId: t.pageId,
        pageName: t.pageName,
        token: t.token,
        forms: formObjects,
        leads: pageLeads,
      });
    }

    debugLog("RESPOSTA final", { pages: pages.length, forms: pages.reduce((n, p) => n + p.forms.length, 0), leads: pages.reduce((n, p) => n + p.leads.length, 0) });
    return NextResponse.json({ sucesso: true, dados: { pages } });
  } catch (erro) {
    debugLog("ERRO nao tratado", erro);
    return NextResponse.json({ sucesso: false, erro: "Erro ao testar conexao." }, { status: 500 });
  }
}
