"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeedbackItem, FeedbackEvento } from "../../types";

export type UseFeedbackDetalheReturn = {
  item: FeedbackItem | null;
  eventos: FeedbackEvento[];
  carregando: boolean;
  erro: string | null;
  carregandoStatus: boolean;
  atualizar: (status: string, prioridade: string, nota_interna?: string) => Promise<void>;
  recarregar: () => Promise<void>;
};

export function useFeedbackDetalhe(id: string | null): UseFeedbackDetalheReturn {
  const [item, setItem] = useState<FeedbackItem | null>(null);
  const [eventos, setEventos] = useState<FeedbackEvento[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoStatus, setCarregandoStatus] = useState(false);

  const buscar = useCallback(async () => {
    if (!id) return;
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/super-admin/feedbacks/${id}`);
      if (!res.ok) throw new Error("Falha ao carregar feedback.");
      const data = await res.json();
      setItem(data.item);
      setEventos(data.eventos);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setCarregando(false);
    }
  }, [id]);

  const recarregar = useCallback(async () => {
    if (!id) return;
    await buscar();
  }, [buscar]);

  useEffect(() => { buscar(); }, [buscar]);

  const atualizar = useCallback(async (status: string, prioridade: string, nota_interna?: string) => {
    if (!id) return;
    setCarregandoStatus(true);
      try {
        const res = await fetch(`/api/super-admin/feedbacks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, prioridade, ...(nota_interna && { nota_interna }) }),
        });
        if (!res.ok) throw new Error("Falha ao atualizar.");
        await buscar();
      } finally {
      setCarregandoStatus(false);
    }
  }, [id, buscar]);

  return {
    item,
    eventos,
    carregando,
    erro,
    carregandoStatus,
    atualizar,
    recarregar,
  };
}
