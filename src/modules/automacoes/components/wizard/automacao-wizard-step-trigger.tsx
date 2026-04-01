"use client";

import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormularioAutomacaoWizard } from "../../types";
import type { EstagioFunilOption } from "@/modules/whatsapp/types";
import { VALOR_ESTAGIO_QUALQUER } from "./automacao-wizard.utils";

type AutomacaoWizardStepTriggerProps = {
  erroCarregamentoEstagios: string | null;
  estagios: EstagioFunilOption[];
  form: FormularioAutomacaoWizard;
  onFormChange: (atualizador: (anterior: FormularioAutomacaoWizard) => FormularioAutomacaoWizard) => void;
};

export function AutomacaoWizardStepTrigger({
  erroCarregamentoEstagios,
  estagios,
  form,
  onFormChange,
}: AutomacaoWizardStepTriggerProps) {
  return (
    <div className="space-y-4">
      {erroCarregamentoEstagios ? (
        <InlineStatusAlert
          variant="error"
          message={erroCarregamentoEstagios}
          className="border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] text-[var(--danger)] [&>div]:bg-[rgba(244,63,94,0.16)] [&>div]:text-[var(--danger)]"
        />
      ) : null}

      <div className="rounded-[var(--radius-card)] border border-[rgba(16,185,129,0.22)] bg-[linear-gradient(180deg,rgba(16,185,129,0.1),rgba(12,12,14,0.96))] p-4 shadow-[var(--shadow-sm)]">
        <div className="mb-1 text-sm font-semibold text-[var(--text-primary)]">WhatsApp - Mudança de estágio</div>
        <div className="text-sm text-[var(--text-secondary)]">
          Esta automação dispara quando um lead muda de etapa no funil de vendas.
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          Nome da automação
        </label>
        <Input
          value={form.nome}
          onChange={(event) => onFormChange((anterior) => ({ ...anterior, nome: event.target.value }))}
          placeholder="Ex: Notificar equipe sobre novos leads"
        />
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          Estágio de destino (opcional)
        </label>
        <Select
          value={form.idEstagioDestino || VALOR_ESTAGIO_QUALQUER}
          onValueChange={(value) =>
            onFormChange((anterior) => ({
              ...anterior,
              idEstagioDestino: value === VALOR_ESTAGIO_QUALQUER ? "" : value,
            }))
          }
        >
          <SelectTrigger className="w-full bg-[var(--surface-elevated)]">
            <SelectValue placeholder="Qualquer estágio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={VALOR_ESTAGIO_QUALQUER}>Qualquer estágio</SelectItem>
            {estagios.map((estagio) => (
              <SelectItem key={estagio.id} value={estagio.id}>
                {estagio.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Deixe vazio para disparar em qualquer mudança de estágio</p>
      </div>
    </div>
  );
}
