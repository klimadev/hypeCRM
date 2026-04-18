"use client";
import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKanbanModule } from "./hooks/use-kanban-module";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { Button } from "@/components/ui/button";
import { KanbanHeader } from "./components/kanban-header";
import { KanbanBoard } from "./components/kanban-board";
import { KanbanPipelineCatalog } from "./components/kanban-pipeline-catalog";
import { PipelineModal } from "./components/pipeline-modal";
import { PerdaDialog } from "./components/perda-dialog";
import { NegocioDetailsDrawer } from "./components/lead-details-drawer";
import type { Lead, Props } from "./types";
import { LayoutList } from "lucide-react";

export function ModuloKanban({ perfil, idUsuario }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pipelineSelecionadaIdQuery =
    searchParams.get("pipelineId")
    ?? searchParams.get("id_funil")
    ?? searchParams.get("funilId")
    ?? undefined;

  const vm = useKanbanModule({
    perfil,
    idUsuario,
    pipelineSelecionadaIdInicial: pipelineSelecionadaIdQuery,
  });

  const mostrarKanbanDireto =
    Boolean(searchParams.get("negocio"))
    || Boolean(searchParams.get("lead"))
    || Boolean(pipelineSelecionadaIdQuery);

  const { negocioSelecionado, negocios, setNegocioSelecionado } = vm;

  const navegarParaPipeline = useCallback(
    (pipelineId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("pipelineId", pipelineId);
      params.delete("negocio");
      params.delete("lead");
      params.delete("id_funil");
      params.delete("funilId");
      const query = params.toString();

      router.replace(query ? `/kanban?${query}` : "/kanban");
    },
    [searchParams, router],
  );

  const navegarParaCatalogo = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("pipelineId");
    params.delete("id_funil");
    params.delete("funilId");
    const query = params.toString();

    router.replace(query ? `/kanban?${query}` : "/kanban");
  }, [searchParams, router]);

  const handleNegocioClick = useCallback(
    (negocio: Lead) => {
      vm.setNegocioSelecionado(negocio);
      const params = new URLSearchParams(searchParams.toString());
      params.set("negocio", negocio.id);
      if (vm.pipelineSelecionadaId) {
        params.set("pipelineId", vm.pipelineSelecionadaId);
      }
      params.delete("lead");
      params.delete("id_funil");
      params.delete("funilId");
      router.replace(`/kanban?${params.toString()}`);
    },
    [searchParams, router, vm],
  );

  const handleDrawerOpenChange = useCallback(
    (aberto: boolean) => {
      if (!aberto) {
        vm.setNegocioSelecionado(null);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("lead");
        params.delete("negocio");
        const query = params.toString();
        router.replace(query ? `/kanban?${query}` : "/kanban");
      }
    },
    [searchParams, router, vm],
  );

  useEffect(() => {
    if (!mostrarKanbanDireto || !vm.pipelineSelecionadaId) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    const parametroAtivo =
      params.get("pipelineId")
      ?? params.get("id_funil")
      ?? params.get("funilId");

    const pipelineIdAtivo = vm.pipelineSelecionadaId;

    if (parametroAtivo === pipelineIdAtivo) {
      return;
    }

    if (parametroAtivo) {
      params.delete("id_funil");
      params.delete("funilId");
      params.set("pipelineId", pipelineIdAtivo);
    } else {
      params.set("pipelineId", pipelineIdAtivo);
    }

    const query = params.toString();
    router.replace(query ? `/kanban?${query}` : "/kanban");
  }, [mostrarKanbanDireto, searchParams, vm.pipelineSelecionadaId, router]);

  useEffect(() => {
    const negocioId = searchParams.get("negocio");
    const leadId = searchParams.get("lead");

    if ((!negocioId && !leadId) || negocios.length === 0) {
      return;
    }

    const negocio = negocioId
      ? negocios.find((item) => item.id === negocioId)
      : negocios.find((item) => {
        if (!leadId) return false;

        if (item.lead_principal?.id === leadId) {
          return true;
        }

        return (item.leads_vinculados ?? []).some((lead) => lead.id === leadId);
      });

    if (!negocio) {
      setNegocioSelecionado(null);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("negocio");
      params.delete("lead");
      const query = params.toString();
      router.replace(query ? `/kanban?${query}` : "/kanban");
      return;
    }

    if (negocioSelecionado?.id !== negocio.id) {
      setNegocioSelecionado(negocio);
    }
  }, [negocioSelecionado?.id, negocios, router, searchParams, setNegocioSelecionado]);

  return (
    <ModulePageShell>
      {mostrarKanbanDireto ? (
        <>
          <div className="mb-2 flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={navegarParaCatalogo}
              className="rounded-xl border-[var(--border-subtle)]"
            >
              <LayoutList className="mr-2 h-4 w-4" />
              Voltar ao catálogo
            </Button>
          </div>

          <KanbanHeader
            pipelines={vm.pipelines}
            pipelineSelecionadaId={vm.pipelineSelecionadaId}
            setPipelineSelecionadaId={(pipelineId) => {
              vm.setPipelineSelecionadaId(pipelineId);
              const params = new URLSearchParams(searchParams.toString());
              params.set("pipelineId", pipelineId);
              params.delete("negocio");
              params.delete("lead");
              params.delete("id_funil");
              params.delete("funilId");
              const query = params.toString();
              router.replace(query ? `/kanban?${query}` : "/kanban");
            }}
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
        </>
      ) : (
        <KanbanPipelineCatalog
          pipelines={vm.pipelines}
          selecionadaId={vm.pipelineSelecionadaId}
          onOpenPipeline={navegarParaPipeline}
          onCreatePipeline={() => vm.setDialogPipelineAberto(true)}
          onEditPipeline={(pipeline) => {
            vm.setPipelineEditando({ id: pipeline.id, nome: pipeline.nome, descricao: pipeline.descricao });
            vm.setDialogPipelineAberto(true);
          }}
          perfil={perfil}
        />
      )}

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
        produtosDisponiveis={vm.produtosDisponiveis}
        carregandoProdutosDisponiveis={vm.carregandoProdutosDisponiveis}
        leadsDisponiveis={vm.leadsDisponiveis}
        carregandoLeadsDisponiveis={vm.carregandoLeadsDisponiveis}
        salvandoVinculos={vm.salvandoVinculos}
        removendoNegocio={vm.removendoNegocio}
        erroVinculos={vm.erroVinculos}
        setErroVinculos={vm.setErroVinculos}
        onSalvarVinculos={vm.atualizarVinculosNegocio}
        onRemoverNegocio={vm.removerNegocio}
      />

      <PipelineModal
        open={vm.dialogPipelineAberto}
        onOpenChange={(aberto) => {
          vm.setDialogPipelineAberto(aberto);
          if (!aberto) vm.setPipelineEditando(null);
        }}
        onSubmit={vm.pipelineEditando ? vm.atualizarPipeline : vm.criarPipeline}
        modoEdicao={!!vm.pipelineEditando}
        dadosIniciais={vm.pipelineEditando ?? undefined}
        carregando={vm.criandoPipeline}
      />
    </ModulePageShell>
  );
}
