"use client";

import { Users } from "lucide-react";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { EmptyState } from "@/modules/kanban/components/empty-state";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLeadsModule } from "./hooks/use-leads-module";
import { LeadsToolbar } from "./components/leads-toolbar";
import { LeadsTable } from "./components/leads-table";
import { VinculoNegocioDialog } from "./components/vinculo-negocio-dialog";
import { LeadFormDialog } from "./components/lead-form-dialog";
import { LeadDeleteDialog } from "./components/lead-delete-dialog";
import { LeadsBulkActions } from "./components/leads-bulk-actions";
import { LeadsBulkDeleteDialog } from "./components/leads-bulk-delete-dialog";
import { LeadDisparoCampaignDialog } from "./components/lead-disparo-campaign-dialog";
import { LeadDisparoCampaignsPanel } from "./components/lead-disparo-campaigns-panel";
import { LeadsImportCsvDialog } from "./components/leads-import-csv-dialog";
import { LeadConversaoDialog } from "./components/lead-conversao-dialog";

export function ModuloLeads() {
  const vm = useLeadsModule();

  return (
    <ModulePageShell spacing="lg" className={vm.totalSelecionados > 0 ? "pb-24" : ""}>
      <ModulePageHeader
        title="Leads"
        subtitle="Gerencie seus contatos e negócios."
        icon={<Users className="h-5 w-5" />}
        badges={[
          <span key="total" className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
            {vm.title}
          </span>,
        ]}
        actions={
          <LeadsToolbar
            busca={vm.busca}
            onBuscaChange={vm.setBusca}
            onNovoLead={vm.abrirNovoLead}
            onImportarCsv={vm.abrirImportacaoCsv}
            onAtualizar={() => void vm.carregarDados(true)}
            carregando={vm.carregando}
            recarregando={vm.recarregando}
          />
        }
      />

      <InlineStatusAlert variant="error" message={vm.erro} />
      <InlineStatusAlert variant="error" message={vm.erroDisparo} />

      <LeadDisparoCampaignsPanel
        campanhas={vm.campanhas}
        carregando={vm.carregandoCampanhas}
        detalheIdAberta={vm.campanhaDetalheIdAberta}
        detalhe={vm.campanhaDetalhe}
        carregandoDetalhe={vm.carregandoDetalheCampanha}
        erro={vm.erroDisparo}
        onAbrirDetalhe={(id) => void vm.abrirDetalheCampanha(id)}
        onFecharDetalhe={vm.fecharDetalheCampanha}
        onCancelar={(id) => void vm.cancelarCampanha(id)}
      />

      {vm.carregando ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
          <Users className="h-5 w-5 animate-pulse text-[var(--text-secondary)]" />
        </div>
      ) : vm.linhasTabela.length === 0 ? (
        <EmptyState
          titulo={vm.busca ? "Nenhum lead encontrado" : "Ainda não há leads listados"}
          descricao={vm.busca ? "Tente outro termo ou limpe a busca." : "Os novos leads aparecerão aqui após a captura."}
          acao={
            vm.busca ? (
              <Button variant="outline" onClick={vm.limparBusca}>Limpar busca</Button>
            ) : (
              <Button onClick={vm.abrirNovoLead} className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar lead
              </Button>
            )
          }
        />
      ) : (
        <LeadsTable
          linhas={vm.linhasTabela}
          resumoTotal={vm.resumoTotal}
          idsSelecionados={vm.idsSelecionados}
          todosDaPaginaSelecionados={vm.linhasTabela.length > 0 && vm.linhasTabela.every((item) => vm.idsSelecionados.includes(item.id))}
          onAlternarSelecao={vm.alternarSelecao}
          onAlternarSelecaoPagina={vm.alternarSelecaoPagina}
          onEditar={vm.abrirEdicaoLead}
          onVincular={vm.abrirVinculo}
          onRemover={vm.abrirRemocaoLead}
        />
      )}

      <LeadsBulkActions
        totalSelecionados={vm.totalSelecionados}
        totalFiltrados={vm.leadsFiltrados.length}
        todosFiltradosSelecionados={vm.todosFiltradosSelecionados}
        carregando={vm.removendoLeadsEmMassa || vm.convertendoLeads || vm.disparandoCampanha}
        onSelecionarTodosFiltrados={vm.selecionarTodosFiltrados}
        onLimparSelecao={vm.limparSelecao}
        onDisparar={vm.abrirDialogDisparo}
        onConverterEmNegocios={vm.abrirDialogConversao}
        onRemover={vm.abrirRemocaoMassa}
      />

      <LeadDisparoCampaignDialog
        open={vm.dialogDisparoAberto}
        onOpenChange={(aberto) => (aberto ? vm.abrirDialogDisparo() : vm.fecharDialogDisparo())}
        formulario={vm.formularioDisparo}
        pdvsPresentes={vm.pdvsPresentesNaSelecao}
        semPdvSelecionados={vm.semPdvSelecionados}
        instancias={vm.instanciasWhatsapp}
        erro={vm.erroDisparo}
        enviando={vm.disparandoCampanha}
        onCampoChange={vm.atualizarFormularioDisparo}
        onInstanciaPdvChange={vm.atualizarInstanciaPdvDisparo}
        onConfirmar={() => void vm.submitCampanhaDisparo()}
      />

      <VinculoNegocioDialog
        open={vm.dialogVinculoAberto}
        lead={vm.leadEmVinculo}
        negocios={vm.negociosParaVinculo}
        negocioSelecionadoId={vm.negocioSelecionadoId}
        buscaNegocio={vm.buscaNegocio}
        vinculando={vm.vinculando}
        erro={vm.erroVinculo}
        onOpenChange={(aberto) => (aberto ? undefined : vm.fecharVinculo())}
        onBuscaNegocioChange={vm.setBuscaNegocio}
        onSelecionarNegocio={vm.setNegocioSelecionadoId}
        onConfirmar={() => void vm.confirmarVinculo()}
      />

      <LeadFormDialog
        open={vm.dialogNovoLeadAberto}
        funcionarios={vm.funcionarios}
        formulario={vm.formularioNovoLead}
        leadEmEdicao={vm.leadEmEdicao}
        criandoLead={vm.criandoLead}
        erro={vm.erroNovoLead}
        onOpenChange={(aberto) => {
          if (!aberto) {
            vm.fecharNovoLead();
          }
        }}
        onCampoChange={vm.atualizarFormularioNovoLead}
        onSubmit={vm.submitNovoLead}
      />

      <LeadsImportCsvDialog
        open={vm.dialogImportacaoAberto}
        funcionarios={vm.funcionarios}
        idFuncionarioPadrao={vm.formularioNovoLead.idFuncionario}
        importing={vm.importandoCsv}
        erro={vm.erroImportacaoCsv}
        onOpenChange={(aberto) => {
          if (!aberto) {
            vm.fecharImportacaoCsv();
          }
        }}
        onSubmit={vm.importarLeadsCsv}
      />

      <LeadDeleteDialog
        lead={vm.leadParaRemover}
        open={Boolean(vm.leadParaRemover)}
        removendoLead={vm.removendoLead}
        removerNegociosVinculados={vm.removerNegociosVinculados}
        erro={vm.erroRemocaoLead}
        negociosRelacionados={vm.negociosRelacionadosAoLead}
        onOpenChange={(aberto) => {
          if (!aberto) {
            vm.fecharRemocaoLead();
          }
        }}
        onRemoverNegociosChange={vm.setRemoverNegociosVinculados}
        onConfirmar={() => void vm.confirmarRemocaoLead()}
      />

      <LeadsBulkDeleteDialog
        leads={vm.leadsSelecionadosParaRemocao}
        open={vm.dialogRemocaoMassaAberto}
        removendo={vm.removendoLeadsEmMassa}
        removerNegociosVinculados={vm.removerNegociosVinculados}
        erro={vm.erroRemocaoLead}
        onOpenChange={(aberto) => {
          if (!aberto) {
            vm.fecharRemocaoMassa();
          }
        }}
        onRemoverNegociosChange={vm.setRemoverNegociosVinculados}
        onConfirmar={() => void vm.confirmarRemocaoMassa()}
      />

      <LeadConversaoDialog
        open={vm.dialogConversaoAberto}
        onOpenChange={(aberto) => (aberto ? vm.abrirDialogConversao() : vm.fecharDialogConversao())}
        totalLeads={vm.totalSelecionados}
        leadsPreview={vm.leadsSelecionados.map((lead) => ({ id: lead.id, nome: lead.nome }))}
        estagios={vm.estagios}
        funcionarios={vm.funcionarios}
        formulario={vm.formularioConversao}
        erro={vm.erroConversao}
        convertendo={vm.convertendoLeads}
        onCampoChange={vm.atualizarFormularioConversao}
        onConfirmar={() => void vm.submitConversaoLeadsEmNegocios()}
        leadsComNegocio={vm.leadsComNegocio}
        leadsSemNegocio={vm.leadsSemNegocio}
        dialogConflitoAberto={vm.dialogConflitoAberto}
        acaoConflito={vm.acaoConflito}
        onAcaoConflitoChange={vm.setAcaoConflito}
        onConfirmarConflito={() => void vm.confirmarConflito()}
      />
    </ModulePageShell>
  );
}
