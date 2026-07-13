import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { obterEstagioIndefinido } from "@/lib/estagios-fixos";
import { extrairCampoMapeado } from "@/lib/meta-campos";
import type { CampoMapping, CampoMappingForm } from "@/lib/meta-campos";

const API_BASE = "https://graph.facebook.com/v22.0";

const _debugLogs: string[] = [];
function addLog(step: string, detail: unknown) {
  const ts = new Date().toISOString();
  const body = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
  const line = `[${ts}] ${step}: ${body}`;
  _debugLogs.push(line);
  console.error(`[meta-leads:sync] ${line}`);
}

async function apiCall(url: string, token: string, label: string) {
  const qs = new URLSearchParams({ access_token: token });
  const fullUrl = `${url}&${qs.toString()}`;
  addLog(`REQ ${label}`, fullUrl.replace(token, "TOKEN_REDACTED"));
  const res = await fetch(fullUrl);
  const json = await res.json();
  addLog(`RES ${label} status=${res.status}`, json);
  return json;
}

async function buscarForms(pageId: string, token: string) {
  const data = await apiCall(
    `${API_BASE}/${pageId}/leadgen_forms?fields=id,name,status`,
    token,
    `forms:${pageId}`,
  );
  return data?.data ?? [];
}

async function fetchLeads(formId: string, pageId: string, token: string) {
  const url = `${API_BASE}/${formId}/leads?fields=id,created_time,ad_id,form_id,field_data&limit=100`;
  let data = await apiCall(url, token, `leads-form:${formId}`);
  if (!data?.error) return data?.data ?? [];

  addLog(`FALLBACK leads-form:${formId}`, `erro #${data.error.code}: ${data.error.message}`);

  // Fallback: /{page_id}/leads
  data = await apiCall(
    `${API_BASE}/${pageId}/leads?fields=id,created_time,ad_id,form_id,field_data&limit=100`,
    token,
    `leads-page:${pageId}`,
  );
  if (data?.data) {
    const filtered = data.data.filter(
      (l: { form_id?: string }) => l.form_id === formId,
    );
    addLog(`FALLBACK OK leads-page:${pageId}`, `${filtered.length} leads filtrados form ${formId}`);
    return filtered;
  }

  if (data?.error) {
    addLog(`FALLBACK FAIL leads-page:${pageId}`, `erro #${data.error.code}: ${data.error.message}`);
  }

  return [];
}

type MetaLead = {
  id: string;
  created_time: string;
  ad_id?: string;
  form_id: string;
  field_data: Array<{ name: string; values: string[] }>;
};

function gerarDadosExtras(fieldData: MetaLead["field_data"]): string {
  return JSON.stringify(fieldData.map((f) => ({ name: f.name, value: f.values[0] ?? "" })));
}

