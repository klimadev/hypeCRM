"use client";

import { Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./shared/status-badge";
import { Avatar } from "./shared/avatar";
import type { UseEquipeModuleReturn } from "../types";

type EquipeMobileListProps = {
  vm: UseEquipeModuleReturn;
};

export function EquipeMobileList({ vm }: EquipeMobileListProps) {

  const todosDaPaginaSelecionados = vm.funcionarios.length > 0 && vm.funcionarios.every((item) => vm.idsSelecionados.includes(item.id));

  if (vm.funcionarios.length === 0 && !vm.carregandoLista) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-16 text-center shadow-[var(--shadow-sm)] md:hidden">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:rgba(255,255,255,0.05)]">
          <Users className="h-8 w-8 text-[var(--text-tertiary)]" />
        </div>
        <p className="text-lg font-semibold text-[var(--text-primary)]">Nenhum colaborador encontrado</p>
        <p className="mt-1 max-w-xs text-sm text-[var(--text-secondary)]">Adicione seu primeiro colaborador para gerenciar sua equipe.</p>
        {vm.podeGerenciarEmpresa && (
          <Button className="mt-6 rounded-[var(--radius-control)] font-medium" onClick={() => vm.setDialogNovoFuncionarioAberto(true)}>
            Adicionar colaborador
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-2">
      <div className="flex items-center gap-2 px-2">
        <input
          type="checkbox"
          checked={todosDaPaginaSelecionados}
          onChange={(e) => vm.alternarSelecaoPagina(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--border-strong)] text-[var(--brand)] focus:ring-[var(--brand-ring)]"
        />
        <span className="text-sm text-[var(--text-tertiary)]">Selecionar todos</span>
      </div>
      
      {vm.funcionarios.map((funcionario) => {
        const isSelected = vm.idsSelecionados.includes(funcionario.id);

        return (
          <div
            key={funcionario.id}
            className={`relative cursor-pointer rounded-[var(--radius-card)] border bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${
              isSelected ? "border-[color:rgba(56,189,248,0.32)] bg-[color:rgba(56,189,248,0.08)]" : "border-[var(--border-subtle)]"
            }`}
            onClick={() => vm.iniciarEdicao(funcionario)}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  vm.alternarSelecao(funcionario.id, e.target.checked);
                }}
                className="mt-1 h-4 w-4 rounded border-[var(--border-strong)] text-[var(--text-secondary)] focus:ring-[var(--focus-ring)]"
                onClick={(e) => e.stopPropagation()}
              />
              
              <Avatar nome={funcionario.nome} tamanho="md" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="truncate font-medium text-[var(--text-primary)]">{funcionario.nome}</p>
                  <StatusBadge ativo={funcionario.ativo} />
                </div>
                <p className="truncate text-sm text-[var(--text-secondary)]">{funcionario.email}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                  <span className="font-medium">{funcionario.cargo}</span>
                  <span>{funcionario.pdv?.nome || "Sem PDV"}</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-[var(--info)] opacity-0 transition-opacity hover:opacity-100">
                  <Pencil className="h-3 w-3" />
                  <span>Clique para editar</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
