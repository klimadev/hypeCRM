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
  email?: string | null;
  fonte?: string | null;
  empresa_origem?: string | null;
  observacoes?: string | null;
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

export type PayloadCriarLead = {
  nome: string;
  telefone: string;
  id_funcionario?: string;
  email?: string | null;
  fonte?: string | null;
  empresa_origem?: string | null;
  observacoes?: string | null;
  origem?: "MANUAL" | "SINCRONIZACAO_WHATSAPP" | "ANUNCIO_CTWA";
  anuncio_titulo?: string | null;
  anuncio_descricao?: string | null;
  anuncio_url?: string | null;
  dados_extras?: string | null;
};

export type PayloadAtualizarLead = {
  nome?: string;
  telefone?: string;
  id_funcionario?: string;
  email?: string | null;
  fonte?: string | null;
  empresa_origem?: string | null;
  observacoes?: string | null;
  ativo?: boolean;
};

export type ResultadoRemocaoLead = {
  sucesso: boolean;
  negocios_removidos?: number;
};

export type CampanhaResumoApi = {
  id: string;
  nome: string;
  status: string;
  inicioEm: string;
  ultimoAgendamentoEm: string | null;
  selecionadosTotal: number;
  elegiveisTotal: number;
  ignoradosTotal: number;
  duracaoEstimadaSegundos: number;
  criadoEm: string;
  atualizadoEm: string;
  resumoStatus: {
    pendentes: number;
    processando: number;
    enviados: number;
    falhas: number;
    cancelados: number;
    total: number;
  };
};

export type CampanhaDetalheApi = {
  id: string;
  nome: string;
  status: string;
  mensagemTemplate: string;
  inicioEm: string;
  ultimoAgendamentoEm: string | null;
  selecionadosTotal: number;
  elegiveisTotal: number;
  ignoradosTotal: number;
  duracaoEstimadaSegundos: number;
  resumoStatus: CampanhaResumoApi["resumoStatus"];
  inelegiveis: Array<{ leadId: string; nome: string; motivo: string }>;
  itens: Array<{
    id: string;
    leadId: string | null;
    leadNome: string;
    instancia: string;
    remoteJid: string;
    mensagem: string;
    agendadoPara: string;
    status: string;
    tentativas: number;
    erro: string | null;
    enviadoEm: string | null;
    criadoEm: string;
  }>;
};

export type PayloadCriarCampanhaDisparo = {
  nome: string;
  leadIds: string[];
  mensagemTemplate: string;
  iniciarAgora: boolean;
  inicioEm?: string;
  delayMinSegundos: number;
  delayMaxSegundos: number;
  jitterMsMax: number;
  filtrosSnapshot?: Record<string, unknown>;
  pdvInstancias: Array<{ pdvId: string; instanciaId: string }>;
  fallbackInstanciaSemPdvId?: string;
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

export async function criarLeadContato(payload: PayloadCriarLead): Promise<ResultadoApi<{ lead: ApiLeadContato }>> {
  const resposta = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await lerJsonSeguro<{ lead?: ApiLeadContato } & ApiErro>(resposta);
  if (!resposta.ok || !json.lead) {
    return { ok: false, erro: json.erro ?? "Erro ao criar o lead." };
  }

  return {
    ok: true,
    dados: {
      lead: json.lead,
    },
  };
}

export async function atualizarLeadContato(
  idLead: string,
  payload: PayloadAtualizarLead,
): Promise<ResultadoApi<{ lead: ApiLeadContato }>> {
  const resposta = await fetch(`/api/leads/${idLead}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await lerJsonSeguro<{ lead?: ApiLeadContato } & ApiErro>(resposta);
  if (!resposta.ok || !json.lead) {
    return { ok: false, erro: json.erro ?? "Erro ao atualizar o lead." };
  }

  return {
    ok: true,
    dados: {
      lead: json.lead,
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

export async function criarCampanhaDisparoLeadsApi(payload: PayloadCriarCampanhaDisparo): Promise<
  ResultadoApi<{
    campanhaId: string;
    resumo: {
      selecionadosTotal: number;
      elegiveisTotal: number;
      ignoradosTotal: number;
      duracaoEstimadaSegundos: number;
    };
    inelegiveis: Array<{ leadId: string; nome: string; motivo: string }>;
    inicio: string;
    ultimoAgendamento: string | null;
  }>
> {
  const resposta = await fetch("/api/leads/disparos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await lerJsonSeguro<{
    campanhaId?: string;
    resumo?: {
      selecionadosTotal?: number;
      elegiveisTotal?: number;
      ignoradosTotal?: number;
      duracaoEstimadaSegundos?: number;
    };
    inelegiveis?: Array<{ leadId: string; nome: string; motivo: string }>;
    inicio?: string;
    ultimoAgendamento?: string | null;
  } & ApiErro>(resposta);

  if (!resposta.ok || !json.campanhaId || !json.resumo || !json.inicio) {
    return { ok: false, erro: json.erro ?? "Erro ao criar campanha de disparo." };
  }

  return {
    ok: true,
    dados: {
      campanhaId: json.campanhaId,
      resumo: {
        selecionadosTotal: json.resumo.selecionadosTotal ?? 0,
        elegiveisTotal: json.resumo.elegiveisTotal ?? 0,
        ignoradosTotal: json.resumo.ignoradosTotal ?? 0,
        duracaoEstimadaSegundos: json.resumo.duracaoEstimadaSegundos ?? 0,
      },
      inelegiveis: json.inelegiveis ?? [],
      inicio: json.inicio,
      ultimoAgendamento: json.ultimoAgendamento ?? null,
    },
  };
}

export async function listarCampanhasDisparoLeadsApi(limite = 20): Promise<ResultadoApi<{ campanhas: CampanhaResumoApi[] }>> {
  const resposta = await fetch(`/api/leads/disparos?limite=${limite}`, { cache: "no-store" });
  const json = await lerJsonSeguro<{ campanhas?: CampanhaResumoApi[] } & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao listar campanhas." };
  }

  return { ok: true, dados: { campanhas: json.campanhas ?? [] } };
}

export async function detalharCampanhaDisparoLeadsApi(id: string): Promise<ResultadoApi<{ campanha: CampanhaDetalheApi }>> {
  const resposta = await fetch(`/api/leads/disparos/${id}`, { cache: "no-store" });
  const json = await lerJsonSeguro<{ campanha?: CampanhaDetalheApi } & ApiErro>(resposta);
  if (!resposta.ok || !json.campanha) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar campanha." };
  }
  return { ok: true, dados: { campanha: json.campanha } };
}

export async function cancelarCampanhaDisparoLeadsApi(id: string): Promise<ResultadoApi<{ cancelados: number }>> {
  const resposta = await fetch(`/api/leads/disparos/${id}/cancelar`, { method: "POST" });
  const json = await lerJsonSeguro<{ cancelados?: number } & ApiErro>(resposta);
  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao cancelar campanha." };
  }
  return { ok: true, dados: { cancelados: json.cancelados ?? 0 } };
}
