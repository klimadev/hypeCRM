"use client";

import { ArrowUpRight, Boxes, PackageCheck, PackagePlus } from "lucide-react";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProdutosCatalogo } from "./hooks/use-produtos-catalogo";
import { ProdutosLista } from "./components/produtos-lista";
import type { ProdutosPageInitialState } from "./types";

type ModuloProdutosProps = {
  estadoInicial: ProdutosPageInitialState;
};

export function ModuloProdutos({ estadoInicial }: ModuloProdutosProps) {
  const vm = useProdutosCatalogo(estadoInicial);

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title="Produtos internos"
        subtitle="Monte formularios internos claros e reutilizaveis para o time anexar no lead sem precisar aprender uma ferramenta complexa."
        icon={<Boxes className="h-6 w-6" />}
        iconTone="emerald"
        badges={[
          <Badge key="lead" variant="success">Uso no lead</Badge>,
          <Badge key="ativos" variant="secondary">{vm.totalAtivos} ativos</Badge>,
        ]}
        actions={
          <Button onClick={vm.abrirCriacao} className="min-w-44 gap-2 px-5 sm:min-w-52">
            <PackagePlus className="mr-2 h-4 w-4" />
            Novo produto
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.86fr)]">
        <Card className="overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
          <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="rounded-full border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)] px-3 py-1.5 text-[var(--success)]">Basico</span>
                  <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-1.5 text-[var(--text-secondary)]">Campos</span>
                  <span className="rounded-full border border-[color-mix(in_srgb,var(--info)_30%,transparent)] bg-[color-mix(in_srgb,var(--info)_14%,transparent)] px-3 py-1.5 text-[var(--info)]">Revisao</span>
                </div>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">Catalogo simples, edicao em tela dedicada e preview em tempo real.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-center shadow-[var(--shadow-sm)]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Fluxo</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">3</p>
                </div>
                <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-center shadow-[var(--shadow-sm)]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Ativos</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{vm.totalAtivos}</p>
                </div>
                <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-center shadow-[var(--shadow-sm)]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Media</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{vm.mediaCamposPorProduto}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
          <CardContent className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6 xl:grid-cols-1">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]">
                <Boxes className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Templates</p>
                <p className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{vm.totalProdutos}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[color-mix(in_srgb,var(--info)_30%,transparent)] bg-[color-mix(in_srgb,var(--info)_14%,transparent)] text-[var(--info)]">
                <PackageCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Ativos</p>
                <p className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{vm.totalAtivos}</p>
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Media por template</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{vm.mediaCamposPorProduto}</p>
              <p className="text-xs text-[var(--text-secondary)]">campos organizados por produto</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {vm.erro ? <div className="rounded-[16px] border border-[color-mix(in_srgb,var(--danger)_34%,transparent)] bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] p-3 text-sm text-[var(--danger)]">{vm.erro}</div> : null}

      <ProdutosLista vm={vm} />
    </ModulePageShell>
  );
}
