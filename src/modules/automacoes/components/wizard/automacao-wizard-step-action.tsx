"use client";

import { Loader2 } from "lucide-react";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VARIAVEIS_TEMPLATE, type FormularioAutomacaoWizard } from "../../types";
import type { WhatsappInstancia } from "@/modules/whatsapp/types";
import { formatarStatusInstanciaWizard } from "./automacao-wizard.utils";
import { instanciaWhatsappEstaConectada } from "@/lib/whatsapp-instancia-status";

type AutomacaoWizardStepActionProps = {
  carregandoDados: boolean;
  erroCarregamentoInstancias: string | null;
  form: FormularioAutomacaoWizard;
  instanciaSelecionada: WhatsappInstancia | null;
  instanciaSelecionadaDisponivel: boolean;
  instancias: WhatsappInstancia[];
  instanciasDisponiveis: WhatsappInstancia[];
  onFormChange: (atualizador: (anterior: FormularioAutomacaoWizard) => FormularioAutomacaoWizard) => void;
};

export function AutomacaoWizardStepAction({
  carregandoDados,
  erroCarregamentoInstancias,
  form,
  instanciaSelecionada,
  instanciaSelecionadaDisponivel,
  instancias,
  instanciasDisponiveis,
  onFormChange,
}: AutomacaoWizardStepActionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Configure a mensagem</h3>

      {erroCarregamentoInstancias ? (
        <InlineStatusAlert
          variant="error"
          message={erroCarregamentoInstancias}
          className="border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] text-[var(--danger)] [&>div]:bg-[rgba(244,63,94,0.16)] [&>div]:text-[var(--danger)]"
        />
      ) : null}

      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          Instância WhatsApp <span className="text-[var(--danger)]">*</span>
        </label>
        {carregandoDados ? (
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando instâncias...</span>
          </div>
        ) : erroCarregamentoInstancias ? (
          <p className="rounded-[var(--radius-control)] border border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] p-2 text-sm text-[var(--danger)]">
            Tente recarregar os dados antes de escolher a instância.
          </p>
        ) : instancias.length === 0 ? (
          <p className="rounded-[var(--radius-control)] border border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.1)] p-2 text-sm text-[var(--warning)]">
            Nenhuma instância WhatsApp cadastrada. Crie uma em WhatsApp &gt; Instâncias.
          </p>
        ) : (
          <div className="space-y-3">
            <Select
              value={form.idInstanciaWhatsapp}
              onValueChange={(value) => onFormChange((anterior) => ({ ...anterior, idInstanciaWhatsapp: value }))}
            >
              <SelectTrigger className="w-full bg-[var(--surface-elevated)]">
                <SelectValue placeholder="Selecione a instância" />
              </SelectTrigger>
              <SelectContent>
                {instancias.map((instancia) => {
                  const estaDisponivel = instanciaWhatsappEstaConectada(instancia);

                  return (
                    <SelectItem key={instancia.id} value={instancia.id} disabled={!estaDisponivel}>
                      {instancia.nome || instancia.instance_name} ({formatarStatusInstanciaWizard(instancia)})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {instanciasDisponiveis.length === 0 ? (
              <InlineStatusAlert
                variant="warning"
                message="Suas instâncias existem, mas nenhuma está conectada no momento. Conecte uma em WhatsApp > Instâncias para usar nas automações."
                className="border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.1)] text-[var(--warning)] [&>div]:bg-[rgba(245,158,11,0.16)] [&>div]:text-[var(--warning)]"
              />
            ) : null}

            {instanciasDisponiveis.length < instancias.length ? (
              <p className="text-xs text-[var(--text-secondary)]">Só instâncias conectadas ficam habilitadas para envio automático.</p>
            ) : null}

            {instanciaSelecionada && !instanciaSelecionadaDisponivel ? (
              <InlineStatusAlert
                variant="warning"
                message="A instância selecionada não está conectada agora. Escolha uma instância ativa para salvar a automação."
                className="border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.1)] text-[var(--warning)] [&>div]:bg-[rgba(245,158,11,0.16)] [&>div]:text-[var(--warning)]"
              />
            ) : null}
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Telefone destino (opcional)</label>
        <Input
          value={form.telefoneDestino}
          onChange={(event) => onFormChange((anterior) => ({ ...anterior, telefoneDestino: event.target.value }))}
          placeholder="11999999999"
        />
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Deixe vazio para enviar para o lead. Formato: DDD + número (ex: 11999999999)</p>
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          Mensagem <span className="text-[var(--danger)]">*</span>
        </label>
        <Textarea
          value={form.mensagem}
          onChange={(event) => onFormChange((anterior) => ({ ...anterior, mensagem: event.target.value }))}
          placeholder="Digite sua mensagem..."
          rows={5}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {VARIAVEIS_TEMPLATE.map((variavel) => (
            <Badge
              key={variavel.nome}
              variant="secondary"
              className="cursor-pointer border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[color:rgba(255,255,255,0.06)]"
              onClick={() =>
                onFormChange((anterior) => ({
                  ...anterior,
                  mensagem: anterior.mensagem + `{{${variavel.nome}}}`,
                }))
              }
            >
              {`{{${variavel.nome}}}`}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Atraso antes de enviar:</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={form.delayMinutos}
            onChange={(event) => onFormChange((anterior) => ({ ...anterior, delayMinutos: Number(event.target.value) }))}
            className="w-24"
            min={0}
          />
          <span className="text-sm text-[var(--text-secondary)]">minutos</span>
        </div>
      </div>
    </div>
  );
}
