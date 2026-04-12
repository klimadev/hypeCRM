import { formataMoeda } from "@/lib/utils";
import type { ApiNegocioResumo } from "@/lib/api/negocios";
import type {
  ApiEstagioLead,
  FormularioNovoLead,
  LeadLinhaTabela,
  LeadNegocioResumo,
} from "./types";
import type {
  ApiFuncionarioContato,
  ApiLeadContato,
  ApiPdvContato,
} from "@/lib/api/leads";

export function criarFormularioNovoLead(idFuncionario = ""): FormularioNovoLead {
  return {
    nome: "",
    telefone: "",
    email: "",
    fonte: "",
    empresaOrigem: "",
    observacoes: "",
    idFuncionario,
  };
}

export function criarFormularioEdicaoLead(lead: Pick<ApiLeadContato, "nome" | "telefone" | "email" | "fonte" | "empresa_origem" | "observacoes" | "id_funcionario">): FormularioNovoLead {
  return {
    nome: lead.nome,
    telefone: lead.telefone,
    email: lead.email ?? "",
    fonte: lead.fonte ?? "",
    empresaOrigem: lead.empresa_origem ?? "",
    observacoes: lead.observacoes ?? "",
    idFuncionario: lead.id_funcionario,
  };
}

export function normalizarTextoOpcional(valor: string) {
  const texto = valor.trim();
  return texto.length > 0 ? texto : null;
}

export function criarPayloadLeadContato(formularioNovoLead: FormularioNovoLead) {
  return {
    nome: formularioNovoLead.nome.trim(),
    telefone: formularioNovoLead.telefone,
    id_funcionario: formularioNovoLead.idFuncionario || undefined,
    email: normalizarTextoOpcional(formularioNovoLead.email),
    fonte: normalizarTextoOpcional(formularioNovoLead.fonte),
    empresa_origem: normalizarTextoOpcional(formularioNovoLead.empresaOrigem),
    observacoes: normalizarTextoOpcional(formularioNovoLead.observacoes),
  };
}

export function criarResumoLeads(totalFiltrado: number, total: number) {
  return {
    title: `${totalFiltrado.toLocaleString("pt-BR")} lead${totalFiltrado === 1 ? "" : "s"}`,
    resumoTotal: `${total.toLocaleString("pt-BR")} no total`,
  };
}

export function formatarDataLead(dataIso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dataIso));
}

export function rotuloOrigemLead(origem?: string | null) {
  switch (origem) {
    case "ANUNCIO_CTWA":
      return "Anúncio";
    case "SINCRONIZACAO_WHATSAPP":
      return "WhatsApp";
    case "MANUAL":
      return "Manual";
    default:
      return "—";
  }
}

export function rotuloEstagioLead(estagio?: ApiEstagioLead | null) {
  return estagio?.nome ?? "—";
}

export function rotuloNegocioLead(negocio?: ApiNegocioResumo | null): LeadNegocioResumo {
  if (!negocio) {
    return {
      titulo: "—",
      subtitulo: "Sem negócio vinculado",
    };
  }

  const leadPrincipal = negocio.lead_principal ?? negocio.leads?.[0] ?? null;
  const estagio = negocio.estagio?.nome ?? "—";
  const funil = negocio.funil?.nome ?? "Funil";

  return {
    titulo: negocio.titulo,
    subtitulo: leadPrincipal
      ? `${leadPrincipal.nome} • ${funil} • ${estagio}`
      : `${funil} • ${estagio}`,
  };
}

export function mapearLinhaLead(params: {
  lead: ApiLeadContato;
  estagiosPorId: Map<string, ApiEstagioLead>;
  funcionariosPorId: Map<string, ApiFuncionarioContato>;
  pdvsPorId: Map<string, string>;
  negociosPorId: Map<string, ApiNegocioResumo>;
}): LeadLinhaTabela {
  const { lead, estagiosPorId, funcionariosPorId, pdvsPorId, negociosPorId } = params;
  const idNegocio = lead.id_negocio ?? null;
  const negocio = idNegocio ? negociosPorId.get(idNegocio) ?? null : null;
  const negocioResumo = negocio
    ? rotuloNegocioLead(negocio)
    : idNegocio
      ? {
          titulo: "Negócio vinculado",
          subtitulo: `ID ${idNegocio}`,
        }
      : {
          titulo: "—",
          subtitulo: "Sem negócio vinculado",
        };

  return {
    id: lead.id,
    lead,
    nome: lead.nome,
    telefone: lead.telefone,
    etapa: rotuloEstagioLead(estagiosPorId.get(lead.id_estagio)),
    responsavel: funcionariosPorId.get(lead.id_funcionario)?.nome ?? "—",
    pdv: lead.id_pdv ? pdvsPorId.get(lead.id_pdv) ?? "—" : "—",
    origem: rotuloOrigemLead(lead.origem),
    valor: formataMoeda(lead.valor_oportunidade),
    atualizadoEm: formatarDataLead(lead.atualizado_em),
    idNegocio,
    negocioResumo,
  };
}

