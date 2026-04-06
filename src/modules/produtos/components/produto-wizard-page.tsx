"use client";

import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, Eye, EyeOff, LayoutTemplate } from "lucide-react";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Produto } from "@/lib/api/produtos";
import type { UseProdutoWizardReturn, EtapaProdutoForm } from "../types";
import { useProdutoWizard } from "../hooks/use-produto-wizard";
import { ProdutoLayoutBuilder } from "./produto-layout-builder";
import { ProdutoLayoutPreview } from "./produto-layout-preview";

type ProdutoWizardPageProps = {
  produtoInicial?: Produto | null;
};

function EtapaCard({ 
  etapa, 
  indice, 
  atual, 
  onClique 
}: { 
  etapa: { id: EtapaProdutoForm; titulo: string };
  indice: number;
  atual: boolean;
  onClique: (id: EtapaProdutoForm) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClique(etapa.id)}
      className={cn(
        "w-full rounded-[14px] border border-transparent bg-transparent px-4 py-3 text-left transition-colors duration-[var(--duration-fast)] ease-[var(--ease-productive)]",
        atual && "border-[var(--border-subtle)] bg-[var(--surface-elevated)]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          atual 
            ? "bg-[var(--brand)] text-white" 
            : "border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-tertiary)]"
        )}>
          {indice + 1}
        </div>
        <span className={cn(
          "text-sm font-medium",
          atual ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
        )}>
          {etapa.titulo}
        </span>
      </div>
    </button>
  );
}

function EtapasNavegacao({ 
  etapas, 
  indiceAtual, 
  onIrParaEtapa 
}: { 
  etapas: Array<{ id: EtapaProdutoForm; titulo: string }>;
  indiceAtual: number;
  onIrParaEtapa: (etapa: EtapaProdutoForm) => void;
}) {
  return (
    <div className="space-y-1">
      {etapas.map((etapa, indice) => (
        <EtapaCard
          key={etapa.id}
          etapa={etapa}
          indice={indice}
          atual={indice === indiceAtual}
          onClique={onIrParaEtapa}
        />
      ))}
    </div>
  );
}

export function ModuloProdutoWizard({ produtoInicial }: ProdutoWizardPageProps) {
  const vm = useProdutoWizard(produtoInicial);
  const [mostrarPreview, setMostrarPreview] = useState(false);

  function renderizarConteudoEtapa(wizard: UseProdutoWizardReturn) {
    if (wizard.etapaAtual === "basico") {
      return (
        <Card className="border border-[var(--border-subtle)] bg-[var(--surface)]">
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Nome do Produto</label>
              <Input
                value={wizard.form.nome}
                onChange={(event) => wizard.atualizarForm({ nome: event.target.value })}
                placeholder="Ex.: Consórcio Auto Premium"
                className="h-10"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Descrição Interna</label>
              <Textarea
                value={wizard.form.descricao}
                onChange={(event) => wizard.atualizarForm({ descricao: event.target.value })}
                placeholder="Ex.: Use quando o lead pedir simulação com prazo, valor e observações comerciais."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Status</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={wizard.form.ativo ? "default" : "outline"}
                  className={cn(wizard.form.ativo ? "bg-[var(--brand)] hover:bg-[var(--brand-strong)]" : "")}
                  onClick={() => wizard.atualizarForm({ ativo: true })}
                >
                  Ativo
                </Button>
                <Button
                  type="button"
                  variant={!wizard.form.ativo ? "default" : "outline"}
                  className={cn(
                    !wizard.form.ativo ? "bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[color:rgba(255,255,255,0.08)]" : ""
                  )}
                  onClick={() => wizard.atualizarForm({ ativo: false })}
                >
                  Rascunho
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (wizard.etapaAtual === "campos") {
      return (
        <Card className="border border-[var(--border-subtle)] bg-[var(--surface)]">
          <CardContent className="pt-6">
            <ProdutoLayoutBuilder
              campos={wizard.form.schemaLayout.campos}
              onAdicionarCampo={wizard.adicionarCampo}
              onAtualizarCampo={wizard.atualizarCampo}
              onRemoverCampo={wizard.removerCampo}
              onMoverCampo={wizard.moverCampo}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border border-[var(--border-subtle)] bg-[var(--surface)]">
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Nome</p>
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]" title={wizard.form.nome}>
                {wizard.form.nome || "—"}
              </p>
            </div>
            <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Campos</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{vm.resumoFormulario.quantidadeCampos}</p>
            </div>
          </div>

          <div className="rounded-[16px] border border-[color:rgba(245,158,11,0.2)] bg-[color:rgba(245,158,11,0.1)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--warning)] text-sm font-bold text-[color:#1a1200]">
                !
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[var(--text-primary)]">Revisão necessária</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {!wizard.form.nome.trim() && "• Defina um nome para o produto\n"}
                  {vm.resumoFormulario.quantidadeCampos === 0 && "• Adicione pelo menos um campo"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title={vm.produtoEmEdicao ? "Editar Produto" : "Criar Produto"}
        icon={<LayoutTemplate className="h-6 w-6" />}
        iconTone="emerald"
        actions={
          <Button 
            type="button" 
            variant="ghost" 
            onClick={vm.voltarCatalogo} 
            className="gap-2 text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Voltar</span>
          </Button>
        }
      />

      {vm.erro && (
        <div className="mb-6 rounded-[16px] border border-[color:rgba(244,63,94,0.2)] bg-[color:rgba(244,63,94,0.12)] p-4">
          <p className="font-semibold text-[var(--text-primary)]">Erro</p>
          <p className="text-sm text-[color:#ffb4c2]">{vm.erro}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-2">
          <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Etapas</div>
            <EtapasNavegacao
              etapas={vm.etapas}
              indiceAtual={vm.indiceEtapaAtual}
              onIrParaEtapa={vm.irParaEtapa}
            />
          </div>
        </div>

        <div className="space-y-4">
          {renderizarConteudoEtapa(vm)}

          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={vm.voltarCatalogo}
              className="gap-2 text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Cancelar</span>
            </Button>

            <div className="flex items-center gap-3">
              {vm.indiceEtapaAtual > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={vm.voltarEtapa}
                  className="gap-2"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  <span className="text-sm font-medium">Voltar</span>
                </Button>
              )}

              {vm.indiceEtapaAtual < vm.etapas.length - 1 ? (
                <Button
                  type="button"
                  onClick={vm.avancarEtapa}
                  disabled={!vm.podeAvancarEtapaAtual}
                  className="gap-2 bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] disabled:opacity-50"
                >
                  <span className="text-sm font-medium">Continuar</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void vm.salvarProduto()}
                  disabled={vm.salvando}
                  className="gap-2 bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] disabled:opacity-50"
                >
                  {vm.salvando ? (
                    <>
                      <span className="text-sm font-medium">Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Salvar</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

              <div className="text-center">
            <button
              type="button"
              onClick={() => setMostrarPreview(!mostrarPreview)}
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {mostrarPreview ? (
                <span className="inline-flex items-center gap-1">
                  <EyeOff className="h-4 w-4" />
                  Ocultar preview
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Ver preview
                </span>
              )}
            </button>
          </div>

          {mostrarPreview && (
            <div className="mt-4">
              <ProdutoLayoutPreview schemaLayout={vm.form.schemaLayout} />
            </div>
          )}
        </div>
      </div>
    </ModulePageShell>
  );
}
