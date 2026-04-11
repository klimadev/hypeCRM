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
  const res = await fetch("/api/automacoes/workspace", { method: "GET" });
  if (!res.ok) {
    const erro = await res.json();
    throw new Error(erro.erro || "Erro ao carregar workspace");
  }
  return res.json() as Promise<WorkspaceResponse>;
}

export async function salvarWorkspace(grafoJson: string) {
  const res = await fetch("/api/automacoes/workspace", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rascunho_grafo_json: grafoJson }),
  });
  if (!res.ok) {
    const erro = await res.json();
    throw new Error(erro.erro || "Erro ao salvar workspace");
  }
  return res.json() as Promise<{ workspace: { id: string; atualizado_em: string } }>;
}

export async function publicarWorkspace() {
  const res = await fetch("/api/automacoes/workspace", { method: "POST" });
  if (!res.ok) {
    const erro = await res.json();
    throw new Error(erro.erro || "Erro ao publicar workspace");
  }
  return res.json() as Promise<WorkspaceResponse>;
}

export async function despublicarWorkspace() {
  const res = await fetch("/api/automacoes/workspace", { method: "DELETE" });
  if (!res.ok) {
    const erro = await res.json();
    throw new Error(erro.erro || "Erro ao despublicar workspace");
  }
  return res.json() as Promise<WorkspaceResponse>;
}

export async function listarExecucoesWorkspace(limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`/api/automacoes/execucoes?${params.toString()}`, { method: "GET" });
  if (!res.ok) {
    const erro = await res.json();
    throw new Error(erro.erro || "Erro ao carregar execucoes do workspace");
  }
  return res.json() as Promise<AutomacaoExecucoesResponse>;
}
