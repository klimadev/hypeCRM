"use client";

import { useEffect, useMemo, useState } from "react";
import { obterWhatsappStats } from "@/lib/api/whatsapp";
import type { Lead, UseKanbanModuleReturn, Props } from "../types";
import { useToast } from "@/components/ui/toast";
import { useKanbanDerivacoes } from "./use-kanban-derivacoes";
import { useKanbanMovimentacao } from "./use-kanban-movimentacao";
import { useKanbanDados } from "./use-kanban-dados";
import { useKanbanOperacoes } from "./use-kanban-operacoes";
import { useKanbanDetalhesLead } from "./use-kanban-detalhes-lead";

export function useKanbanModule({ perfil, idUsuario }: Props): UseKanbanModuleReturn {
  const { addToast } = useToast();
  const {
    estagios,
    leads,
    setLeads,
    funcionarios,
    pdvs,
    bootstrap,
    registrarMovimentoLocal,
    resumoPendencias,
    recarregarPendencias,
    notificacoesAtivadas,
    alternarNotificacoes,
    permissaoNotificacao,
  } = useKanbanDados({ addToast });

  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [dialogNovoLeadAberto, setDialogNovoLeadAberto] = useState(false);
  const [stageIdAtivo, setStageIdAtivo] = useState("");

  const [cargoNovoLead, setCargoNovoLead] = useState<{ id_funcionario: string } | null>(null);
  const [estagioNovoLead, setEstagioNovoLead] = useState("");
  const [telefoneNovoLead, setTelefoneNovoLead] = useState("");
  const [valorNovoLead, setValorNovoLead] = useState("");
  const [ultimaSincronizacaoWhatsapp, setUltimaSincronizacaoWhatsapp] = useState<Date | null>(null);
  const [instanciasAtivasCount, setInstanciasAtivasCount] = useState(0);

  useEffect(() => {
    let ativo = true;

    async function carregarStatsWhatsapp() {
      const resultado = await obterWhatsappStats();
      if (!ativo || !resultado.ok) {
        return;
      }

      setInstanciasAtivasCount(resultado.dados.ativas);
    }

    void carregarStatsWhatsapp();

    return () => {
      ativo = false;
    };
  }, []);

  const {
    filtros,
    setFiltros,
    modoFocoPendencias,
    setModoFocoPendencias,
    busca,
    setBusca,
    ordenacao,
    setOrdenacao,
    pendenciasPorLead,
    pendenciasLead,
    leadsPorEstagio,
    leadsFiltradosPorEstagio,
    estagioAberto,
    origemStats,
  } = useKanbanDerivacoes({
    estagios,
    leads,
    leadSelecionado,
  });

  const stageIdAtivoEfetivo = useMemo(() => {
    if (estagios.length === 0) return "";

    const stageSelecionadoExiste = estagios.some((estagio) => estagio.id === stageIdAtivo);
    const stageSelecionadoTemLeads = stageSelecionadoExiste
      ? (leadsFiltradosPorEstagio[stageIdAtivo] ?? []).length > 0
      : false;

    if (stageSelecionadoExiste && stageSelecionadoTemLeads) {
      return stageIdAtivo;
    }

    const primeiroStageComLeads = estagios.find((estagio) => (leadsFiltradosPorEstagio[estagio.id] ?? []).length > 0);
    if (primeiroStageComLeads) {
      return primeiroStageComLeads.id;
    }

    return stageSelecionadoExiste ? stageIdAtivo : estagios[0].id;
  }, [estagios, leadsFiltradosPorEstagio, stageIdAtivo]);

  const {
    movimentoPendente,
    setMovimentoPendente,
    motivoPerda,
    setMotivoPerda,
    aoDragEnd,
    confirmarPerda,
  } = useKanbanMovimentacao({
    leads,
    estagios,
    setLeads,
    registrarMovimentoLocal,
    addToast,
  });

  const {
    erroDetalhesLead,
    setErroDetalhesLead,
    salvando,
    salvo,
    salvandoAutomaticamente,
    salvamentoAutomaticoPendente,
    ultimaAtualizacaoSalvaEm,
    statusSalvamentoDetalhes,
    salvarDetalhesLead,
    aoMudarLead,
  } = useKanbanDetalhesLead({
    leadSelecionado,
    setLeadSelecionado,
    setLeads,
  });

  const {
    erroNovoLead,
    setErroNovoLead,
    criandoLead,
    sincronizandoWhatsapp,
    redistribuindoEmAtendimento,
    criarLead,
    sincronizarWhatsapp,
    redistribuirLeadsEmAtendimento,
    excluirLead,
    excluirTodosIndefinidos,
  } = useKanbanOperacoes({
    perfil,
    idUsuario,
    telefoneNovoLead,
    valorNovoLead,
    cargoNovoLead,
    setLeads,
    setLeadSelecionado,
    setDialogNovoLeadAberto,
    setCargoNovoLead,
    setEstagioNovoLead,
    setTelefoneNovoLead,
    setValorNovoLead,
    bootstrap,
    setErroDetalhesLead,
    aoSincronizarWhatsapp: setUltimaSincronizacaoWhatsapp,
  });

  return {
    estagios,
    leads,
    funcionarios,
    pdvs,
    leadsPorEstagio,
    leadsFiltradosPorEstagio,
    pendenciasPorLead,
    todasPendencias: [],
    resumoPendencias,
    leadSelecionado,
    pendenciasLead,
    dialogNovoLeadAberto,
    setDialogNovoLeadAberto,
    movimentoPendente,
    setMovimentoPendente,
    motivoPerda,
    setMotivoPerda,
    telefoneNovoLead,
    setTelefoneNovoLead,
    valorNovoLead,
    setValorNovoLead,
    erroNovoLead,
    setErroNovoLead,
    criandoLead,
    salvando,
    salvo,
    salvandoAutomaticamente,
    salvamentoAutomaticoPendente,
    ultimaAtualizacaoSalvaEm,
    statusSalvamentoDetalhes,
    erroDetalhesLead,
    setErroDetalhesLead,
    salvarDetalhesLead,
    setLeadSelecionado,
    criarLead,
    sincronizandoWhatsapp,
    redistribuindoEmAtendimento,
    sincronizarWhatsapp,
    redistribuirLeadsEmAtendimento,
    confirmarPerda,
    aoDragEnd,
    aoMudarLead,
    excluirLead,
    excluirTodosIndefinidos: () => excluirTodosIndefinidos(leads, estagios),
    estagioAberto,
    cargoNovoLead,
    setCargoNovoLead,
    setEstagioNovoLead,
    estagioNovoLead,
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
    totalLeads: leads.length,
    pendenciasCriticas: resumoPendencias?.porGravidade.critica ?? 0,
    origemStats,
    ultimaSincronizacaoWhatsapp,
    instanciasAtivasCount,
    notificacoesAtivadas,
    alternarNotificacoes,
    permissaoNotificacao,
  };
}
