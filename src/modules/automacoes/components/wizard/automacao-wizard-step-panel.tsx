"use client";

import type { EstagioFunilOption, WhatsappInstancia } from "@/modules/whatsapp/types";
import type { FormularioAutomacaoWizard } from "../../types";
import { AutomacaoWizardStepAction } from "./automacao-wizard-step-action";
import { AutomacaoWizardStepReview } from "./automacao-wizard-step-review";
import { AutomacaoWizardStepTrigger } from "./automacao-wizard-step-trigger";

type AutomacaoWizardStepPanelProps = {
  passo: 1 | 2 | 3;
  automacaoAtivaId: string | null;
  carregandoDados: boolean;
  erro: string | null;
  erroCarregamentoEstagios: string | null;
  erroCarregamentoInstancias: string | null;
  estagios: EstagioFunilOption[];
  form: FormularioAutomacaoWizard;
  instanciaSelecionada: WhatsappInstancia | null;
  instanciaSelecionadaDisponivel: boolean;
  instancias: WhatsappInstancia[];
  instanciasDisponiveis: WhatsappInstancia[];
  onFormChange: (atualizador: (anterior: FormularioAutomacaoWizard) => FormularioAutomacaoWizard) => void;
};

export function AutomacaoWizardStepPanel({
  passo,
  automacaoAtivaId,
  carregandoDados,
  erro,
  erroCarregamentoEstagios,
  erroCarregamentoInstancias,
  estagios,
  form,
  instanciaSelecionada,
  instanciaSelecionadaDisponivel,
  instancias,
  instanciasDisponiveis,
  onFormChange,
}: AutomacaoWizardStepPanelProps) {
  return (
    <div className="min-h-[300px]">
      {passo === 1 ? (
        <AutomacaoWizardStepTrigger
          erroCarregamentoEstagios={erroCarregamentoEstagios}
          estagios={estagios}
          form={form}
          onFormChange={onFormChange}
        />
      ) : null}

      {passo === 2 ? (
        <AutomacaoWizardStepAction
          carregandoDados={carregandoDados}
          erroCarregamentoInstancias={erroCarregamentoInstancias}
          form={form}
          instanciaSelecionada={instanciaSelecionada}
          instanciaSelecionadaDisponivel={instanciaSelecionadaDisponivel}
          instancias={instancias}
          instanciasDisponiveis={instanciasDisponiveis}
          onFormChange={onFormChange}
        />
      ) : null}

      {passo === 3 ? (
        <AutomacaoWizardStepReview
          automacaoAtivaId={automacaoAtivaId}
          erro={erro}
          estagios={estagios}
          form={form}
          instanciaSelecionada={instanciaSelecionada}
        />
      ) : null}
    </div>
  );
}
