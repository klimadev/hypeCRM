import type { Estagio, Funcionario, Lead } from "@/modules/kanban/types";

type ApiErro = {
  erro?: string;
};

type ResultadoApi<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: string };

export type ListagemKanban = {
  estagios: Estagio[];
  negocios: Lead[];
  funcionarios: Funcionario[];
  pdvs: Array<{ id: string; nome: string }>;
};

export type PayloadCriarNegocio = {
  titulo: string;
  valor_estimado: number;
  id_estagio: string;
  id_funcionario: string;
  lead_ids?: string[];
  id_funil?: string;
  probabilidade?: number;
  observacoes_comerciais?: string | null;
  motivo_perda?: string | null;
};

export type PayloadMoverNegocioKanban = {
  id_estagio: string;
  motivo_perda?: string;
};

export type PayloadAtualizarNegocioKanban = {
  observacoes_comerciais: Lead["observacoes"];
  valor_estimado: number;
  id_funcionario: Lead["id_funcionario"];
};

export type PayloadRedistribuirEmAtendimentoKanban = {
  minutosSemAtendimento?: number;
  limite?: number;
  id_pdv?: string;
  nomeEstagio?: string;
};

async function lerJsonSeguro<T>(resposta: Response): Promise<T> {
  return (await resposta.json().catch(() => ({}))) as T;
}

type ApiLeadPrincipal = {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  origem?: Lead["origem"];
  id_negocio?: string | null;
  atualizado_em?: string | Date;
  fonte?: string | null;
  empresa_origem?: string | null;
  observacoes?: string | null;
  motivo_perda?: string | null;
  id_pdv?: string | null;
  dados_extras?: string | null;
  anuncio_titulo?: string | null;
  anuncio_descricao?: string | null;
  anuncio_url?: string | null;
};

type ApiNegocioKanban = {
  id: string;
  id_estagio: string;
  id_funcionario: string;
  id_pdv?: string | null;
  titulo: string;
  valor_estimado: number;
  valor_fechado?: number | null;
  probabilidade?: number | null;
  motivo_perda?: string | null;
  observacoes_comerciais?: string | null;
  atualizado_em: string;
  lead_principal?: ApiLeadPrincipal | null;
  leads?: ApiLeadPrincipal[];
};

type ApiNegocioListagemResponse = {
  negocios?: ApiNegocioKanban[];
  estagios?: Estagio[];
  funcionarios?: Funcionario[];
  pdvs?: Array<{ id: string; nome: string }>;
  erro?: string;
};

function mapearNegocioParaCard(negocio: ApiNegocioKanban): Lead {
  const leadPrincipal = negocio.lead_principal ?? null;
  const leadsVinculados = negocio.leads ?? [];
  const leadPrincipalEfetivo = leadPrincipal ?? leadsVinculados[0] ?? null;

  return {
    id: negocio.id,
    id_negocio: negocio.id,
    id_estagio: negocio.id_estagio,
    id_funcionario: negocio.id_funcionario,
    nome: negocio.titulo,
    telefone: leadPrincipalEfetivo?.telefone ?? "",
    valor_oportunidade: negocio.valor_estimado,
    probabilidade: negocio.probabilidade ?? undefined,
    fonte: leadPrincipalEfetivo?.fonte ?? null,
    empresa_origem: leadPrincipalEfetivo?.empresa_origem ?? null,
    observacoes: negocio.observacoes_comerciais ?? null,
    motivo_perda: negocio.motivo_perda ?? null,
    origem: leadPrincipalEfetivo?.origem,
    atualizado_em: negocio.atualizado_em,
    id_pdv: leadPrincipalEfetivo?.id_pdv ?? negocio.id_pdv ?? null,
    dados_extras: leadPrincipalEfetivo?.dados_extras ?? null,
    anuncio_titulo: leadPrincipalEfetivo?.anuncio_titulo ?? null,
    anuncio_descricao: leadPrincipalEfetivo?.anuncio_descricao ?? null,
    anuncio_url: leadPrincipalEfetivo?.anuncio_url ?? null,
    lead_principal: leadPrincipalEfetivo
      ? {
          id: leadPrincipalEfetivo.id,
          nome: leadPrincipalEfetivo.nome,
          telefone: leadPrincipalEfetivo.telefone,
          email: leadPrincipalEfetivo.email ?? null,
          origem: leadPrincipalEfetivo.origem,
          id_negocio: leadPrincipalEfetivo.id_negocio ?? negocio.id,
          atualizado_em: typeof leadPrincipalEfetivo.atualizado_em === "string"
            ? leadPrincipalEfetivo.atualizado_em
            : leadPrincipalEfetivo.atualizado_em?.toISOString(),
        }
      : null,
    leads_vinculados: leadsVinculados.map((lead) => ({
      id: lead.id,
      nome: lead.nome,
      telefone: lead.telefone,
      id_negocio: lead.id_negocio ?? negocio.id,
    })),
  };
}

