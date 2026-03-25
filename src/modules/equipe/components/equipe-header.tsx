"use client";

import { BriefcaseBusiness, Plus, ShieldCheck, UserMinus, Users } from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UseEquipeModuleReturn } from "../types";

type KpiChipProps = {
  rotulo: string;
  valor: number;
  subtitulo: string;
  gradiente: string;
  icon: ComponentType<{ className?: string }>;
};

function KpiChip({ rotulo, valor, subtitulo, gradiente, icon: Icon }: KpiChipProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-[var(--radius-control)] border px-3 py-2 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]", gradiente)}>
      <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-white/10 blur-xl" />
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{rotulo}</p>
          <p className="text-lg font-bold text-[var(--text-primary)]">{valor}</p>
          <p className="text-[11px] text-[var(--text-secondary)]">{subtitulo}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.06)]">
          <Icon className="h-4 w-4 text-[var(--text-primary)]" />
        </div>
      </div>
    </div>
  );
}

type EquipeHeaderProps = {
  vm: UseEquipeModuleReturn;
  onAbrirNovoPdv?: () => void;
};

export function EquipeHeader({ vm, onAbrirNovoPdv }: EquipeHeaderProps) {
  const temFiltrosAtivos = vm.busca || vm.idPdvFiltro || vm.statusFiltro !== "TODOS" || vm.cargoFiltro !== "TODOS";
  const kpisExibir = temFiltrosAtivos ? vm.kpis : vm.kpisTotais;
  const colaboradoresAtivos = `${kpisExibir.ativos} ${kpisExibir.ativos === 1 ? "colaborador ativo" : "colaboradores ativos"}`;
  const contextoDados = temFiltrosAtivos ? "Visao filtrada da equipe" : "Visao geral da operacao";
  const destaqueGerencia = `${kpisExibir.gerentes} ${kpisExibir.gerentes === 1 ? "gerente" : "gerentes"}`;

  return (
    <header className="overflow-hidden rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.94))] shadow-[var(--shadow-md)]">
      <div className="flex flex-col gap-6 px-4 py-5 md:px-6 md:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.05)] shadow-[var(--shadow-sm)]">
              <Users className="h-6 w-6 text-[var(--text-primary)]" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)] md:text-2xl">Equipe e Operacao</h1>
              <p className="text-sm text-[var(--text-secondary)]">{contextoDados}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="rounded-full border border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.12)] px-2.5 py-1 text-xs font-medium text-[var(--success)]">
                  {colaboradoresAtivos}
                </span>
                  <span className="rounded-full border border-[color:rgba(56,189,248,0.24)] bg-[color:rgba(56,189,248,0.12)] px-2.5 py-1 text-xs font-medium text-[var(--info)]">
                  {destaqueGerencia}
                </span>
                {temFiltrosAtivos ? (
                  <span className="rounded-full border border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.12)] px-2.5 py-1 text-xs font-medium text-[var(--warning)]">
                    filtros aplicados
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!vm.podeGerenciarEmpresa && vm.podeAdicionarFuncionario ? (
              <Button className="h-10 rounded-[var(--radius-control)] px-4 font-medium" onClick={() => vm.abrirDialogNovoFuncionario(true)}>
                Novo Colaborador
              </Button>
            ) : null}
            {vm.podeGerenciarEmpresa && onAbrirNovoPdv ? (
              <Button type="button" variant="outline" className="h-10 rounded-[var(--radius-control)] px-4" onClick={onAbrirNovoPdv}>
                <Plus className="mr-2 h-4 w-4" />
                Novo PDV
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <KpiChip rotulo="Total" valor={kpisExibir.total} subtitulo="Time cadastrado" gradiente="border-[var(--border-subtle)] bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]" icon={Users} />
          <KpiChip rotulo="Ativos" valor={kpisExibir.ativos} subtitulo="Em operacao" gradiente="border-[color:rgba(16,185,129,0.24)] bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(255,255,255,0.02))]" icon={ShieldCheck} />
          <KpiChip rotulo="Inativos" valor={kpisExibir.inativos} subtitulo="Fora da escala" gradiente="border-[color:rgba(244,63,94,0.24)] bg-[linear-gradient(135deg,rgba(244,63,94,0.14),rgba(255,255,255,0.02))]" icon={UserMinus} />
          <KpiChip rotulo="Gerentes" valor={kpisExibir.gerentes} subtitulo={`${kpisExibir.colaboradores} colaboradores`} gradiente="border-[color:rgba(56,189,248,0.24)] bg-[linear-gradient(135deg,rgba(56,189,248,0.14),rgba(255,255,255,0.02))]" icon={BriefcaseBusiness} />
        </div>
      </div>
    </header>
  );
}
