import type { ReactNode } from "react";
import type { Lead, StatusSalvamentoDetalhesNegocio } from "../types";
import { MENSAGENS_KANBAN } from "../utils/mensagens";

export type StatusSalvarDrawer = {
  texto: string;
  tom: "erro" | "alerta" | "sucesso" | "loading";
};

export function formatarHorarioDetalhesNegocio(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

export function obterAtalhoSalvarNegocio(platform?: string | null) {
  return platform?.toLowerCase().includes("mac") ? "Cmd+S" : "Ctrl+S";
}

export function obterIdsLeadsRelacionadosNegocio(negocioSelecionado: Lead | null) {
  const ids = new Set<string>();

  if (negocioSelecionado?.lead_principal?.id) {
    ids.add(negocioSelecionado.lead_principal.id);
  }

  for (const lead of negocioSelecionado?.leads_vinculados ?? []) {
    ids.add(lead.id);
  }

  return Array.from(ids);
}

export function criarDescricaoRemocaoLeads(quantidadeLeadsRelacionados: number) {
  if (quantidadeLeadsRelacionados === 0) {
    return "Este negócio nao possui leads vinculados para remover em conjunto.";
  }

  return quantidadeLeadsRelacionados === 1
    ? "Também remover o lead vinculado a este negócio."
    : `Também remover os ${quantidadeLeadsRelacionados} leads vinculados a este negócio.`;
}

type CriarStatusSalvarParams = {
  atalhoSalvar: string;
  erroDetalhesNegocio: string | null;
  temAlteracoes: boolean;
  salvando: boolean;
  salvandoAutomaticamente: boolean;
  salvamentoAutomaticoPendente: boolean;
  salvo: boolean;
  statusSalvamentoDetalhes: StatusSalvamentoDetalhesNegocio;
  textoUltimaAtualizacao: string | null;
};

export function criarStatusSalvarNegocio(params: CriarStatusSalvarParams): StatusSalvarDrawer {
  const {
    atalhoSalvar,
    erroDetalhesNegocio,
    temAlteracoes,
    salvando,
    salvandoAutomaticamente,
    salvamentoAutomaticoPendente,
    salvo,
    statusSalvamentoDetalhes,
    textoUltimaAtualizacao,
  } = params;

  if (erroDetalhesNegocio) {
    return {
      texto: erroDetalhesNegocio,
      tom: "erro",
    };
  }

  const mapaStatus: Record<StatusSalvamentoDetalhesNegocio, StatusSalvarDrawer> = {
    erro: {
      texto: erroDetalhesNegocio ?? MENSAGENS_KANBAN.erro.generico,
      tom: "erro",
    },
    salvando_automaticamente: {
      texto: "Salvando alterações automaticamente...",
      tom: "loading",
    },
    salvando_manual: {
      texto: "Salvando alterações do negócio...",
      tom: "loading",
    },
    salvo: {
      texto: textoUltimaAtualizacao ? `Última atualização salva às ${textoUltimaAtualizacao}.` : "Alterações salvas com sucesso.",
      tom: "sucesso",
    },
    pendente: {
      texto: "Alterações detectadas. Salvamento automático em instantes.",
      tom: "alerta",
    },
    ocioso: {
      texto: textoUltimaAtualizacao
        ? `Tudo salvo. Última atualização às ${textoUltimaAtualizacao}.`
        : `Edite os detalhes e use ${atalhoSalvar} para salvar na hora.`,
      tom: "sucesso",
    },
  };

  if (!salvando && !salvandoAutomaticamente && !salvo && temAlteracoes && !salvamentoAutomaticoPendente) {
    return {
      texto: "Existem alterações locais aguardando salvamento.",
      tom: "alerta",
    };
  }

  return mapaStatus[statusSalvamentoDetalhes];
}

export function criarClasseStatusSalvar(tom: StatusSalvarDrawer["tom"]) {
  switch (tom) {
    case "erro":
      return "text-rose-200";
    case "loading":
    case "alerta":
      return "text-amber-100";
    case "sucesso":
    default:
      return "text-emerald-100";
  }
}

export function criarIconeStatusSalvar(tom: StatusSalvarDrawer["tom"], icones: {
  alerta: ReactNode;
  loading: ReactNode;
}) {
  if (tom === "erro" || tom === "alerta") {
    return icones.alerta;
  }

  if (tom === "loading") {
    return icones.loading;
  }

  return null;
}