async function criarLeadNoCRM(
  idEmpresa: string,
  lead: MetaLead,
  funcionario: { id: string; id_pdv: string | null },
  formMapping: CampoMappingForm | null | undefined,
) {
  const extraido = extrairCampoMapeado(lead.field_data, formMapping);
  const dadosExtras = gerarDadosExtras(lead.field_data);

  const estagioPadrao = await obterEstagioIndefinido(idEmpresa);
  const idEstagio = estagioPadrao.id;

  const leadCriado = await prisma.lead.create({
    data: {
      id: crypto.randomUUID(),
      id_empresa: idEmpresa,
      id_funcionario: funcionario.id,
      id_pdv: funcionario.id_pdv,
      id_estagio: idEstagio,
      nome: extraido.nome,
      telefone: extraido.telefone || "(sem telefone)",
      ...(extraido.email ? { email: extraido.email } : {}),
      fonte: "Meta Lead Ads",
      origem: "META_LEAD_ADS",
      dados_extras: dadosExtras,
      ativo: true,
    },
    select: { id: true },
  });

  return leadCriado.id;
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    return respostaSemPermissao();
  }

  const idEmpresa = auth.sessao.id_empresa;
  _debugLogs.length = 0; // ponytail: não acumular entre requisições
  addLog("SYNC iniciado", { idEmpresa });

  const config = await prisma.metaLeadAdsConfig.findUnique({
    where: { id_empresa: idEmpresa },
  });

  if (!config || !config.ativo) {
    return NextResponse.json({ sucesso: false, erro: "Integracao nao esta ativa." }, { status: 400 });
  }

  let pageTokens: Array<{ pageId: string; pageName: string; token: string }> = [];
  try { pageTokens = JSON.parse(config.page_tokens); } catch { pageTokens = []; }

  // ponytail: campo_mapping via raw query, campo n ta no schema source
  let campoMapping: CampoMapping = {};
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ campo_mapping: string | null }>>(
      `SELECT campo_mapping FROM MetaLeadAdsConfig WHERE id_empresa = ?`, idEmpresa,
    );
    if (rows?.[0]?.campo_mapping) campoMapping = JSON.parse(rows[0].campo_mapping);
  } catch { campoMapping = {}; }
  addLog("Campo mapping carregado", { forms: Object.keys(campoMapping).length });

  addLog("Tokens carregados do DB", { count: pageTokens.length, pages: pageTokens.map(p => ({ id: p.pageId, name: p.pageName })) });

  if (!pageTokens.length) {
    return NextResponse.json({ sucesso: false, erro: "Nenhuma pagina configurada." }, { status: 400 });
  }

  const funcionario = await prisma.funcionario.findFirst({
    where: { id_empresa: idEmpresa, ativo: true },
    orderBy: { criado_em: "asc" },
    select: { id: true, id_pdv: true },
  });

  if (!funcionario) {
    return NextResponse.json({ sucesso: false, erro: "Nenhum funcionario ativo encontrado." }, { status: 400 });
  }

  const agora = new Date();

  let totalImportados = 0;
  let totalIgnorados = 0;
  const erros: string[] = [];

  for (const p of pageTokens) {
    addLog(`Processando pagina`, { pageId: p.pageId, pageName: p.pageName });
    try {
      const forms = await buscarForms(p.pageId, p.token);
      addLog(`Forms encontrados ${p.pageName}`, { count: forms.length, forms: forms.map(f => ({ id: f.id, name: f.name })) });

      for (const form of forms) {
        try {
          const leads = await fetchLeads(form.id, p.pageId, p.token);
          addLog(`Leads form ${form.name}`, { formId: form.id, count: leads.length });

          const skipForms: string[] = (campoMapping as any)._skip ?? [];

          for (const lead of leads) {
            // ponytail: check skip list before any processing
            if (skipForms.includes(lead.form_id)) {
              totalIgnorados++;
              addLog(`Form ${lead.form_id} ignorado (skip list)`);
              continue;
            }

            const existente = await prisma.metaLeadAdsLead.findUnique({
              where: { id_empresa_id: { id_empresa: idEmpresa, id: lead.id } },
            });

            const formMapping = campoMapping[lead.form_id] ?? null;

            if (existente) {
              // Se o metaLeadAdsLead existe mas o lead CRM foi deletado, reimporta
              // Fonte da verdade � a tabela /leads
              const leadCrmExiste = existente.id_lead_crm
                ? await prisma.lead.findUnique({ where: { id: existente.id_lead_crm }, select: { id: true } })
                : null;

              if (leadCrmExiste) {
                totalIgnorados++;
                continue;
              }

              addLog(`Reimportando lead ${lead.id} (CRM deletado)`);
              const idLeadCrmRe = await criarLeadNoCRM(idEmpresa, lead, funcionario, formMapping);

              await prisma.metaLeadAdsLead.update({
                where: { id_empresa_id: { id_empresa: idEmpresa, id: lead.id } },
                data: {
                  id_lead_crm: idLeadCrmRe,
                  dados_brutos: JSON.stringify(lead),
                },
              });

              totalImportados++;
              continue;
            }

            const idLeadCrm = await criarLeadNoCRM(idEmpresa, lead, funcionario, formMapping);

            await prisma.metaLeadAdsLead.create({
              data: {
                id: lead.id,
                id_empresa: idEmpresa,
                id_lead_crm: idLeadCrm,
                page_id: p.pageId,
                form_id: lead.form_id,
                ad_id: lead.ad_id ?? null,
                dados_brutos: JSON.stringify(lead),
              },
            });

            totalImportados++;
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          addLog(`ERRO form ${form.id}`, msg);
          erros.push(`Form ${form.id}: ${msg}`);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`ERRO page ${p.pageId}`, msg);
      erros.push(`Page ${p.pageId}: ${msg}`);
    }
  }

  if (totalImportados > 0) {
    await prisma.metaLeadAdsConfig.update({
      where: { id_empresa: idEmpresa },
      data: { ultima_sync: agora, atualizado_em: agora },
    });
  }

  addLog("SYNC finalizado", { totalImportados, totalIgnorados, erros });
  return NextResponse.json({
    sucesso: true,
    total_importados: totalImportados,
    total_ignorados: totalIgnorados,
    erros,
    debug: _debugLogs,
  });
}
