import { useCallback, useEffect, useState } from "react";
import {
  despublicarWorkspace,
  listarExecucoesWorkspace,
  obterWorkspace,
  publicarWorkspace,
  salvarWorkspace,
  type AutomacaoExecucaoItem,
} from "@/lib/api/automacoes";
import { normalizarGrafo } from "../lib/workflow-graph-utils";
import type { WorkflowEdgeModel, WorkflowNodeModel } from "../types";

type ToastInput = {
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
};

type UseAutomacoesWorkspaceIOParams = {
  nodes: WorkflowNodeModel[];
  edges: WorkflowEdgeModel[];
  activeView: "canvas" | "logs";
  onWorkspaceLoaded: (payload: { nodes: WorkflowNodeModel[]; edges: WorkflowEdgeModel[] }) => void;
  onToast: (input: ToastInput) => void;
};

export function useAutomacoesWorkspaceIO({
  nodes,
  edges,
  activeView,
  onWorkspaceLoaded,
  onToast,
}: UseAutomacoesWorkspaceIOParams) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [ultimoSave, setUltimoSave] = useState<string | null>(null);
  const [execucoes, setExecucoes] = useState<AutomacaoExecucaoItem[]>([]);
  const [isLoadingExecucoes, setIsLoadingExecucoes] = useState(false);

  const loadExecucoes = useCallback(async () => {
    setIsLoadingExecucoes(true);
    try {
      const data = await listarExecucoesWorkspace(50);
      setExecucoes(data.execucoes);
    } catch {
      onToast({
        type: "error",
        title: "Erro ao carregar execuções",
        description: "Não foi possível carregar os logs da automação.",
      });
    } finally {
      setIsLoadingExecucoes(false);
    }
  }, [onToast]);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await obterWorkspace();
      if (data.workspace.rascunho_grafo_json) {
        const grafo = normalizarGrafo(JSON.parse(data.workspace.rascunho_grafo_json));
        onWorkspaceLoaded({ nodes: grafo.nodes, edges: grafo.edges });
      }
      setIsPublished(!!data.published);
      setUltimoSave(new Date(data.workspace.atualizado_em).toLocaleString("pt-BR"));
    } catch {
      onToast({
        type: "error",
        title: "Erro ao carregar automações",
        description: "Não foi possível carregar o workspace.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [onToast, onWorkspaceLoaded]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const grafoJson = JSON.stringify({ nodes, edges });
      await salvarWorkspace(grafoJson);
      setUltimoSave(new Date().toLocaleString("pt-BR"));
      onToast({ type: "success", title: "Automação salva", description: "Rascunho salvo com sucesso." });
      return true;
    } catch (e) {
      console.error("Erro ao salvar:", e);
      onToast({ type: "error", title: "Erro ao salvar", description: "Não foi possível salvar o rascunho." });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [edges, nodes, onToast]);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      const saveOk = await handleSave();
      if (!saveOk) {
        return;
      }

      const data = await publicarWorkspace();
      setIsPublished(!!data.published);
      onToast({ type: "success", title: "Automação publicada", description: "Nova versão publicada com sucesso." });
    } catch (e) {
      console.error("Erro ao publicar:", e);
      onToast({ type: "error", title: "Erro ao publicar", description: "Revise o fluxo e tente novamente." });
    } finally {
      setIsPublishing(false);
    }
  }, [handleSave, onToast]);

  const handleUnpublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      await despublicarWorkspace();
      setIsPublished(false);
      onToast({ type: "success", title: "Automação despublicada", description: "O fluxo voltou para estado de rascunho." });
    } catch (e) {
      console.error("Erro ao despublicar:", e);
      onToast({ type: "error", title: "Erro ao despublicar", description: "Não foi possível despublicar a automação." });
    } finally {
      setIsPublishing(false);
    }
  }, [onToast]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (activeView === "logs") {
      void loadExecucoes();
    }
  }, [activeView, loadExecucoes]);

  return {
    isLoading,
    isSaving,
    isPublishing,
    isPublished,
    ultimoSave,
    execucoes,
    isLoadingExecucoes,
    loadExecucoes,
    handleSave,
    handlePublish,
    handleUnpublish,
  };
}