export async function listarKanban(): Promise<ResultadoApi<ListagemKanban>> {
  const resposta = await fetch("/api/negocios");
  const json = await lerJsonSeguro<ApiNegocioListagemResponse>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar dados do Kanban." };
  }

  return {
    ok: true,
    dados: {
      estagios: json.estagios ?? [],
      negocios: (json.negocios ?? []).map(mapearNegocioParaCard),
      funcionarios: json.funcionarios ?? [],
      pdvs: json.pdvs ?? [],
    },
  };
}

export async function criarNegocioKanban(payload: PayloadCriarNegocio): Promise<ResultadoApi<{ negocio?: Lead }>> {
  const resposta = await fetch("/api/negocios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titulo: payload.titulo,
      valor_estimado: payload.valor_estimado,
      id_estagio: payload.id_estagio,
      id_funcionario: payload.id_funcionario,
      lead_ids: payload.lead_ids ?? [],
      id_funil: payload.id_funil,
      probabilidade: payload.probabilidade,
      observacoes_comerciais: payload.observacoes_comerciais,
      motivo_perda: payload.motivo_perda,
    }),
  });

  const json = await lerJsonSeguro<{ negocio?: Lead } & ApiErro>(resposta);
  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao criar negócio." };
  }

  return { ok: true, dados: { negocio: json.negocio ? mapearNegocioParaCard(json.negocio as unknown as ApiNegocioKanban) : undefined } };
}

export async function moverNegocioKanban(
  idNegocio: string,
  payload: PayloadMoverNegocioKanban,
): Promise<ResultadoApi<{ negocio?: Lead; mensagem?: string }>> {
  const resposta = await fetch(`/api/negocios/${idNegocio}/mover`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await lerJsonSeguro<{ negocio?: Lead; mensagem?: string } & ApiErro>(resposta);
  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Nao foi possivel mover o negócio." };
  }

  return {
    ok: true,
    dados: {
      negocio: json.negocio ? mapearNegocioParaCard(json.negocio as unknown as ApiNegocioKanban) : undefined,
      mensagem: json.mensagem,
    },
  };
}

export async function atualizarNegocioKanban(
  idNegocio: string,
  payload: PayloadAtualizarNegocioKanban,
): Promise<ResultadoApi<{ negocio?: Lead }>> {
  const resposta = await fetch(`/api/negocios/${idNegocio}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await lerJsonSeguro<{ negocio?: Lead } & ApiErro>(resposta);
  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao salvar negócio." };
  }

  return { ok: true, dados: { negocio: json.negocio ? mapearNegocioParaCard(json.negocio as unknown as ApiNegocioKanban) : undefined } };
}

export async function uploadDocumentoKanban(arquivo: File): Promise<ResultadoApi<{ url: string }>> {
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  const resposta = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const json = await lerJsonSeguro<{ url?: string } & ApiErro>(resposta);
  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao fazer upload." };
  }

  if (!json.url) {
    return { ok: false, erro: "Erro ao fazer upload." };
  }

  return { ok: true, dados: { url: json.url } };
}

type PendenciaInfoApi = {
  id: string;
  tipo: string;
  descricao: string;
  leadId?: string;
  leadNome?: string;
  leadTelefone?: string;
  funcionarioNome?: string;
  pdvNome?: string;
  estagioNome?: string;
  criadoEm?: string;
  updatedAt?: string;
  [chave: string]: unknown;
};

export async function listarPendenciasGlobaisKanban(): Promise<ResultadoApi<{ pendencias: PendenciaInfoApi[] }>> {
  try {
    const resposta = await fetch("/api/pendencias");
    const json = await lerJsonSeguro<{ pendencias?: PendenciaInfoApi[] } & ApiErro>(resposta);

    if (!resposta.ok) {
      return { ok: false, erro: json.erro ?? "Erro ao buscar pendências." };
    }

    return { ok: true, dados: { pendencias: json.pendencias ?? [] } };
  } catch (erro) {
    console.error("Erro de rede ao buscar pendências:", erro);
    return { ok: false, erro: "Erro de conexão. Verifique sua internet." };
  }
}

export async function redistribuirNegociosEmAtendimentoKanban(
  payload: PayloadRedistribuirEmAtendimentoKanban = {},
): Promise<
  ResultadoApi<{
    avaliados: number;
    elegiveis: number;
    reatribuidos: number;
    ignoradosSemDestino: number;
  }>
> {
  const resposta = await fetch("/api/leads/redistribuir-em-atendimento", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await lerJsonSeguro<{
    avaliados?: number;
    elegiveis?: number;
    reatribuidos?: number;
    ignoradosSemDestino?: number;
  } & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao redistribuir leads em atendimento." };
  }

  return {
    ok: true,
    dados: {
      avaliados: json.avaliados ?? 0,
      elegiveis: json.elegiveis ?? 0,
      reatribuidos: json.reatribuidos ?? 0,
      ignoradosSemDestino: json.ignoradosSemDestino ?? 0,
    },
  };
}
