"use client";

import { Plus, Store, Users } from "lucide-react";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UseEquipeModuleReturn } from "../types";

type EquipeHeaderProps = {
  vm: UseEquipeModuleReturn;
  onAbrirNovaLoja?: () => void;
  onAbrirNovoFuncionario?: () => void;
};

export function EquipeHeader({ vm, onAbrirNovaLoja, onAbrirNovoFuncionario }: EquipeHeaderProps) {
  const totalPessoas = vm.kpisTotais.total;
  const pessoasAtivas = vm.kpisTotais.ativos;
  const totalLojas = vm.pdvs.length;

  return (
    <div className="space-y-5">
      <ModulePageHeader
        title="Minha Equipe"
        subtitle="Gerencie suas lojas e colaboradores"
        iconTone="slate"
        icon={<Users className="h-6 w-6" />}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {vm.podeGerenciarEmpresa && onAbrirNovaLoja ? (
              <Button className="h-11 rounded-[var(--radius-control)] px-5 font-medium" onClick={onAbrirNovaLoja}>
                <Store className="mr-2 h-4 w-4" />
                Nova Loja
              </Button>
            ) : null}
            {!vm.podeGerenciarEmpresa && vm.podeAdicionarFuncionario && onAbrirNovoFuncionario ? (
              <Button className="h-11 rounded-[var(--radius-control)] px-5 font-medium" onClick={onAbrirNovoFuncionario}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Colaborador
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={cn(
          "relative overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)]",
          "border-[var(--border-subtle)]"
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[color:rgba(139,92,246,0.1)]">
              <Users className="h-5 w-5 text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Total de Pessoas</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalPessoas}</p>
            </div>
          </div>
        </div>

        <div className={cn(
          "relative overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)]",
          "border-[color:rgba(16,185,129,0.2)]"
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[color:rgba(16,185,129,0.2)] bg-[color:rgba(16,185,129,0.1)]">
              <Users className="h-5 w-5 text-[var(--success)]" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Pessoas Ativas</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{pessoasAtivas}</p>
            </div>
          </div>
        </div>

        <div className={cn(
          "relative overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)]",
          "border-[color:rgba(56,189,248,0.2)]"
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[color:rgba(56,189,248,0.2)] bg-[color:rgba(56,189,248,0.1)]">
              <Store className="h-5 w-5 text-[var(--info)]" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Lojas</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalLojas}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
