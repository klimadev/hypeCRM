"use client";

import { useState } from "react";
import { ChevronRight, Store } from "lucide-react";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { AccessDeniedCard } from "@/components/shared/access-denied-card";
import { useEquipeModule } from "./hooks/use-equipe-module";
import { EquipeHeader } from "./components/equipe-header";
import { EquipeLojaGrid } from "./components/equipe-loja-grid";
import { EquipeLojaDrawer } from "./components/equipe-loja-drawer";
import { NovoFuncionarioDialog } from "./components/dialogs/novo-funcionario-dialog";
import { InativacaoDialog } from "./components/dialogs/inativacao-dialog";
import type { Props, Pdv } from "./types";

export function ModuloEquipe({ perfil, id_pdv }: Props) {
  const vm = useEquipeModule({ perfil, id_pdv });
  const [drawerNovaLojaAberto, setDrawerNovaLojaAberto] = useState(false);
  const [lojaSelecionada, setLojaSelecionada] = useState<Pdv | null>(null);
  const [drawerLojaAberto, setDrawerLojaAberto] = useState(false);

  const handleAbrirLoja = (loja: Pdv) => {
    setLojaSelecionada(loja);
    setDrawerLojaAberto(true);
  };

  const handleFecharLoja = () => {
    setLojaSelecionada(null);
    setDrawerLojaAberto(false);
  };

  if (perfil === "COLABORADOR") {
    return (
      <AccessDeniedCard
        title="Sem permissao para acessar equipe"
        description="Este modulo e visivel apenas para perfis de gestao. Solicite ao administrador da empresa a elevacao de permissao."
      />
    );
  }

  return (
    <ModulePageShell className="space-y-6 rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(9,9,11,0.96),rgba(12,12,14,0.94))] pb-28 shadow-[var(--shadow-md)] md:pb-28">
      <EquipeHeader 
        vm={vm} 
        onAbrirNovaLoja={() => setDrawerNovaLojaAberto(true)}
        onAbrirNovoFuncionario={() => vm.abrirDialogNovoFuncionario(true)}
      />

      <InlineStatusAlert variant="error" message={vm.erroLista} />

      {vm.podeGerenciarEmpresa && (
        <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)] md:p-5">
          <EquipeLojaGrid 
            vm={vm} 
            drawerNovaLojaAberto={drawerNovaLojaAberto} 
            setDrawerNovaLojaAberto={setDrawerNovaLojaAberto}
            onAbrirLoja={handleAbrirLoja}
          />
        </div>
      )}

      {!vm.podeGerenciarEmpresa && vm.podeAdicionarFuncionario && vm.pdvs.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)] md:p-5">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Sua Loja</p>
              <p className="text-xs text-[var(--text-secondary)]">Clique para gerenciar as pessoas</p>
            </div>
            {vm.pdvs.slice(0, 1).map((loja) => (
              <div 
                key={loja.id}
                className="cursor-pointer rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
                onClick={() => handleAbrirLoja(loja)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[color:rgba(139,92,246,0.1)]">
                      <Store className="h-5 w-5 text-[var(--brand)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{loja.nome}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{loja.funcionarios?.length || 0} pessoas</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <NovoFuncionarioDialog vm={vm} />
      <InativacaoDialog vm={vm} />

      <EquipeLojaDrawer 
        vm={vm}
        loja={lojaSelecionada}
        aberto={drawerLojaAberto}
        onFechar={handleFecharLoja}
      />
    </ModulePageShell>
  );
}
