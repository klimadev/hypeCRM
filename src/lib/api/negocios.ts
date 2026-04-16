import type { Lead } from "@/modules/kanban/types";

type ApiErro = {
  erro?: string;
};

type ResultadoApi<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: string };

export type ApiLeadVinculado = {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  origem?: string | null;
  fonte?: string | null;
  empresa_origem?: string | null;
  observacoes?: string | null;
  motivo_perda?: string | null;
  valor_oportunidade?: number | null;
  probabilidade?: number | null;
  criado_em?: string;
  atualizado_em?: string;
  id_funcionario?: string;
  id_pdv?: string | null;
  dados_extras?: string | null;
  anuncio_titulo?: string | null;
  anuncio_descricao?: string | null;
  anuncio_url?: string | null;
  id_negocio?: string | null;
};

export type ApiNegocioResumo = {
  id: string;
  id_lead?: string | null;
  id_funil: string;
  id_estagio: string;
  id_funcionario: string;
  titulo: string;
  valor_estimado: number;
  valor_fechado?: number | null;
  probabilidade?: number | null;
  status: string;
  criado_em?: string;
  atualizado_em?: string;
  data_abertura: string;
  data_fechamento?: string | null;
  motivo_perda?: string | null;
  observacoes_comerciais?: string | null;
  lead_principal?: ApiLeadVinculado | null;
  leads?: ApiLeadVinculado[];
  estagio?: {
    id: string;
    nome: string;
    ordem: number;
    tipo: string;
    id_funil: string;
  };
  funil?: {
    id: string;
    nome: string;
    slug: string;
    padrao?: boolean;
  };
  funcionario?: {
    id: string;
    nome: string;
    id_pdv?: string | null;
  };
};

export function converterNegocioResumoParaCard(negocio: ApiNegocioResumo): Lead {
  const leadPrincipal = negocio.lead_principal ?? negocio.leads?.[0] ?? null;

  return {
    id: negocio.id,
    id_negocio: negocio.id,
    id_funil: negocio.id_funil,
    id_estagio: negocio.id_estagio,
    id_funcionario: negocio.id_funcionario,
    nome: negocio.titulo,
    telefone: leadPrincipal?.telefone ?? "",
    valor_oportunidade: leadPrincipal?.valor_oportunidade ?? negocio.valor_estimado,
    valor_fechado: negocio.valor_fechado ?? null,
    status: negocio.status,
    probabilidade: leadPrincipal?.probabilidade ?? negocio.probabilidade ?? undefined,
    fonte: leadPrincipal?.fonte ?? null,
    empresa_origem: leadPrincipal?.empresa_origem ?? null,
    observacoes: leadPrincipal?.observacoes ?? negocio.observacoes_comerciais ?? null,
    motivo_perda: leadPrincipal?.motivo_perda ?? negocio.motivo_perda ?? null,
    origem: leadPrincipal?.origem as Lead["origem"] | undefined,
    atualizado_em: leadPrincipal?.atualizado_em ?? negocio.atualizado_em ?? negocio.data_abertura,
    data_abertura: negocio.data_abertura,
    data_fechamento: negocio.data_fechamento ?? null,
    id_pdv: leadPrincipal?.id_pdv ?? negocio.funcionario?.id_pdv ?? null,
    dados_extras: leadPrincipal?.dados_extras ?? null,
    anuncio_titulo: leadPrincipal?.anuncio_titulo ?? null,
    anuncio_descricao: leadPrincipal?.anuncio_descricao ?? null,
    anuncio_url: leadPrincipal?.anuncio_url ?? null,
    lead_principal: leadPrincipal
      ? {
          id: leadPrincipal.id,
          nome: leadPrincipal.nome,
          telefone: leadPrincipal.telefone,
          email: leadPrincipal.email ?? null,
          origem: leadPrincipal.origem as Lead["origem"],
          id_negocio: leadPrincipal.id_negocio ?? negocio.id,
          atualizado_em: leadPrincipal.atualizado_em ?? negocio.atualizado_em ?? negocio.data_abertura,
        }
      : null,
    leads_vinculados: (negocio.leads ?? []).map((lead) => ({
      id: lead.id,
      nome: lead.nome,
      telefone: lead.telefone,
      id_negocio: lead.id_negocio ?? negocio.id,
    })),
  };
}

