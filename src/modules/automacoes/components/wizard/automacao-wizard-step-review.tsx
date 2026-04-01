"use client";

import type { FormularioAutomacaoWizard } from "../../types";
import type { EstagioFunilOption } from "@/modules/whatsapp/types";
import type { WhatsappInstancia } from "@/modules/whatsapp/types";

type AutomacaoWizardStepReviewProps = {
  automacaoAtivaId: string | null;
  erro: string | null;
  estagios: EstagioFunilOption[];
  form: FormularioAutomacaoWizard;
  instanciaSelecionada: WhatsappInstancia | null;
};

export function AutomacaoWizardStepReview({
  automacaoAtivaId,
  erro,
  estagios,
  form,
  instanciaSelecionada,
}: AutomacaoWizardStepReviewProps) {
  const estagioSelecionado = estagios.find((estagio) => estagio.id === form.idEstagioDestino);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
        {automacaoAtivaId ? "Revise antes de salvar" : "Revise antes de criar"}
      </h3>

      <div className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)]">
        <ResumoItem titulo="Nome" valor={form.nome || "Automação sem nome"} />
        <ResumoItem titulo="Canal" valor="WhatsApp" />
        <ResumoItem titulo="Gatilho" valor="Mudança de estágio" />
        {estagioSelecionado ? <ResumoItem titulo="Estágio destino" valor={estagioSelecionado.nome} /> : null}
        {instanciaSelecionada ? (
          <ResumoItem titulo="Instância" valor={instanciaSelecionada.nome || instanciaSelecionada.instance_name} />
        ) : null}
        {form.telefoneDestino ? <ResumoItem titulo="Telefone destino" valor={form.telefoneDestino} /> : null}
        {form.delayMinutos > 0 ? <ResumoItem titulo="Atraso" valor={`${form.delayMinutos} minutos`} /> : null}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Mensagem:</span>
          <p className="mt-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-2 text-sm text-[var(--text-primary)]">
            {form.mensagem || "(sem mensagem)"}
          </p>
        </div>
      </div>

      {erro ? (
        <div className="rounded-[var(--radius-control)] border border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] p-3 text-sm text-[var(--danger)]">
          {erro}
        </div>
      ) : null}

      <p className="text-sm text-[var(--text-secondary)]">
        Esta automação dispara no momento da mudança de estágio. Se houver atraso configurado ou retry, um job pode chamar <code>/api/dispatch</code> apenas para processar a fila pendente.
      </p>
    </div>
  );
}

function ResumoItem({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{titulo}:</span>
      <p className="text-sm font-medium text-[var(--text-primary)]">{valor}</p>
    </div>
  );
}
