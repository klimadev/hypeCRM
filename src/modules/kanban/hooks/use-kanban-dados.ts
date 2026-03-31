import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calcularPendenciasLead, type PendenciaCalculada } from "@/lib/calculo-pendencias";
import type { Estagio, Funcionario, Lead, Pdv } from "../types";
import { usePendenciasGlobais, type PendenciaInfo } from "./use-pendencias-globais";
import { useKanbanRealtime } from "./use-kanban-realtime";

type UseKanbanDadosParams = {
  addToast?: (params: {
    type: "success" | "error" | "warning";
    title: string;
    description?: string;
  }) => void;
};

export function useKanbanDados({ addToast }: UseKanbanDadosParams = {}) {
  const [estagios, setEstagios] = useState<Estagio[]>([]);
  const [negocios, setNegocios] = useState<Lead[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [pdvs, setPdvs] = useState<Pdv[]>([]);
  const negociosRef = useRef<Lead[]>([]);
  const bootstrapSeqRef = useRef(0);

  const {
    resumo: resumoPendencias,
    recarregar: recarregarPendencias,
    atualizarComDadosLocais,
    notificacoesAtivadas,
    alternarNotificacoes,
    permissaoNotificacao,
  } = usePendenciasGlobais();

  const bootstrapRef = useRef<() => Promise<void> | null>(null);

  const bootstrap = useCallback(async () => {
    const seq = ++bootstrapSeqRef.current;
    const { listarKanban } = await import("@/lib/api/kanban");
    const resposta = await listarKanban();
    
    // Ignorar resposta se um bootstrap mais recente foi iniciado
    if (seq !== bootstrapSeqRef.current) return;
    if (!resposta.ok) return;

    setEstagios(resposta.dados.estagios);
    setNegocios(resposta.dados.negocios);
    setFuncionarios(resposta.dados.funcionarios);
    setPdvs(resposta.dados.pdvs);
  }, []);

  useEffect(() => {
    bootstrapRef.current = bootstrap;
  }, [bootstrap]);

  const { registrarMovimentoLocal } = useKanbanRealtime({
    negociosRef,
    onSync: async ({ silencioso }) => {
      if (silencioso && bootstrapRef.current) {
        await bootstrapRef.current();
      }
    },
    addToast,
  });

  useEffect(() => {
    negociosRef.current = negocios;
  }, [negocios]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void bootstrap();
    }, 0);

    return () => clearTimeout(timer);
  }, [bootstrap]);

  const todasPendenciasLocais = useMemo<PendenciaCalculada[]>(() => {
    const pendencias: PendenciaCalculada[] = [];
    const mapaEstagios = Object.fromEntries(estagios.map((estagio) => [estagio.id, estagio]));

    for (const negocio of negocios) {
      const estagio = mapaEstagios[negocio.id_estagio];
      if (!estagio) continue;
      pendencias.push(...calcularPendenciasLead(negocio, estagio));
    }

    return pendencias;
  }, [negocios, estagios]);

  const sincronizarPendencias = useCallback(() => {
    atualizarComDadosLocais(todasPendenciasLocais as PendenciaInfo[]);
  }, [atualizarComDadosLocais, todasPendenciasLocais]);

  useEffect(() => {
    if (negocios.length > 0 || estagios.length > 0) {
      sincronizarPendencias();
    }
  }, [negocios, estagios, sincronizarPendencias]);

  return {
    estagios,
    setEstagios,
    negocios,
    setNegocios,
    funcionarios,
    setFuncionarios,
    pdvs,
    setPdvs,
    bootstrap,
    registrarMovimentoLocal,
    resumoPendencias,
    recarregarPendencias,
    notificacoesAtivadas,
    alternarNotificacoes,
    permissaoNotificacao,
  };
}
