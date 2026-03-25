"use client";

import { useState, useCallback } from "react";
import type {
  Automacao,
  AutomacaoForm,
  DispatchStats,
  UseAutomacoesReturn,
} from "../types";

export function useAutomacoes(): UseAutomacoesReturn {
  const [automacoes, setAutomacoes] = useState<Automacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/automacoes");
      const json = await resposta.json();
      if (resposta.ok && json.dados) {
        setAutomacoes(json.dados.automacoes || []);
      } else {
        setErro(json.erro || "Erro ao carregar automacoes.");
      }
    } catch {
      setErro("Erro de conexao ao carregar automacoes.");
    } finally {
      setCarregando(false);
    }
  }, []);

  const criarAutomacao = useCallback(
    async (dados: AutomacaoForm): Promise<{ sucesso: boolean; erro?: string }> => {
      try {
        const resposta = await fetch("/api/automacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        });
        const json = await resposta.json();
        if (resposta.ok) {
          await recarregar();
          return { sucesso: true };
        }
        return { sucesso: false, erro: json.erro || "Erro ao criar automacao." };
      } catch {
        return { sucesso: false, erro: "Erro de conexao." };
      }
    },
    [recarregar]
  );

  const atualizarAutomacao = useCallback(
    async (id: string, dados: Partial<AutomacaoForm>): Promise<{ sucesso: boolean; erro?: string }> => {
      try {
        const resposta = await fetch(`/api/automacoes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        });
        const json = await resposta.json();
        if (resposta.ok) {
          await recarregar();
          return { sucesso: true };
        }
        return { sucesso: false, erro: json.erro || "Erro ao atualizar automacao." };
      } catch {
        return { sucesso: false, erro: "Erro de conexao." };
      }
    },
    [recarregar]
  );

  const excluirAutomacao = useCallback(
    async (id: string): Promise<{ sucesso: boolean; erro?: string }> => {
      try {
        const resposta = await fetch(`/api/automacoes/${id}`, {
          method: "DELETE",
        });
        const json = await resposta.json();
        if (resposta.ok) {
          await recarregar();
          return { sucesso: true };
        }
        return { sucesso: false, erro: json.erro || "Erro ao excluir automacao." };
      } catch {
        return { sucesso: false, erro: "Erro de conexao." };
      }
    },
    [recarregar]
  );

  const alternarAutomacao = useCallback(
    async (id: string): Promise<{ sucesso: boolean; erro?: string }> => {
      try {
        const resposta = await fetch(`/api/automacoes/${id}/toggle`, {
          method: "POST",
        });
        const json = await resposta.json();
        if (resposta.ok) {
          await recarregar();
          return { sucesso: true };
        }
        return { sucesso: false, erro: json.erro || "Erro ao alternar automacao." };
      } catch {
        return { sucesso: false, erro: "Erro de conexao." };
      }
    },
    [recarregar]
  );

  const dispararDispatch = useCallback(
    async (params?: {
      only?: string;
      automacao_id?: string;
    }): Promise<{ sucesso: boolean; stats?: DispatchStats; erro?: string }> => {
      try {
        const query = new URLSearchParams();
        if (params?.only) query.set("only", params.only);
        if (params?.automacao_id) query.set("automacao_id", params.automacao_id);

        const resposta = await fetch(`/api/dispatch?${query.toString()}`, {
          method: "POST",
        });
        const json = await resposta.json();
        if (resposta.ok) {
          return { sucesso: true, stats: json.dados };
        }
        return { sucesso: false, erro: json.erro || "Erro ao processar fila." };
      } catch {
        return { sucesso: false, erro: "Erro de conexao." };
      }
    },
    []
  );

  return {
    automacoes,
    carregando,
    erro,
    criarAutomacao,
    atualizarAutomacao,
    excluirAutomacao,
    alternarAutomacao,
    dispararDispatch,
    recarregar,
  };
}