export type ListagemNegociosApi = {
  negocios: ApiNegocioResumo[];
  funis?: Array<{
    id: string;
    nome: string;
    slug: string;
    padrao: boolean;
  }>;
  estagios?: Array<{
    id: string;
    nome: string;
    ordem: number;
    tipo: string;
    id_funil: string;
  }>;
  funcionarios?: Array<{
    id: string;
    nome: string;
    id_pdv?: string | null;
  }>;
  pdvs?: Array<{
    id: string;
    nome: string;
  }>;
};

type ResultadoMutacaoNegocio = {
  negocio?: ApiNegocioResumo;
};

export type PayloadRemoverNegocio = {
  remover_leads_vinculados?: boolean;
};

export type ResultadoRemocaoNegocio = {
  sucesso: boolean;
  leads_removidos?: number;
};

async function lerJsonSeguro<T>(resposta: Response): Promise<T> {
  return (await resposta.json().catch(() => ({}))) as T;
}

export async function listarNegociosApi(): Promise<ResultadoApi<ListagemNegociosApi>> {
  const resposta = await fetch("/api/negocios", { cache: "no-store" });
  const json = await lerJsonSeguro<ListagemNegociosApi & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar os negócios." };
  }

  return {
    ok: true,
    dados: {
      negocios: json.negocios ?? [],
      funis: json.funis ?? [],
      estagios: json.estagios ?? [],
      funcionarios: json.funcionarios ?? [],
      pdvs: json.pdvs ?? [],
    },
  };
}

export async function vincularLeadAoNegocio(idNegocio: string, leadId: string): Promise<ResultadoApi<ResultadoMutacaoNegocio>> {
  const resposta = await fetch(`/api/negocios/${idNegocio}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead_ids: [leadId] }),
  });

  const json = await lerJsonSeguro<ResultadoMutacaoNegocio & ApiErro>(resposta);
  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao vincular lead ao negócio." };
  }

  return { ok: true, dados: { negocio: json.negocio } };
}

export async function atualizarVinculosNegocio(idNegocio: string, leadIds: string[]): Promise<ResultadoApi<ResultadoMutacaoNegocio>> {
  const resposta = await fetch(`/api/negocios/${idNegocio}/leads`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead_ids: leadIds }),
  });

  const json = await lerJsonSeguro<ResultadoMutacaoNegocio & ApiErro>(resposta);
  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao atualizar vínculos do negócio." };
  }

  return { ok: true, dados: { negocio: json.negocio } };
}

export async function removerNegocio(
  idNegocio: string,
  payload: PayloadRemoverNegocio = {},
): Promise<ResultadoApi<ResultadoRemocaoNegocio>> {
  const resposta = await fetch(`/api/negocios/${idNegocio}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      remover_leads_vinculados: payload.remover_leads_vinculados ?? false,
    }),
  });

  const json = await lerJsonSeguro<ResultadoRemocaoNegocio & ApiErro>(resposta);
  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao remover o negócio." };
  }

  return {
    ok: true,
    dados: {
      sucesso: json.sucesso ?? true,
      leads_removidos: json.leads_removidos ?? 0,
    },
  };
}

export type PayloadCriarNegocio = {
  titulo: string;
  valor_estimado: number;
  id_funil?: string;
  id_estagio: string;
  id_funcionario: string;
  lead_ids?: string[];
  probabilidade?: number;
  observacoes_comerciais?: string | null;
  motivo_perda?: string | null;
};

export async function criarNegocioApi(payload: PayloadCriarNegocio): Promise<ResultadoApi<{ negocio?: ApiNegocioResumo }>> {
  const resposta = await fetch("/api/negocios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await lerJsonSeguro<{ negocio?: ApiNegocioResumo } & ApiErro>(resposta);
  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao criar o negócio." };
  }

  return { ok: true, dados: { negocio: json.negocio } };
}
