"use client";

import type { Estagio, Funcionario, KanbanFilters, KpiKanban, OrdenacaoKanban, OrigemStats, Pdv, Pipeline, ResumoPendencias } from "../types";
import { KanbanHeaderDesktop } from "./kanban-header-desktop";
import { KanbanHeaderMobile } from "./kanban-header-mobile";

type KanbanHeaderProps = {
  dialogNovoNegocioAberto: boolean;
  setDialogNovoNegocioAberto: (aberto: boolean) => void;
  criarNegocio: (evento: React.FormEvent<HTMLFormElement>) => Promise<void>;
  estagios: Estagio[];
  funcionarios: Funcionario[];
  pdvs: Pdv[];
  pipelines: Pipeline[];
  pipelineSelecionadaId: string;
  setPipelineSelecionadaId: (id: string) => void;
  perfil: string;
  valorNovoNegocio: string;
  setValorNovoNegocio: (valor: string) => void;
  erroNovoNegocio: string | null;
  setErroNovoNegocio: (erro: string | null) => void;
  criandoNegocio: boolean;
  cargoNovoNegocio: string;
  estagioAberto: string;
  estagioNovoNegocio: string;
  setEstagioNovoNegocio: (id: string) => void;
  setCargoNovoNegocio: (cargo: string) => void;
  filtros: KanbanFilters;
  setFiltros: (filtros: KanbanFilters) => void;
  busca: string;
  setBusca: (busca: string) => void;
  ordenacao: OrdenacaoKanban;
  setOrdenacao: (o: OrdenacaoKanban) => void;
  modoFocoPendencias: boolean;
  setModoFocoPendencias: (v: boolean) => void;
  resumoPendencias: ResumoPendencias;
  totalNegocios: number;
  totalPipeline: number;
  negociosParados: number;
  pendenciasCriticas: number;
  kpis: KpiKanban[];
  origemStats: OrigemStats;
  notificacoesAtivadas: boolean;
  alternarNotificacoes: () => Promise<boolean>;
  permissaoNotificacao: () => NotificationPermission | "unknown";
  redistribuindoNegociosEmAtendimento: boolean;
  redistribuirNegociosEmAtendimento: () => Promise<void>;
};

export function KanbanHeader(props: KanbanHeaderProps) {
  const {
    pipelines,
    pipelineSelecionadaId,
    setPipelineSelecionadaId,
    setDialogNovoNegocioAberto,
    filtros,
    setFiltros,
    busca,
    setBusca,
    totalNegocios,
    totalPipeline,
    negociosParados,
    pendenciasCriticas,
    kpis,
    origemStats,
  } = props;

  const commonProps = {
    pipelines,
    pipelineSelecionadaId,
    setPipelineSelecionadaId,
    onDialogNovoNegocioChange: setDialogNovoNegocioAberto,
    filtros,
    setFiltros,
    busca,
    setBusca,
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <KanbanHeaderDesktop
          {...commonProps}
          totalNegocios={totalNegocios}
          pendenciasCriticas={pendenciasCriticas}
          totalPipeline={totalPipeline}
          negociosParados={negociosParados}
          kpis={kpis}
          origemStats={origemStats}
        />
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <KanbanHeaderMobile {...commonProps} />
      </div>
    </>
  );
}
