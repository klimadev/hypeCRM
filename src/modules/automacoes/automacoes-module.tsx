"use client";

import { useEffect, useState } from "react";
import { Clock3, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { useAutomacoes } from "./hooks/use-automacoes";
import { AutomacaoList } from "./components/automacao-list";
import { AutomacaoWizard } from "./components/wizard/automacao-wizard";
import {
  removerRascunhoAutomacaoWizard,
} from "./components/wizard/rascunho-storage";
import type {
  Automacao,
  AutomacaoForm,
  ResumoRascunhoAutomacaoWizard,
} from "./types";

function formatarHorarioRascunho(valor: string | null) {
  if (!valor) return null;

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

export function AutomacoesModule() {
  const vm = useAutomacoes();
  const { addToast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [automacaoEdicao, setAutomacaoEdicao] = useState<Automacao | null>(null);
  const [restaurarRascunhoAoAbrir, setRestaurarRascunhoAoAbrir] = useState(true);
  const [rascunhoWizard, setRascunhoWizard] =
    useState<ResumoRascunhoAutomacaoWizard | null>(null);

  useEffect(() => {
    void vm.recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    setAutomacaoEdicao(null);
    setRestaurarRascunhoAoAbrir(false);
    setWizardOpen(true);
  };

  const handleEdit = (automacao: Automacao) => {
    setAutomacaoEdicao(automacao);
    setRestaurarRascunhoAoAbrir(true);
    setWizardOpen(true);
  };

  const handleContinueDraft = () => {
    setAutomacaoEdicao(null);
    setRestaurarRascunhoAoAbrir(true);
    setWizardOpen(true);
  };

  const handleDiscardDraft = () => {
    removerRascunhoAutomacaoWizard();
    setAutomacaoEdicao(null);
    setRestaurarRascunhoAoAbrir(false);
    setRascunhoWizard(null);
    addToast({
      type: "info",
      title: "Rascunho descartado",
      description: "A próxima automação começa com um formulário limpo.",
    });
  };

  const handleSubmit = async (
    dados: AutomacaoForm,
    contexto?: { automacaoId?: string | null },
  ) => {
    if (contexto?.automacaoId) {
      return vm.atualizarAutomacao(contexto.automacaoId, dados);
    }

    return vm.criarAutomacao(dados);
  };

  const horarioRascunho = formatarHorarioRascunho(rascunhoWizard?.salvoEm ?? null);

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title="Automações"
        subtitle="Gerencie disparos, acompanhe rascunhos e mantenha as rotinas operacionais da equipe sob controle."
        iconTone="blue"
        icon={<History className="h-6 w-6" />}
        badges={[
          <Badge key="canal" variant="info">WhatsApp</Badge>,
          <Badge key="gatilho" variant="secondary">Mudanca de estagio</Badge>,
          <Badge key="volume" variant="default">{vm.automacoes.length} automacao(oes)</Badge>,
        ]}
      />

      {rascunhoWizard && !wizardOpen ? (
        <Card className="mb-6 border-[rgba(56,189,248,0.22)] bg-[linear-gradient(135deg,rgba(56,189,248,0.12),rgba(12,12,14,0.96)_45%,rgba(34,211,238,0.08))] shadow-[var(--shadow-sm)]">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-card)] border border-[rgba(56,189,248,0.24)] bg-[rgba(56,189,248,0.14)] text-[var(--info)]">
                <History className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Voce tem um rascunho de automacao em andamento
                  </p>
                  {horarioRascunho ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                      <Clock3 className="h-3 w-3" />
                      Atualizado as {horarioRascunho}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {rascunhoWizard.nome}. O progresso fica salvo nesta aba e pode ser retomado mesmo apos uma recarga inesperada.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={handleDiscardDraft}>
                <Trash2 className="mr-2 h-4 w-4" />
                Descartar rascunho
              </Button>
              <Button onClick={handleContinueDraft}>
                <History className="mr-2 h-4 w-4" />
                Continuar de onde parei
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <AutomacaoList
        automacoes={vm.automacoes}
        carregando={vm.carregando}
        onToggle={vm.alternarAutomacao}
        onDelete={vm.excluirAutomacao}
        onDispatch={vm.dispararDispatch}
        onCreate={handleCreate}
        onEdit={handleEdit}
      />

      <AutomacaoWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSubmit={handleSubmit}
        restaurarRascunhoAoAbrir={restaurarRascunhoAoAbrir}
        automacoes={vm.automacoes}
        automacaoEdicao={automacaoEdicao}
        onRascunhoChange={setRascunhoWizard}
      />
    </ModulePageShell>
  );
}
