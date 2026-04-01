import { useMemo, useState } from "react";
import { calcularPendenciasLead } from "@/lib/calculo-pendencias";
import type {
  Estagio,
  KanbanFilters,
  Lead,
  OrdenacaoKanban,
  OrigemStats,
  PendenciaNegocioInfo,
} from "../types";
import { getGravidadePendencia } from "./use-pendencias-globais.utils";

function negocioPassaFiltros(
  pendenciaInfo: PendenciaNegocioInfo | undefined,
  filtros: KanbanFilters,
  negocio: Lead,
): boolean {
  if (filtros.status === "com_pendencia" && !pendenciaInfo) return false;
  if (filtros.status === "sem_pendencia" && pendenciaInfo) return false;

  if (filtros.gravidade !== "todas" && pendenciaInfo) {
    if (pendenciaInfo.gravidadeMaxima !== filtros.gravidade) return false;
  }

  if (filtros.tipo !== "todos" && pendenciaInfo) {
    if (!pendenciaInfo.tipos.includes(filtros.tipo)) return false;
  }

  // Filtro por origem (WhatsApp, Anúncio CTWA, Manual)
  if (filtros.origem !== "todos") {
    if (filtros.origem === "ANUNCIO_CTWA" && negocio.origem !== "ANUNCIO_CTWA") return false;
    if (filtros.origem === "SINCRONIZACAO_WHATSAPP" && negocio.origem !== "SINCRONIZACAO_WHATSAPP") return false;
    if (filtros.origem === "MANUAL" && negocio.origem !== "MANUAL") return false;
  }

  return true;
}

type UseKanbanDerivacoesParams = {
  estagios: Estagio[];
  negocios: Lead[];
  negocioSelecionado: Lead | null;
};

export function useKanbanDerivacoes({
  estagios,
  negocios,
  negocioSelecionado,
}: UseKanbanDerivacoesParams) {
  const [filtros, setFiltros] = useState<KanbanFilters>({
    status: "todos",
    gravidade: "todas",
    tipo: "todos",
    pdv: null,
    origem: "todos",
  });
  const [modoFocoPendencias, setModoFocoPendencias] = useState(false);
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoKanban>("recente");

  const pendenciasPorNegocio = useMemo((): Record<string, PendenciaNegocioInfo> => {
    const mapa: Record<string, PendenciaNegocioInfo> = {};
    const mapaEstagios = Object.fromEntries(estagios.map((estagio) => [estagio.id, estagio]));

    for (const negocio of negocios) {
      const estagio = mapaEstagios[negocio.id_estagio];
      if (!estagio) continue;

      const pendencias = calcularPendenciasLead(negocio, estagio);
      if (pendencias.length === 0) continue;

      const tipos = pendencias.map((pendencia) => pendencia.tipo);
      let gravidadeMaxima: "info" | "alerta" | "critica" = "info";

      for (const tipo of tipos) {
        const gravidade = getGravidadePendencia(tipo);
        const ordem = { info: 0, alerta: 1, critica: 2 };
        if (ordem[gravidade] > ordem[gravidadeMaxima]) {
          gravidadeMaxima = gravidade;
        }
      }

      mapa[negocio.id] = {
        total: pendencias.length,
        naoResolvidas: pendencias.filter((pendencia) => !pendencia.resolvida).length,
        tipos,
        gravidadeMaxima,
      };
    }

    return mapa;
  }, [estagios, negocios]);

  const pendenciasNegocio = useMemo(() => {
    if (!negocioSelecionado) return [];
    const estagio = estagios.find((item) => item.id === negocioSelecionado.id_estagio);
    if (!estagio) return [];
    return calcularPendenciasLead(negocioSelecionado, estagio);
  }, [negocioSelecionado, estagios]);

  const negociosPorEstagio = useMemo(() => {
    const mapa: Record<string, Lead[]> = {};
    for (const estagio of estagios) {
      mapa[estagio.id] = [];
    }

    for (const negocio of negocios) {
      if (mapa[negocio.id_estagio]) {
        mapa[negocio.id_estagio].push(negocio);
      }
    }

    return mapa;
  }, [estagios, negocios]);

  const negociosFiltradosPorEstagio = useMemo(() => {
    const filtrosAtivos = modoFocoPendencias
      ? { status: "com_pendencia" as const, gravidade: "todas" as const, tipo: "todos" as const, pdv: filtros.pdv, origem: filtros.origem }
      : filtros;

    const mapa: Record<string, Lead[]> = {};
    for (const estagio of estagios) {
      mapa[estagio.id] = [];
    }

    for (const negocio of negocios) {
      if (!mapa[negocio.id_estagio]) continue;

      // Filter by PDV
      if (filtrosAtivos.pdv && negocio.id_pdv !== filtrosAtivos.pdv) continue;

      const pendenciaInfo = pendenciasPorNegocio[negocio.id];
      if (!negocioPassaFiltros(pendenciaInfo, filtrosAtivos, negocio)) continue;

      if (busca) {
        const buscaLower = busca.toLowerCase();
        const matchesNome = negocio.nome.toLowerCase().includes(buscaLower);
        const matchesTelefone = negocio.telefone.includes(busca);
        if (!matchesNome && !matchesTelefone) continue;
      }

      mapa[negocio.id_estagio].push(negocio);
    }

    for (const estagioId of Object.keys(mapa)) {
      mapa[estagioId] = [...mapa[estagioId]].sort((a, b) => {
        switch (ordenacao) {
          case "valor_maior":
            return b.valor_oportunidade - a.valor_oportunidade;
          case "valor_menor":
            return a.valor_oportunidade - b.valor_oportunidade;
          case "recente":
            return new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime();
          case "antigo":
            return new Date(a.atualizado_em).getTime() - new Date(b.atualizado_em).getTime();
          case "nome":
            return a.nome.localeCompare(b.nome);
          default:
            return 0;
        }
      });
    }

    return mapa;
  }, [estagios, negocios, pendenciasPorNegocio, filtros, modoFocoPendencias, busca, ordenacao]);

  const estagioAberto = useMemo(
    () => estagios.find((estagio) => estagio.tipo === "ABERTO")?.id ?? estagios[0]?.id ?? "",
    [estagios],
  );

  const origemStats = useMemo((): OrigemStats => {
    const stats: OrigemStats = {
      total: negocios.length,
      anuncios: 0,
      whatsapp: 0,
      manual: 0,
    };

    for (const negocio of negocios) {
      if (negocio.origem === "ANUNCIO_CTWA") {
        stats.anuncios++;
      } else if (negocio.origem === "SINCRONIZACAO_WHATSAPP") {
        stats.whatsapp++;
      } else if (negocio.origem === "MANUAL") {
        stats.manual++;
      }
    }

    return stats;
  }, [negocios]);

  const totalPipeline = useMemo(
    () => Object.values(negociosFiltradosPorEstagio).flat().reduce((total, negocio) => total + negocio.valor_oportunidade, 0),
    [negociosFiltradosPorEstagio],
  );

  const negociosParados = useMemo(() => {
    return Object.values(pendenciasPorNegocio).filter((pendencia) => pendencia.tipos.includes("ESTAGIO_PARADO")).length;
  }, [pendenciasPorNegocio]);

  return {
    filtros,
    setFiltros,
    modoFocoPendencias,
    setModoFocoPendencias,
    busca,
    setBusca,
    ordenacao,
    setOrdenacao,
    pendenciasPorNegocio,
    pendenciasNegocio,
    negociosPorEstagio,
    negociosFiltradosPorEstagio,
    estagioAberto,
    origemStats,
    totalPipeline,
    negociosParados,
  };
}
