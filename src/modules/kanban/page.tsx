"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKanbanModule } from "./hooks/use-kanban-module";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { KanbanHeader } from "./components/kanban-header";
import { KanbanBoard } from "./components/kanban-board";
import { PerdaDialog } from "./components/perda-dialog";
import { NegocioDetailsDrawer } from "./components/lead-details-drawer";
import type { Lead, Props } from "./types";

export function ModuloKanban({ perfil, idUsuario }: Props) {
  const vm = useKanbanModule({ perfil, idUsuario });
  const searchParams = useSearchParams();
  const router = useRouter();
  const { negocioSelecionado, negocios, setNegocioSelecionado } = vm;

  useEffect(() => {
    const negocioId = searchParams.get("negocio") ?? searchParams.get("lead");
    if (!negocioId || negocios.length === 0) return;

    const negocio = negocios.find((item) => item.id === negocioId);
    if (!negocio) return;

    if (negocioSelecionado?.id !== negocio.id) {
      setNegocioSelecionado(negocio);
    }
  }, [negocioSelecionado?.id, negocios, searchParams, setNegocioSelecionado]);

  const handleNegocioClick = (negocio: Lead) => {
    vm.setNegocioSelecionado(negocio);
    const params = new URLSearchParams(searchParams.toString());
    params.set("negocio", negocio.id);
    params.delete("lead");
    router.replace(`/kanban?${params.toString()}`);
  };

  const handleDrawerOpenChange = (aberto: boolean) => {
    if (!aberto) {
      vm.setNegocioSelecionado(null);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("lead");
      params.delete("negocio");
      const query = params.toString();
      router.replace(query ? `/kanban?${query}` : "/kanban");
    }
  };

  return (
    <ModulePageShell className="rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(9,9,11,0.96),rgba(12,12,14,0.94))] shadow-[var(--shadow-md)]">
      <KanbanHeader
        dialogNovoNegocioAberto={vm.dialogNovoNegocioAberto}
        setDialogNovoNegocioAberto={vm.setDialogNovoNegocioAberto}
        criarNegocio={vm.criarNegocio}
        estagios={vm.estagios}
        funcionarios={vm.funcionarios}
        pdvs={vm.pdvs}
        perfil={perfil}
        valorNovoNegocio={vm.valorNovoNegocio}
        setValorNovoNegocio={vm.setValorNovoNegocio}
        erroNovoNegocio={vm.erroNovoNegocio}
        setErroNovoNegocio={vm.setErroNovoNegocio}
        criandoNegocio={vm.criandoNegocio}
        cargoNovoNegocio={vm.cargoNovoNegocio}
        estagioAberto={vm.estagioAberto}
        estagioNovoNegocio={vm.estagioNovoNegocio}
        setEstagioNovoNegocio={vm.setEstagioNovoNegocio}
        setCargoNovoNegocio={vm.setCargoNovoNegocio}
        filtros={vm.filtros}
        setFiltros={vm.setFiltros}
        busca={vm.busca}
        setBusca={vm.setBusca}
        ordenacao={vm.ordenacao}
        setOrdenacao={vm.setOrdenacao}
        modoFocoPendencias={vm.modoFocoPendencias}
        setModoFocoPendencias={vm.setModoFocoPendencias}
        resumoPendencias={vm.resumoPendencias}
        totalNegocios={vm.totalNegocios}
        totalPipeline={vm.totalPipeline}
        negociosParados={vm.negociosParados}
        pendenciasCriticas={vm.pendenciasCriticas}
        kpis={vm.kpis}
        origemStats={vm.origemStats}
        notificacoesAtivadas={vm.notificacoesAtivadas}
        alternarNotificacoes={vm.alternarNotificacoes}
        permissaoNotificacao={vm.permissaoNotificacao}
        redistribuindoNegociosEmAtendimento={vm.redistribuindoNegociosEmAtendimento}
        redistribuirNegociosEmAtendimento={vm.redistribuirNegociosEmAtendimento}
      />

      <KanbanBoard
        estagios={vm.estagios}
        negociosPorEstagio={vm.negociosPorEstagio}
        negociosFiltradosPorEstagio={vm.negociosFiltradosPorEstagio}
        pendenciasPorNegocio={vm.pendenciasPorNegocio}
        onDragEnd={vm.aoDragEnd}
        onNegocioClick={handleNegocioClick}
        modoFocoPendencias={vm.modoFocoPendencias}
        stageIdAtivo={vm.stageIdAtivo}
        setStageIdAtivo={vm.setStageIdAtivo}
        funcionarios={vm.funcionarios}
        temFiltrosAtivos={
          vm.filtros.status !== "todos" ||
          vm.filtros.gravidade !== "todas" ||
          vm.filtros.tipo !== "todos" ||
          vm.filtros.pdv !== null ||
          vm.filtros.origem !== "todos" ||
          vm.busca !== ""
        }
      />

      <PerdaDialog
        movimentoPendente={vm.movimentoPendente}
        motivoPerda={vm.motivoPerda}
        setMotivoPerda={vm.setMotivoPerda}
        onConfirmarPerda={vm.confirmarPerda}
        onOpenChange={(aberto) => !aberto && vm.setMovimentoPendente(null)}
      />

      <NegocioDetailsDrawer
        negocioSelecionado={vm.negocioSelecionado}
        pendenciasNegocio={vm.pendenciasNegocio}
        onOpenChange={handleDrawerOpenChange}
        perfil={perfil}
        estagios={vm.estagios}
        funcionarios={vm.funcionarios}
        onMudarNegocio={vm.aoMudarNegocio}
        salvando={vm.salvando}
        salvo={vm.salvo}
        salvandoAutomaticamente={vm.salvandoAutomaticamente}
        salvamentoAutomaticoPendente={vm.salvamentoAutomaticoPendente}
        ultimaAtualizacaoSalvaEm={vm.ultimaAtualizacaoSalvaEm}
        statusSalvamentoDetalhes={vm.statusSalvamentoDetalhes}
        erroDetalhesNegocio={vm.erroDetalhesNegocio}
        setErroDetalhesNegocio={vm.setErroDetalhesNegocio}
        onSalvarDetalhesNegocio={vm.salvarDetalhesNegocio}
        leadsDisponiveis={vm.leadsDisponiveis}
        carregandoLeadsDisponiveis={vm.carregandoLeadsDisponiveis}
        salvandoVinculos={vm.salvandoVinculos}
        removendoNegocio={vm.removendoNegocio}
        erroVinculos={vm.erroVinculos}
        setErroVinculos={vm.setErroVinculos}
        onSalvarVinculos={vm.atualizarVinculosNegocio}
        onRemoverNegocio={vm.removerNegocio}
      />
    </ModulePageShell>
  );
}
