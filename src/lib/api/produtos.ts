type ApiErro = { erro?: string };

type ResultadoApi<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: string };

export type Produto = {
  id: string;
  id_empresa: string;
  nome: string;
  slug: string;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type PayloadCriarProduto = {
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
};

export type PayloadAtualizarProduto = Partial<PayloadCriarProduto>;

async function lerJsonSeguro<T>(resposta: Response): Promise<T> {
  return (await resposta.json().catch(() => ({}))) as T;
}

export async function listarProdutos(): Promise<ResultadoApi<{ produtos: Produto[] }>> {
  const resposta = await fetch("/api/produtos");
  const json = await lerJsonSeguro<{ produtos?: Produto[] } & ApiErro>(resposta);
  if (!resposta.ok) return { ok: false, erro: json.erro ?? "Erro ao carregar produtos." };
  return { ok: true, dados: { produtos: json.produtos ?? [] } };
}

export async function criarProduto(payload: PayloadCriarProduto): Promise<ResultadoApi<{ produto: Produto }>> {
  const resposta = await fetch("/api/produtos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await lerJsonSeguro<{ produto?: Produto } & ApiErro>(resposta);
  if (!resposta.ok || !json.produto) return { ok: false, erro: json.erro ?? "Erro ao criar produto." };
  return { ok: true, dados: { produto: json.produto } };
}

export async function atualizarProduto(idProduto: string, payload: PayloadAtualizarProduto): Promise<ResultadoApi<{ produto: Produto }>> {
  const resposta = await fetch(`/api/produtos/${idProduto}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await lerJsonSeguro<{ produto?: Produto } & ApiErro>(resposta);
  if (!resposta.ok || !json.produto) return { ok: false, erro: json.erro ?? "Erro ao atualizar produto." };
  return { ok: true, dados: { produto: json.produto } };
}

export async function removerProduto(idProduto: string): Promise<ResultadoApi<null>> {
  const resposta = await fetch(`/api/produtos/${idProduto}`, { method: "DELETE" });
  const json = await lerJsonSeguro<ApiErro>(resposta);
  if (!resposta.ok) return { ok: false, erro: json.erro ?? "Erro ao remover produto." };
  return { ok: true, dados: null };
}
