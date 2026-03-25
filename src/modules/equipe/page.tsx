"use client";

import { useState } from "react";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { AccessDeniedCard } from "@/components/shared/access-denied-card";
import { useEquipeModule } from "./hooks/use-equipe-module";
import { EquipeHeader } from "./components/equipe-header";
import { PdvManagementPanel } from "./components/pdv-management-panel";
import { NovoFuncionarioDialog } from "./components/dialogs/novo-funcionario-dialog";
import { InativacaoDialog } from "./components/dialogs/inativacao-dialog";
import type { Props } from "./types";

export function ModuloEquipe({ perfil, id_pdv }: Props) {
  const vm = useEquipeModule({ perfil, id_pdv });
  const [drawerNovoPdvAberto, setDrawerNovoPdvAberto] = useState(false);

  if (perfil === "COLABORADOR") {
    return (
      <AccessDeniedCard
        title="Sem permissao para acessar equipe"
        description="Este modulo e visivel apenas para perfis de gestao. Solicite ao administrador da empresa a elevacao de permissao."
      />
    );
  }

  return (
    <ModulePageShell className="space-y-4 rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(9,9,11,0.96),rgba(12,12,14,0.94))] pb-28 shadow-[var(--shadow-md)] md:pb-28">
      <EquipeHeader vm={vm} onAbrirNovoPdv={() => setDrawerNovoPdvAberto(true)} />

      <InlineStatusAlert variant="error" message={vm.erroLista} />

      {vm.podeAdicionarFuncionario ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 shadow-[var(--shadow-sm)] md:p-4">
          <PdvManagementPanel vm={vm} drawerNovoPdvAberto={drawerNovoPdvAberto} setDrawerNovoPdvAberto={setDrawerNovoPdvAberto} />
        </div>
      ) : null}

      <NovoFuncionarioDialog vm={vm} />
      <InativacaoDialog vm={vm} />
    </ModulePageShell>
  );
}
