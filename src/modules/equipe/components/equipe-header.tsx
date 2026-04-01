"use client";

import { Plus, Store, Users } from "lucide-react";
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
    <header className="overflow-hidden rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.94))] shadow-[var(--shadow-md)]">
      <div className="flex flex-col gap-5 px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[color:rgba(139,92,246,0.12)] shadow-[var(--shadow-sm)]">
              <Users className="h-7 w-7 text-[var(--brand)]" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Minha Equipe</h1>
              <p className="text-sm text-[var(--text-secondary)]">Gerencie suas lojas e colaboradores</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {vm.podeGerenciarEmpresa && onAbrirNovaLoja && (
              <Button 
                className="h-11 rounded-[var(--radius-control)] px-5 font-medium" 
                onClick={onAbrirNovaLoja}
              >
                <Store className="mr-2 h-4 w-4" />
                Nova Loja
              </Button>
            )}
            {!vm.podeGerenciarEmpresa && vm.podeAdicionarFuncionario && onAbrirNovoFuncionario && (
              <Button 
                className="h-11 rounded-[var(--radius-control)] px-5 font-medium" 
                onClick={onAbrirNovoFuncionario}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Colaborador
              </Button>
            )}
          </div>
        </div>

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
    </header>
  );
}
