"use client";

import { useCallback, useEffect, useState } from "react";
import type { MetaCapiConfig, MetaCapiEvento, UseMetaModuleReturn, MetaCapiTestResult } from "../types";

export type { MetaCapiTestResult };

export function useMetaModule(): UseMetaModuleReturn {
  const [config, setConfig] = useState<MetaCapiConfig | null>(null);
  const [eventos, setEventos] = useState<MetaCapiEvento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDados = useCallback(async (signal?: AbortSignal) => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/integracoes/meta/config", {
        signal,
        cache: "no-store",
      });
      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados.erro ?? "Erro ao carregar dados da Meta CAPI.");
      }

      setConfig({
        pixelId: dados.pixelId ?? "",
        accessToken: dados.accessToken ?? "",
        eventName: dados.eventName ?? "lead_closed",
        ativo: dados.ativo ?? false,
      });
      setEventos(dados.eventos || []);
    } catch (erro) {
      if (signal?.aborted) return;
      setErro(erro instanceof Error ? erro.message : "Erro ao carregar dados da Meta CAPI.");
    } finally {
      if (!signal?.aborted) {
        setCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    carregarDados(controller.signal);
    return () => controller.abort();
  }, [carregarDados]);

  const recarregar = useCallback(async () => {
    await carregarDados();
  }, [carregarDados]);

  const salvarConfig = useCallback(async (novoConfig: MetaCapiConfig) => {
    console.log("[META] Hook salvarConfig: Iniciando com:", JSON.stringify(novoConfig));
    try {
      console.log("[META] Hook: Fetching /api/integracoes/meta/save...");
      const res = await fetch("/api/integracoes/meta/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoConfig),
      });
      console.log("[META] Hook salvarConfig: Response status:", res.status);

      const data = await res.json().catch(() => ({}));
      console.log("[META] Hook salvarConfig: Response data:", JSON.stringify(data));

      if (res.ok) {
        console.log("[META] Hook: Recarregando dados...");
        await recarregar();
        console.log("[META] Hook: Sucesso!");
        return { sucesso: true };
      }

      console.log("[META] Hook: Erro retornado:", data.erro);
      return { sucesso: false, erro: data.erro };
    } catch (err) {
      console.log("[META] Hook salvarConfig: Exceção:", err);
      return { sucesso: false, erro: "Erro de conexão." };
    }
  }, [recarregar]);

  const testarConexao = useCallback(async () => {
    console.log("[META-TEST] Hook: Iniciando teste de conexão");
    try {
      const res = await fetch("/api/integracoes/meta/test", { method: "POST" });
      console.log("[META-TEST] Hook: Response status:", res.status);

      const data = await res.json().catch(() => ({}));
      console.log("[META-TEST] Hook: Response data:", JSON.stringify(data));

      if (data.ok) {
        console.log("[META-TEST] Hook: Sucesso!");
        return { sucesso: true, dados: data.dados };
      }

      console.log("[META-TEST] Hook: Erro retornado:", data.erro ?? data.mensagem);
      return { sucesso: false, erro: data.erro ?? data.mensagem };
    } catch (err) {
      console.log("[META-TEST] Hook: Exceção capturada:", err);
      return { sucesso: false, erro: "Erro de conexão." };
    }
  }, []);

  return {
    config,
    eventos,
    carregando,
    erro,
    salvarConfig,
    testarConexao,
    recarregar,
  };
}
