"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { useFeedbackAdmin } from "./hooks/use-feedback-admin";
import { FeedbackAdminTable } from "./components/feedback-admin-table";
import { FeedbackDetalhe } from "./components/feedback-admin-detalhe";

export function ModuloFeedbackAdmin() {
  const vm = useFeedbackAdmin();
  const [detalheId, setDetalheId] = useState<string | null>(null);

  return (
    <ModulePageShell spacing="lg" className="flex gap-6">
      <div className="flex-1 min-w-0">
        <ModulePageHeader
          title="Feedbacks"
          subtitle="Bugs reportados e sugestões de melhoria"
          icon={<MessageSquare />}
          iconTone="blue"
        />
        <FeedbackAdminTable
          items={vm.items}
          carregando={vm.carregando}
          erro={vm.erro}
          filtroTipo={vm.filtroTipo}
          filtroStatus={vm.filtroStatus}
          setFiltroTipo={vm.setFiltroTipo}
          setFiltroStatus={vm.setFiltroStatus}
          pagina={vm.pagina}
          totalPaginas={vm.totalPaginas}
          onRecarregar={vm.recarregar}
          onSelecionarDetalhe={setDetalheId}
          onPagina={(p) => {
            setDetalheId(null);
            vm.setPagina(p);
          }}
        />
      </div>

      {detalheId && (
        <div className="w-[420px] shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)]">
           <FeedbackDetalhe id={detalheId} onClose={() => setDetalheId(null)} onAtualizado={vm.recarregar} />
        </div>
      )}
    </ModulePageShell>
  );
}
