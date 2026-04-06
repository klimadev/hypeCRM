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

export function ModuloLeads() {
  const vm = useLeadsModule();

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title="Leads"
        subtitle="Lista operacional de contatos e vínculos comerciais."
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
            onAtualizar={() => void vm.carregarDados(true)}
            carregando={vm.carregando}
            recarregando={vm.recarregando}
          />
        }
      />

      <InlineStatusAlert variant="error" message={vm.erro} />

      {vm.carregando ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
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
          onEditar={vm.abrirEdicaoLead}
          onVincular={vm.abrirVinculo}
          onRemover={vm.abrirRemocaoLead}
        />
      )}

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
    </ModulePageShell>
  );
}
