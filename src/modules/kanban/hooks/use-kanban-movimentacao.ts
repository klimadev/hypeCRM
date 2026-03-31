import { useCallback, useState, useOptimistic, useTransition } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import type { Estagio, Lead } from "../types";
import { moverNegocioKanban } from "@/lib/api/kanban";

type UseKanbanMovimentacaoParams = {
  negocios: Lead[];
  estagios: Estagio[];
  setNegocios: Dispatch<SetStateAction<Lead[]>>;
  registrarMovimentoLocal: () => void;
  addToast: (params: {
    type: "success" | "error" | "warning";
    title: string;
    description?: string;
  }) => void;
};

export function useKanbanMovimentacao({
  negocios,
  estagios,
  setNegocios,
  registrarMovimentoLocal,
  addToast,
}: UseKanbanMovimentacaoParams) {
  const [isPending, startTransition] = useTransition();
  const [movimentoPendente, setMovimentoPendente] = useState<{
    id_negocio: string;
    id_estagio: string;
  } | null>(null);
  const [motivoPerda, setMotivoPerda] = useState("");

  // useOptimistic replaces manual setLeads for movement
  // React automatically handles rollback on error
  const [optimisticNegocios, addOptimisticMove] = useOptimistic(
    negocios,
    (state, update: { id: string; id_estagio: string; motivo_perda: string | null }) =>
      state.map((item) =>
        item.id === update.id
          ? { ...item, id_estagio: update.id_estagio, motivo_perda: update.motivo_perda }
          : item,
      ),
  );

  const moverNegocio = useCallback(
    async (idNegocio: string, idEstagio: string, motivo?: string) => {
      const negocioAnterior = negocios.find((item) => item.id === idNegocio);
      if (!negocioAnterior) return false;

      // 1. Optimistic update — instant UI change
      addOptimisticMove({
        id: idNegocio,
        id_estagio: idEstagio,
        motivo_perda: motivo?.trim() ? motivo.trim() : null,
      });
      registrarMovimentoLocal();

      // 2. Server request in transition (non-blocking)
      startTransition(async () => {
        const resposta = await moverNegocioKanban(idNegocio, {
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

        if (resposta.dados.negocio) {
          const negocioAtualizado = resposta.dados.negocio;
          setNegocios((atual) => atual.map((item) => (item.id === idNegocio ? negocioAtualizado : item)));
        }

        if (resposta.dados.mensagem) {
          addToast({
            type: "warning",
            title: "Negócio com pendência de análise",
            description: resposta.dados.mensagem,
          });
        }
      });

      return true;
    },
    [addOptimisticMove, negocios, registrarMovimentoLocal, setNegocios, addToast],
  );

  const aoDragEnd = useCallback(
    async (resultado: DropResult) => {
      if (!resultado.destination) return;

      const idNegocio = resultado.draggableId;
      const idEstagioDestino = resultado.destination.droppableId;

      const negocio = negocios.find((item) => item.id === idNegocio);
      if (!negocio || negocio.id_estagio === idEstagioDestino) return;

      const estagioDestino = estagios.find((item) => item.id === idEstagioDestino);
      if (!estagioDestino) return;

      if (estagioDestino.tipo === "PERDIDO") {
        setMovimentoPendente({ id_negocio: idNegocio, id_estagio: idEstagioDestino });
        return;
      }

      await moverNegocio(idNegocio, idEstagioDestino);
    },
    [negocios, estagios, moverNegocio],
  );

  const confirmarPerda = useCallback(
    async (evento: FormEvent<HTMLFormElement>) => {
      evento.preventDefault();
      if (!movimentoPendente || !motivoPerda.trim()) return;

      const sucesso = await moverNegocio(
        movimentoPendente.id_negocio,
        movimentoPendente.id_estagio,
        motivoPerda.trim(),
      );
      if (!sucesso) return;

      setMovimentoPendente(null);
      setMotivoPerda("");
    },
    [movimentoPendente, motivoPerda, moverNegocio],
  );

  return {
    movimentoPendente,
    setMovimentoPendente,
    motivoPerda,
    setMotivoPerda,
    moverNegocio,
    aoDragEnd,
    confirmarPerda,
    optimisticNegocios, // Return optimistic state for rendering
    isPending, // Return pending state for loading indicators
  };
}
