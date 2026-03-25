import { useCallback, useState, useOptimistic, useTransition } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import type { Estagio, Lead } from "../types";
import { moverLeadKanban } from "@/lib/api/kanban";

type UseKanbanMovimentacaoParams = {
  leads: Lead[];
  estagios: Estagio[];
  setLeads: Dispatch<SetStateAction<Lead[]>>;
  registrarMovimentoLocal: () => void;
  addToast: (params: {
    type: "success" | "error" | "warning";
    title: string;
    description?: string;
  }) => void;
};

export function useKanbanMovimentacao({
  leads,
  estagios,
  setLeads,
  registrarMovimentoLocal,
  addToast,
}: UseKanbanMovimentacaoParams) {
  const [isPending, startTransition] = useTransition();
  const [movimentoPendente, setMovimentoPendente] = useState<{
    id_lead: string;
    id_estagio: string;
  } | null>(null);
  const [motivoPerda, setMotivoPerda] = useState("");

  // useOptimistic replaces manual setLeads for movement
  // React automatically handles rollback on error
  const [optimisticLeads, addOptimisticMove] = useOptimistic(
    leads,
    (state, update: { id: string; id_estagio: string; motivo_perda: string | null }) =>
      state.map((item) =>
        item.id === update.id
          ? { ...item, id_estagio: update.id_estagio, motivo_perda: update.motivo_perda }
          : item,
      ),
  );

  const moverLead = useCallback(
    async (idLead: string, idEstagio: string, motivo?: string) => {
      const leadAnterior = leads.find((item) => item.id === idLead);
      if (!leadAnterior) return false;

      // 1. Optimistic update — instant UI change
      addOptimisticMove({
        id: idLead,
        id_estagio: idEstagio,
        motivo_perda: motivo?.trim() ? motivo.trim() : null,
      });
      registrarMovimentoLocal();

      // 2. Server request in transition (non-blocking)
      startTransition(async () => {
        const resposta = await moverLeadKanban(idLead, {
          id_estagio: idEstagio,
          motivo_perda: motivo,
        });

        if (!resposta.ok) {
          // React automatically rolls back optimistic state
          addToast({
            type: "error",
            title: "Movimentação não permitida",
            description: resposta.erro,
          });
          return;
        }

        if (resposta.dados.lead) {
          const leadAtualizado = resposta.dados.lead;
          setLeads((atual) => atual.map((item) => (item.id === idLead ? leadAtualizado : item)));
        }

        if (resposta.dados.mensagem) {
          addToast({
            type: "warning",
            title: "Lead com pendência de análise",
            description: resposta.dados.mensagem,
          });
        }
      });

      return true;
    },
    [addOptimisticMove, leads, registrarMovimentoLocal, setLeads, addToast],
  );

  const aoDragEnd = useCallback(
    async (resultado: DropResult) => {
      if (!resultado.destination) return;

      const idLead = resultado.draggableId;
      const idEstagioDestino = resultado.destination.droppableId;

      const lead = leads.find((item) => item.id === idLead);
      if (!lead || lead.id_estagio === idEstagioDestino) return;

      const estagioDestino = estagios.find((item) => item.id === idEstagioDestino);
      if (!estagioDestino) return;

      if (estagioDestino.tipo === "PERDIDO") {
        setMovimentoPendente({ id_lead: idLead, id_estagio: idEstagioDestino });
        return;
      }

      await moverLead(idLead, idEstagioDestino);
    },
    [leads, estagios, moverLead],
  );

  const confirmarPerda = useCallback(
    async (evento: FormEvent<HTMLFormElement>) => {
      evento.preventDefault();
      if (!movimentoPendente || !motivoPerda.trim()) return;

      const sucesso = await moverLead(
        movimentoPendente.id_lead,
        movimentoPendente.id_estagio,
        motivoPerda.trim(),
      );
      if (!sucesso) return;

      setMovimentoPendente(null);
      setMotivoPerda("");
    },
    [movimentoPendente, motivoPerda, moverLead],
  );

  return {
    movimentoPendente,
    setMovimentoPendente,
    motivoPerda,
    setMotivoPerda,
    moverLead,
    aoDragEnd,
    confirmarPerda,
    optimisticLeads, // Return optimistic state for rendering
    isPending, // Return pending state for loading indicators
  };
}