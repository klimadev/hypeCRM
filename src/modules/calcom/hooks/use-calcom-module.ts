"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalComInstancia, CalComBooking, CalComEventType, UseCalComModuleReturn } from "../types";

export function useCalComModule(): UseCalComModuleReturn {
  const [instancias, setInstancias] = useState<CalComInstancia[]>([]);
  const [bookings, setBookings] = useState<CalComBooking[]>([]);
  const [eventTypes, setEventTypes] = useState<CalComEventType[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDashboard = useCallback(async (signal?: AbortSignal) => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/calcom/dashboard?limit=5", {
        signal,
        cache: "no-store",
      });
      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados.erro ?? "Erro ao carregar dados do Calendário.");
      }

      setInstancias(dados.instancias || []);
      setBookings(dados.bookings || []);
      setEventTypes(dados.eventTypes || []);
    } catch (erro) {
      if (signal?.aborted) return;
      setErro(erro instanceof Error ? erro.message : "Erro ao carregar dados do Calendário.");
    } finally {
      if (!signal?.aborted) {
        setCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    carregarDashboard(controller.signal);
    return () => controller.abort();
  }, [carregarDashboard]);

  const recarregar = useCallback(async () => {
    await carregarDashboard();
  }, [carregarDashboard]);

  const criarInstancia = useCallback(async (nome: string, apiKey: string) => {
    try {
      const res = await fetch("/api/calcom/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, api_key: apiKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await recarregar();
        return { sucesso: true };
      }
      return { sucesso: false, erro: data.erro };
    } catch {
      return { sucesso: false, erro: "Erro de conexão." };
    }
  }, [recarregar]);

  const excluirInstancia = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/calcom/instances/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await recarregar();
        return { sucesso: true };
      }
      return { sucesso: false, erro: data.erro };
    } catch {
      return { sucesso: false, erro: "Erro de conexão." };
    }
  }, [recarregar]);

  const testarConexao = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/calcom/instances/${id}/teste`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.sucesso) {
        await recarregar();
        return { sucesso: true };
      }
      return { sucesso: false, erro: data.erro };
    } catch {
      return { sucesso: false, erro: "Erro de conexão." };
    }
  }, [recarregar]);

  return {
    instancias,
    bookings,
    eventTypes,
    carregando,
    erro,
    criarInstancia,
    excluirInstancia,
    testarConexao,
    recarregar,
  };
}