export function filtrarLeads(params: {
  busca: string;
  leads: ApiLeadContato[];
  estagiosPorId: Map<string, ApiEstagioLead>;
  funcionariosPorId: Map<string, ApiFuncionarioContato>;
  pdvsPorId: Map<string, string>;
  negociosPorId: Map<string, ApiNegocioResumo>;
}) {
  const { busca, leads, estagiosPorId, funcionariosPorId, pdvsPorId, negociosPorId } = params;
  const termo = busca.trim().toLowerCase();
  if (!termo) {
    return leads;
  }

  return leads.filter((lead) => {
    const responsavel = funcionariosPorId.get(lead.id_funcionario)?.nome ?? "";
    const pdvNome = lead.id_pdv ? pdvsPorId.get(lead.id_pdv) ?? "" : "";
    const estagioNome = rotuloEstagioLead(estagiosPorId.get(lead.id_estagio));
    const negocioNome = lead.id_negocio ? negociosPorId.get(lead.id_negocio)?.titulo ?? "" : "";

    return [lead.nome, lead.telefone, responsavel, pdvNome, estagioNome, negocioNome, rotuloOrigemLead(lead.origem)]
      .join(" ")
      .toLowerCase()
      .includes(termo);
  });
}

export function filtrarNegociosParaVinculo(busca: string, negocios: ApiNegocioResumo[]) {
  const termo = busca.trim().toLowerCase();
  if (!termo) {
    return negocios;
  }

  return negocios.filter((negocio) => {
    const leadPrincipal = negocio.lead_principal ?? negocio.leads?.[0] ?? null;
    const estagio = negocio.estagio?.nome ?? "";
    const funil = negocio.funil?.nome ?? "";
    const responsavel = negocio.funcionario?.nome ?? "";

    return [negocio.titulo, leadPrincipal?.nome ?? "", leadPrincipal?.telefone ?? "", estagio, funil, responsavel]
      .join(" ")
      .toLowerCase()
      .includes(termo);
  });
}

export function obterNegociosRelacionadosAoLead(lead: ApiLeadContato | null, negocios: ApiNegocioResumo[]) {
  if (!lead) {
    return [];
  }

  const mapa = new Map<string, ApiNegocioResumo>();

  for (const negocio of negocios) {
    if (negocio.id === lead.id_negocio || negocio.lead_principal?.id === lead.id) {
      mapa.set(negocio.id, negocio);
    }
  }

  return Array.from(mapa.values());
}

export function criarMapaPdvs(pdvs: ApiPdvContato[]) {
  return new Map(pdvs.map((item) => [item.id, item.nome] as const));
}

export function obterLeadsSelecionados(idsSelecionados: string[], leads: ApiLeadContato[]) {
  const idsSelecionadosSet = new Set(idsSelecionados);
  return leads.filter((lead) => idsSelecionadosSet.has(lead.id));
}

export function calcularResumoSelecaoDisparo(leadsSelecionados: ApiLeadContato[], pdvsPorId: Map<string, string>) {
  const pdvSet = new Set<string>();
  let semPdvSelecionados = 0;

  for (const lead of leadsSelecionados) {
    if (lead.id_pdv) {
      pdvSet.add(lead.id_pdv);
      continue;
    }
    semPdvSelecionados += 1;
  }

  const pdvsPresentesNaSelecao = Array.from(pdvSet).map((id) => ({
    id,
    nome: pdvsPorId.get(id) ?? "PDV",
  }));

  return {
    pdvsPresentesNaSelecao,
    semPdvSelecionados,
  };
}
