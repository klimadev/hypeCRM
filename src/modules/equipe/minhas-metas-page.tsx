"use client";

import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import type { Perfil } from "@/lib/tipos";
import { useMetasModule } from "./hooks/use-metas-module";
import { MetaColaboradorCard, MetasHeader, RankingWidget } from "./components/metas";

type ModuloMinhasMetasProps = {
  perfil: Perfil;
  id_pdv?: string | null;
  id_usuario: string;
};

export function ModuloMinhasMetas({ perfil, id_pdv, id_usuario }: ModuloMinhasMetasProps) {
  const vm = useMetasModule({ perfil, id_pdv, id_usuario, modo: "colaborador" });

  return (
    <ModulePageShell spacing="lg" className="rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(9,9,11,0.96),rgba(12,12,14,0.94))] shadow-[var(--shadow-md)]">
      <MetasHeader vm={vm} />
      <InlineStatusAlert variant="error" message={vm.erro} />

      {vm.carregando ? (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-[color:rgba(255,255,255,0.04)]" />
          <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-[color:rgba(255,255,255,0.04)]" />
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
          <MetaColaboradorCard meta={vm.minhaMeta} progresso={vm.progresso} ranking={vm.ranking} idUsuario={id_usuario} />
          <RankingWidget
            ranking={vm.ranking}
            mediaEquipe={vm.mediaEquipe}
            totalParticipantes={vm.totalParticipantes}
            destaqueId={id_usuario}
            titulo="Ranking do seu PDV"
          />
        </div>
      )}
    </ModulePageShell>
  );
}
