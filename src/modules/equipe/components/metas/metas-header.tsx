import { RefreshCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UseMetasModuleReturn } from "@/modules/equipe/types/metas";

type MetasHeaderProps = {
  vm: UseMetasModuleReturn;
};

export function MetasHeader({ vm }: MetasHeaderProps) {
  const totalAtivas = vm.metas.filter((meta) => meta.ativo).length;
  const podeCriarAlgumaMeta = vm.podeCriarGlobal || vm.podeCriarMetaPdv || vm.podeCriarMetaIndividual;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--success)]">
          {vm.modo === "painel" ? "Gestao de metas" : "Acompanhamento pessoal"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
          {vm.modo === "painel" ? "Metas da equipe" : "Minhas metas"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          {vm.modo === "painel"
            ? "Distribua metas para sua equipe e acompanhe o progresso de forma simples."
            : "Veja sua evolucao, o que falta para bater a meta e como voce esta posicionado no ranking do PDV."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => void vm.recarregar()} disabled={vm.carregando}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>

        {vm.modo === "painel" && podeCriarAlgumaMeta ? (
          <Button type="button" className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => vm.abrirNovaMeta()}>
            <Plus className="mr-2 h-4 w-4" />
            Criar meta
          </Button>
        ) : null}
      </div>

      {vm.modo === "painel" ? (
        <div className="flex flex-wrap gap-3">
          <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 shadow-[var(--shadow-sm)]">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Metas ativas</p>
            <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{totalAtivas}</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 shadow-[var(--shadow-sm)]">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Media do ranking</p>
            <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{vm.mediaEquipe.toFixed(1)}%</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
