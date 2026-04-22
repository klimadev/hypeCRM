"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeedbackItem, FeedbacksResponse } from "../../types";

export type UseFeedbackAdminReturn = {
  items: FeedbackItem[];
  carregando: boolean;
  erro: string | null;
  pagina: number;
  totalPaginas: number;
  filtroTipo: string;
  filtroStatus: string;
  setPagina: (p: number) => void;
  setFiltroTipo: (t: string) => void;
  setFiltroStatus: (s: string) => void;
  recarregar: () => Promise<void>;
};

export function useFeedbackAdmin(): UseFeedbackAdminReturn {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const params = new URLSearchParams({ pagina: String(pagina), limite: "20" });
      if (filtroTipo) params.set("tipo", filtroTipo);
      if (filtroStatus) params.set("status", filtroStatus);
      const res = await fetch(`/api/super-admin/feedbacks?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar feedbacks.");
      const data: FeedbacksResponse = await res.json();
      setItems(data.items);
      setTotalPaginas(data.totalPaginas);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setCarregando(false);
    }
  }, [pagina, filtroTipo, filtroStatus]);

  const setFiltroTipoComReset = useCallback((tipo: string) => {
    setFiltroTipo((valorAnterior) => (valorAnterior === tipo ? valorAnterior : tipo));
    setPagina(1);
  }, []);

  const setFiltroStatusComReset = useCallback((status: string) => {
    setFiltroStatus((valorAnterior) => (valorAnterior === status ? valorAnterior : status));
    setPagina(1);
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  return {
    items,
    carregando,
    erro,
    pagina,
    totalPaginas,
    filtroTipo,
    filtroStatus,
    setPagina,
    setFiltroTipo: setFiltroTipoComReset,
    setFiltroStatus: setFiltroStatusComReset,
    recarregar: buscar,
  };
}
