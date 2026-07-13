"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  MetaLeadsToken,
  MetaLeadsTestResult,
  MetaLeadsSyncResult,
  UseMetaLeadsModuleReturn,
  CampoMapping,
} from "../types";

export function useMetaLeadsModule(): UseMetaLeadsModuleReturn {
  const [config, setConfig] = useState<{
    pageTokens: MetaLeadsToken[];
    ativo: boolean;
    ultimaSync: string | null;
    campoMapping: CampoMapping;
  } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const carregarDados = useCallback(async (signal?: AbortSignal) => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/integracoes/meta-leads/config", {
        signal,
        cache: "no-store",
      });
      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados.erro ?? "Erro ao carregar dados.");
      }

      setConfig({
        pageTokens: dados.pageTokens ?? [],
        ativo: dados.ativo ?? false,
        ultimaSync: dados.ultimaSync ?? null,
        campoMapping: dados.campoMapping ?? {},
      });
    } catch (e) {
      if (signal?.aborted) return;
      setErro(e instanceof Error ? e.message : "Erro ao carregar dados.");
    } finally {
      if (!signal?.aborted) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    carregarDados(controller.signal);
    return () => controller.abort();
  }, [carregarDados]);

  // ponytail: polling simples, trocar por Vercel Cron se escala
  useEffect(() => {
    if (config?.ativo) {
      const id = setInterval(() => {
        fetch("/api/integracoes/meta-leads/sync", { method: "POST" })
          .then(() => carregarDados())
          .catch(() => {});
      }, (config?.ativo ? 5 : 5) * 60_000);
      setPollInterval(id);
      return () => clearInterval(id);
    }
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    // ponytail: só limpa no unmount, dependency só quando ativo muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.ativo]);

  const recarregar = useCallback(async () => {
    await carregarDados();
  }, [carregarDados]);

  const salvarConfig = useCallback(
    async (tokens: MetaLeadsToken[], ativo: boolean, campoMapping?: CampoMapping) => {
      try {
        const res = await fetch("/api/integracoes/meta-leads/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageTokens: tokens, ativo, campoMapping }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          await recarregar();
          return { sucesso: true };
        }
        return { sucesso: false, erro: data.erro };
      } catch {
        return { sucesso: false, erro: "Erro de conexao." };
      }
    },
    [recarregar],
  );

  const testarConexao = useCallback(
    async (tokens?: Array<{ raw: string; pageId?: string; pageName?: string }>) => {
      try {
        const res = await fetch("/api/integracoes/meta-leads/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokens: tokens ?? [] }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.sucesso) {
          return { sucesso: true, dados: data.dados as MetaLeadsTestResult };
        }
        return { sucesso: false, erro: data.erro ?? "Erro ao testar." };
      } catch {
        return { sucesso: false, erro: "Erro de conexao." };
      }
    },
    [],
  );

  const syncAgora = useCallback(async () => {
    try {
      const res = await fetch("/api/integracoes/meta-leads/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      await recarregar();
      return data as MetaLeadsSyncResult;
    } catch {
      return null;
    }
  }, [recarregar]);

  return {
    config,
    carregando,
    erro,
    salvarConfig,
    testarConexao,
    syncAgora,
    recarregar,
  };
}
