type ResultadoApi<T> = { ok: true; dados: T } | { ok: false; erro: string };

export type ChatShortcut = {
  id: string;
  nome: string;
  slug: string;
  conteudo: string;
  tags: string[];
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type ChatShortcutPayload = {
  nome: string;
  slug: string;
  conteudo: string;
  tags: string[];
  ativo?: boolean;
};

async function parseErro(resposta: Response, fallback: string) {
  const json = await resposta.json().catch(() => ({}));
  return (json.erro as string) ?? fallback;
}

export async function listarAtalhosChat(): Promise<ResultadoApi<{ atalhos: ChatShortcut[] }>> {
  const resposta = await fetch("/api/chat/shortcuts", { cache: "no-store" });
  if (!resposta.ok) {
    return { ok: false, erro: await parseErro(resposta, "Erro ao carregar atalhos.") };
  }

  const json = await resposta.json();
  return { ok: true, dados: { atalhos: json.atalhos ?? [] } };
}

export async function criarAtalhoChat(payload: ChatShortcutPayload): Promise<ResultadoApi<{ atalho: ChatShortcut }>> {
  const resposta = await fetch("/api/chat/shortcuts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resposta.ok) {
    return { ok: false, erro: await parseErro(resposta, "Erro ao criar atalho.") };
  }

  const json = await resposta.json();
  return { ok: true, dados: { atalho: json.atalho } };
}

export async function atualizarAtalhoChat(
  id: string,
  payload: ChatShortcutPayload,
): Promise<ResultadoApi<{ atalho: ChatShortcut }>> {
  const resposta = await fetch("/api/chat/shortcuts", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...payload }),
  });
  if (!resposta.ok) {
    return { ok: false, erro: await parseErro(resposta, "Erro ao atualizar atalho.") };
  }

  const json = await resposta.json();
  return { ok: true, dados: { atalho: json.atalho } };
}

export async function excluirAtalhoChat(id: string): Promise<ResultadoApi<null>> {
  const resposta = await fetch("/api/chat/shortcuts", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!resposta.ok) {
    return { ok: false, erro: await parseErro(resposta, "Erro ao excluir atalho.") };
  }

  return { ok: true, dados: null };
}
