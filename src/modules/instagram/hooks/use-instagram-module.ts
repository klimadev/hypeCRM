"use client";

import { useCallback, useEffect, useState } from "react";
import type { InstagramConta, UseInstagramModuleReturn } from "../types";

export function useInstagramModule(): UseInstagramModuleReturn {
  const [contas, setContas] = useState<InstagramConta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarContas = useCallback(async (signal?: AbortSignal) => {
    setCarregando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/integracoes/instagram/accounts", {
        signal,
        cache: "no-store",
      });
      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados.erro ?? "Nao foi possivel carregar as contas do Instagram.");
      }

      setContas(dados.contas ?? []);
    } catch (erro) {
      if (signal?.aborted) return;
      setErro(erro instanceof Error ? erro.message : "Nao foi possivel carregar as contas do Instagram.");
    } finally {
      if (!signal?.aborted) {
        setCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    carregarContas(controller.signal);
    return () => controller.abort();
  }, [carregarContas]);

  const recarregar = useCallback(async () => {
    await carregarContas();
  }, [carregarContas]);

  const excluirConta = useCallback(async (id: string) => {
    try {
      const resposta = await fetch(`/api/integracoes/instagram/accounts/${id}`, { method: "DELETE" });
      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        return { sucesso: false, erro: dados.erro ?? "Nao foi possivel remover a conta." };
      }

      await recarregar();
      return { sucesso: true };
    } catch {
      return { sucesso: false, erro: "Erro de conexao." };
    }
  }, [recarregar]);

  return {
    contas,
    carregando,
    erro,
    excluirConta,
    recarregar,
  };
}
