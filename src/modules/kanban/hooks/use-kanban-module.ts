"use client";

import { useMemo, useState, useCallback } from "react";
import { formataMoeda } from "@/lib/utils";
import type { KpiKanban, Lead, UseKanbanModuleReturn, Props } from "../types";
import { useToast } from "@/components/ui/toast";
import { useKanbanDerivacoes } from "./use-kanban-derivacoes";
import { useKanbanMovimentacao } from "./use-kanban-movimentacao";
import { useKanbanDados } from "./use-kanban-dados";
import { useKanbanOperacoes } from "./use-kanban-operacoes";
import { useKanbanDetalhesNegocio } from "./use-kanban-detalhes-lead";

export function useKanbanModule({
  perfil,
  idUsuario,
  pipelineSelecionadaIdInicial,
}: Props): UseKanbanModuleReturn {
  const { addToast } = useToast();
  const {
    estagios,
    negocios,
    setNegocios,
    pipelines,
    pipelineSelecionadaId,
    setPipelineSelecionadaId,
    funcionarios,
    pdvs,
    bootstrap,
    registrarMovimentoLocal,
    resumoPendencias,
    recarregarPendencias,
    notificacoesAtivadas,
    alternarNotificacoes,
    permissaoNotificacao,
  } = useKanbanDados({ addToast, pipelineSelecionadaIdInicial });

  const [negocioSelecionado, setNegocioSelecionado] = useState<Lead | null>(null);
  const [dialogNovoNegocioAberto, setDialogNovoNegocioAberto] = useState(false);
  const [dialogPipelineAberto, setDialogPipelineAberto] = useState(false);
  const [pipelineEditando, setPipelineEditando] = useState<{ id: string; nome: string; descricao?: string | null } | null>(null);
  const [criandoPipeline, setCriandoPipeline] = useState(false);
  const [stageIdAtivo, setStageIdAtivo] = useState("");

  const [cargoNovoNegocio, setCargoNovoNegocio] = useState<{ id_funcionario: string } | null>(null);
  const [estagioNovoNegocio, setEstagioNovoNegocio] = useState("");
  const [valorNovoNegocio, setValorNovoNegocio] = useState("");

  const {
    movimentoPendente,
    setMovimentoPendente,
    motivoPerda,
    setMotivoPerda,
    aoDragEnd,
    confirmarPerda,
    optimisticNegocios,
  } = useKanbanMovimentacao({
    negocios,
    estagios,
    setNegocios,
    registrarMovimentoLocal,
    addToast,
  });

  const {
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
  } = useKanbanDerivacoes({
    estagios,
    negocios: optimisticNegocios,
    negocioSelecionado,
  });

  const kpis = useMemo<KpiKanban[]>(() => [
    {
      id: "ativos",
      label: "Pipeline visível",
      valor: `${optimisticNegocios.length}`,
      descricao: "negócios em acompanhamento",
      destaque: "brand",
    },
    {
      id: "valor",
      label: "Valor em jogo",
      valor: formataMoeda(totalPipeline),
      descricao: "soma dos cards visíveis",
      destaque: "success",
    },
    {
      id: "parados",
      label: "Precisam de ação",
      valor: `${negociosParados}`,
      descricao: "parados há mais de 3 dias",
      destaque: "warning",
    },
    {
      id: "criticos",
      label: "Urgências",
      valor: `${resumoPendencias?.porGravidade.critica ?? 0}`,
      descricao: "pendências críticas agora",
      destaque: "info",
    },
  ], [optimisticNegocios.length, negociosParados, resumoPendencias?.porGravidade.critica, totalPipeline]);

  const stageIdAtivoEfetivo = useMemo(() => {
    if (estagios.length === 0) return "";

    const stageSelecionadoExiste = estagios.some((estagio) => estagio.id === stageIdAtivo);
    const stageSelecionadoTemNegocios = stageSelecionadoExiste
      ? (negociosFiltradosPorEstagio[stageIdAtivo] ?? []).length > 0
      : false;

    if (stageSelecionadoExiste && stageSelecionadoTemNegocios) {
      return stageIdAtivo;
    }

    const primeiroStageComNegocios = estagios.find((estagio) => (negociosFiltradosPorEstagio[estagio.id] ?? []).length > 0);
    if (primeiroStageComNegocios) {
      return primeiroStageComNegocios.id;
    }

    return stageSelecionadoExiste ? stageIdAtivo : estagios[0].id;
  }, [estagios, negociosFiltradosPorEstagio, stageIdAtivo]);

  const {
    erroDetalhesNegocio,
    setErroDetalhesNegocio,
    salvando,
    salvo,
    salvandoAutomaticamente,
    salvamentoAutomaticoPendente,
    ultimaAtualizacaoSalvaEm,
    statusSalvamentoDetalhes,
    salvarDetalhesNegocio,
    aoMudarNegocio,
    leadsDisponiveis,
    carregandoLeadsDisponiveis,
    salvandoVinculos,
    removendoNegocio,
    erroVinculos,
    setErroVinculos,
    atualizarVinculosNegocio,
    removerNegocio,
  } = useKanbanDetalhesNegocio({
    negocioSelecionado,
    setNegocioSelecionado,
    setNegocios,
  });

  const {
    erroNovoNegocio,
    setErroNovoNegocio,
    criandoNegocio,
    redistribuindoNegociosEmAtendimento,
    criarNegocio,
    redistribuirNegociosEmAtendimento,
  } = useKanbanOperacoes({
    perfil,
    idUsuario,
    valorNovoNegocio,
    pipelineSelecionadaId,
    cargoNovoNegocio,
    setNegocios,
    setDialogNovoNegocioAberto,
    setCargoNovoNegocio,
    setEstagioNovoNegocio,
    setValorNovoNegocio,
    bootstrap,
  });

  const criarPipelineHandler = useCallback(
    async (data: { nome: string; descricao?: string }) => {
      setCriandoPipeline(true);
      try {
        const resposta = await fetch("/api/pipelines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!resposta.ok) {
          const erro = await resposta.json();
          addToast({
            type: "error",
            title: erro.message || "Erro ao criar pipeline",
          });
          return;
        }
        addToast({
          type: "success",
          title: "Pipeline criado com sucesso",
        });
        setDialogPipelineAberto(false);
        bootstrap();
      } catch {
        addToast({
          type: "error",
          title: "Erro ao criar pipeline",
        });
      } finally {
        setCriandoPipeline(false);
      }
    },
    [addToast, bootstrap],
  );

  const atualizarPipelineHandler = useCallback(
    async (data: { nome: string; descricao?: string }) => {
      if (!pipelineEditando) return;
      setCriandoPipeline(true);
      try {
        const resposta = await fetch(`/api/pipelines/${pipelineEditando.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!resposta.ok) {
          const erro = await resposta.json();
          addToast({
            type: "error",
            title: erro.message || "Erro ao atualizar pipeline",
          });
          return;
        }
        addToast({
          type: "success",
          title: "Pipeline atualizado com sucesso",
        });
        setDialogPipelineAberto(false);
        setPipelineEditando(null);
        bootstrap();
      } catch {
        addToast({
          type: "error",
          title: "Erro ao atualizar pipeline",
        });
      } finally {
        setCriandoPipeline(false);
      }
    },
    [addToast, pipelineEditando, bootstrap],
  );

  return {
    estagios,
    negocios: optimisticNegocios,
    funcionarios,
    pdvs,
    pipelines,
    pipelineSelecionadaId,
    setPipelineSelecionadaId,
    negociosPorEstagio,
    negociosFiltradosPorEstagio,
    pendenciasPorNegocio,
    resumoPendencias,
    negocioSelecionado,
    pendenciasNegocio,
    dialogNovoNegocioAberto,
    setDialogNovoNegocioAberto,
    movimentoPendente,
    setMovimentoPendente,
    motivoPerda,
    setMotivoPerda,
    valorNovoNegocio,
    setValorNovoNegocio,
    erroNovoNegocio,
    setErroNovoNegocio,
    criandoNegocio,
    salvando,
    salvo,
    salvandoAutomaticamente,
    salvamentoAutomaticoPendente,
    ultimaAtualizacaoSalvaEm,
    statusSalvamentoDetalhes,
    erroDetalhesNegocio,
    setErroDetalhesNegocio,
    salvarDetalhesNegocio,
    setNegocioSelecionado,
    leadsDisponiveis,
    carregandoLeadsDisponiveis,
    salvandoVinculos,
    removendoNegocio,
    erroVinculos,
    setErroVinculos,
    atualizarVinculosNegocio,
    removerNegocio,
    criarNegocio,
    redistribuindoNegociosEmAtendimento,
    redistribuirNegociosEmAtendimento,
    confirmarPerda,
    aoDragEnd,
    aoMudarNegocio,
    estagioAberto,
    cargoNovoNegocio,
    setCargoNovoNegocio,
    setEstagioNovoNegocio,
    estagioNovoNegocio,
    filtros,
    setFiltros,
    busca,
    setBusca,
    ordenacao,
    setOrdenacao,
    modoFocoPendencias,
    setModoFocoPendencias,
    stageIdAtivo: stageIdAtivoEfetivo,
    setStageIdAtivo,
    recarregarPendencias,
    dialogPipelineAberto,
    setDialogPipelineAberto,
    pipelineEditando,
    setPipelineEditando,
    criandoPipeline,
    criarPipeline: criarPipelineHandler,
    atualizarPipeline: atualizarPipelineHandler,
    totalNegocios: optimisticNegocios.length,
    pendenciasCriticas: resumoPendencias?.porGravidade.critica ?? 0,
    origemStats,
    totalPipeline,
    negociosParados,
    kpis,
    notificacoesAtivadas,
    alternarNotificacoes,
    permissaoNotificacao,
  };
}
