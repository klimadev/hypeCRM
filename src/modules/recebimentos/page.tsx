"use client";

import dynamic from "next/dynamic";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { useRecebimentosModule } from "./hooks/use-recebimentos-module";
import { RecebimentosHeader } from "./components/recebimentos-header";
import { RecebimentosKpis } from "./components/recebimentos-kpis";
import { RecebimentosFilters } from "./components/recebimentos-filters";
import { RecebimentosTabs } from "./components/recebimentos-tabs";
import { RecebimentosStatusDonut } from "./components/recebimentos-status-donut";
import { RecebimentosTable } from "./components/recebimentos-table";
import { RecebimentosMobileList } from "./components/recebimentos-mobile-list";
import { RecebimentosEmptyState } from "./components/recebimentos-empty-state";

// [QW4] Lazy loading do gráfico recharts - reduz bundle inicial
const RecebimentosChartCard = dynamic(
  () => import("./components/recebimentos-chart-card").then((mod) => ({ default: mod.RecebimentosChartCard })),
  {
    loading: () => <div className="min-h-[280px] animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]" />,
    ssr: false,
  }
);

export function ModuloRecebimentos() {
  const vm = useRecebimentosModule();

  return (
    <ModulePageShell spacing="lg">
      <RecebimentosHeader quantidadeMonitoradas={vm.resumo?.quantidadeMonitoradas ?? 0} temFiltrosAtivos={vm.temFiltrosAtivos} />

      <InlineStatusAlert variant="error" message={vm.erro} />

      <RecebimentosKpis itens={vm.kpis} carregando={vm.carregando} />

      <RecebimentosFilters vm={vm} />
      <RecebimentosTabs vm={vm} />

      <div className="grid gap-3 xl:grid-cols-[1.45fr_0.95fr]">
        <RecebimentosChartCard dados={vm.graficos.recebimentosPorPeriodo} />
        <RecebimentosStatusDonut dados={vm.graficos.distribuicaoStatus} />
      </div>

      {vm.carregando ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] animate-shimmer">
          <div className="h-80 rounded-xl bg-transparent" />
        </div>
      ) : vm.recebimentos.length === 0 ? (
        <RecebimentosEmptyState aba={vm.filtros.aba} />
      ) : (
        <>
          <RecebimentosMobileList vm={vm} />
          <div className="hidden md:block">
            <RecebimentosTable vm={vm} />
          </div>
        </>
      )}
    </ModulePageShell>
  );
}
