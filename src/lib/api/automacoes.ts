const isDebug = process.env.NODE_ENV === "development";

type ErrorPayload = {
  erro?: string;
};

function logDebug(action: string, payload?: Record<string, unknown>) {
  if (!isDebug) {
    return;
  }

  console.info("[AutomacoesAPI]", action, payload ?? {});
}

async function parseErroResposta(res: Response, fallback: string) {
  try {
    const json = (await res.json()) as ErrorPayload;
    return json.erro || fallback;
  } catch {
    const texto = await res.text().catch(() => "");
    if (texto && isDebug) {
      console.error("[AutomacoesAPI] Resposta não-JSON recebida", {
        status: res.status,
        statusText: res.statusText,
        preview: texto.slice(0, 200),
      });
    }
    return fallback;
  }
}

async function requestWorkspace(method: string, url: string, options: RequestInit = {}) {
  const res = await fetch(url, { ...options, method });

  logDebug(`${method} ${url}`, {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
  });

  if (!res.ok) {
    const mensagem = await parseErroResposta(res, `Erro ao ${method.toLowerCase()} automações`);
    throw new Error(mensagem);
  }

  return res;
}

export interface WorkspaceResponse {
  workspace: {
    id: string;
    rascunho_grafo_json: string | null;
    versao_publicada_id: string | null;
    atualizado_em: string;
  };
  published: {
    id: string;
    numero: number;
    grafo_json: string;
    trigger_principal: string;
    publicado_em: string;
  } | null;
}

export interface AutomacaoExecucaoItem {
  id: string;
  status: string;
  trigger_tipo: string;
  contexto_ref_tipo: string | null;
  contexto_ref_id: string | null;
  log_resumido_json: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface AutomacaoExecucoesResponse {
  execucoes: AutomacaoExecucaoItem[];
}

export async function obterWorkspace() {
  const res = await requestWorkspace("GET", "/api/automacoes/workspace");
  return res.json() as Promise<WorkspaceResponse>;
}

export async function salvarWorkspace(grafoJson: string) {
  const res = await requestWorkspace("PUT", "/api/automacoes/workspace", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rascunho_grafo_json: grafoJson }),
  });
  return res.json() as Promise<{ workspace: { id: string; atualizado_em: string } }>;
}

export async function publicarWorkspace() {
  const res = await requestWorkspace("POST", "/api/automacoes/workspace");
  return res.json() as Promise<WorkspaceResponse>;
}

export async function despublicarWorkspace() {
  const res = await requestWorkspace("DELETE", "/api/automacoes/workspace");
  return res.json() as Promise<WorkspaceResponse>;
}

export async function excluirWorkspace() {
  const res = await requestWorkspace("DELETE", "/api/automacoes/workspace?acao=excluir");
  return res.json() as Promise<{ sucesso: boolean; mensagem: string }>;
}

export async function listarExecucoesWorkspace(limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await requestWorkspace("GET", `/api/automacoes/execucoes?${params.toString()}`);
  return res.json() as Promise<AutomacaoExecucoesResponse>;
}
