import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { atualizarLeadKanban } from "@/lib/api/kanban";
import type { Lead, StatusSalvamentoDetalhesLead } from "../types";
import { useToast } from "@/components/ui/toast";
import { useAutoSave } from "./use-auto-save";

type UseKanbanDetalhesLeadParams = {
  leadSelecionado: Lead | null;
  setLeadSelecionado: Dispatch<SetStateAction<Lead | null>>;
  setLeads: Dispatch<SetStateAction<Lead[]>>;
};

export function useKanbanDetalhesLead({
  leadSelecionado,
  setLeadSelecionado,
  setLeads,
}: UseKanbanDetalhesLeadParams) {
  const { addToast } = useToast();
  const [erroDetalhesLead, setErroDetalhesLead] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [salvandoAutomaticamente, setSalvandoAutomaticamente] = useState(false);
  const [ultimaAtualizacaoSalvaEm, setUltimaAtualizacaoSalvaEm] = useState<Date | null>(null);
  const salvarAutomaticamenteRef = useRef<(leadAtualizado: Lead) => Promise<void>>(async () => {});

  const { autoSavePendente, agendarAutoSave, cancelarAutoSave } = useAutoSave<Lead>({
    delayMs: 1800,
    enabled: Boolean(leadSelecionado),
    onSave: async (leadAtualizado) => {
      await salvarAutomaticamenteRef.current(leadAtualizado);
    },
  });

  const salvarDetalhesLead = useCallback(
    async (lead: Lead) => {
      cancelarAutoSave();
      setSalvando(true);
      setSalvandoAutomaticamente(false);
      setSalvo(false);
      setErroDetalhesLead(null);

      try {
        const resposta = await atualizarLeadKanban(lead.id, {
          observacoes: lead.observacoes,
          telefone: lead.telefone,
          valor_oportunidade: Number(lead.valor_oportunidade),
          id_funcionario: lead.id_funcionario,
        });

        if (!resposta.ok) {
          setErroDetalhesLead(resposta.erro);
          setSalvando(false);
          setSalvandoAutomaticamente(false);
          return;
        }

        if (resposta.dados.lead) {
          const leadAtualizado = resposta.dados.lead;
          setLeads((atual) => atual.map((item) => (item.id === leadAtualizado.id ? leadAtualizado : item)));
          setLeadSelecionado((atual) => (atual && atual.id === leadAtualizado.id ? leadAtualizado : atual));
        }

        setSalvando(false);
        setSalvandoAutomaticamente(false);
        setSalvo(true);
        setUltimaAtualizacaoSalvaEm(new Date());

        addToast({
          type: "success",
          title: "Lead atualizado",
          description: "As alteracoes do lead foram salvas com sucesso.",
        });

        setTimeout(() => setSalvo(false), 2000);
      } catch {
        setErroDetalhesLead("Erro ao salvar lead.");
        setSalvando(false);
        setSalvandoAutomaticamente(false);
      }
    },
    [addToast, cancelarAutoSave, setLeads, setLeadSelecionado],
  );

  useEffect(() => {
    salvarAutomaticamenteRef.current = async (leadAtualizado) => {
      await salvarDetalhesLead(leadAtualizado);
    };
  }, [salvarDetalhesLead]);

  const aoMudarLead = useCallback(
    (leadAtualizado: Lead) => {
      setLeadSelecionado(leadAtualizado);

      if (erroDetalhesLead) {
        setErroDetalhesLead(null);
      }

      setSalvo(false);
      agendarAutoSave(leadAtualizado);
    },
    [agendarAutoSave, erroDetalhesLead, setLeadSelecionado],
  );

  useEffect(() => {
    if (leadSelecionado) {
      return;
    }

    cancelarAutoSave();
  }, [cancelarAutoSave, leadSelecionado]);

  const statusSalvamentoDetalhes = useMemo<StatusSalvamentoDetalhesLead>(() => {
    if (erroDetalhesLead) return "erro";
    if (salvandoAutomaticamente) return "salvando_automaticamente";
    if (salvando) return "salvando_manual";
    if (salvo) return "salvo";
    if (autoSavePendente) return "pendente";
    return "ocioso";
  }, [autoSavePendente, erroDetalhesLead, salvando, salvandoAutomaticamente, salvo]);

  return {
    erroDetalhesLead,
    setErroDetalhesLead,
    salvando,
    salvo,
    salvandoAutomaticamente,
    salvamentoAutomaticoPendente: autoSavePendente,
    ultimaAtualizacaoSalvaEm,
    statusSalvamentoDetalhes,
    salvarDetalhesLead,
    aoMudarLead,
  };
}
