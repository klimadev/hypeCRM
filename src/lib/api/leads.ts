type ApiErro = {
  erro?: string;
};

type ResultadoApi<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: string };

export type ApiLeadContato = {
  id: string;
  id_negocio?: string | null;
  id_estagio: string;
  id_funcionario: string;
  nome: string;
  telefone: string;
  valor_oportunidade: number;
  atualizado_em: string;
  origem?: string | null;
  id_pdv?: string | null;
};

export type ApiFuncionarioContato = {
  id: string;
  nome: string;
  id_pdv?: string | null;
};

export type ApiPdvContato = {
  id: string;
  nome: string;
};

export type ListagemLeadsApi = {
  leads: ApiLeadContato[];
  funcionarios: ApiFuncionarioContato[];
  pdvs: ApiPdvContato[];
};

export type PayloadRemoverLead = {
  remover_negocios_vinculados?: boolean;
};

export type ResultadoRemocaoLead = {
  sucesso: boolean;
  negocios_removidos?: number;
};

async function lerJsonSeguro<T>(resposta: Response): Promise<T> {
  return (await resposta.json().catch(() => ({}))) as T;
}

export async function listarLeadsApi(): Promise<ResultadoApi<ListagemLeadsApi>> {
  const resposta = await fetch("/api/leads", { cache: "no-store" });
  const json = await lerJsonSeguro<ListagemLeadsApi & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar os leads." };
  }

  return {
    ok: true,
    dados: {
      leads: json.leads ?? [],
      funcionarios: json.funcionarios ?? [],
      pdvs: json.pdvs ?? [],
    },
  };
}

export async function removerLeadContato(
  idLead: string,
  payload: PayloadRemoverLead = {},
): Promise<ResultadoApi<ResultadoRemocaoLead>> {
  const resposta = await fetch(`/api/leads/${idLead}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      remover_negocios_vinculados: payload.remover_negocios_vinculados ?? false,
    }),
  });

  const json = await lerJsonSeguro<ResultadoRemocaoLead & ApiErro>(resposta);
  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao remover o lead." };
  }

  return {
    ok: true,
    dados: {
      sucesso: json.sucesso ?? true,
      negocios_removidos: json.negocios_removidos ?? 0,
    },
  };
}
