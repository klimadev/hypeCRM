import { useCallback, useEffect, useRef, useState } from "react";
import {
  despublicarWorkspace,
  excluirWorkspace,
  listarExecucoesWorkspace,
  obterWorkspace,
  publicarWorkspace,
  salvarWorkspace,
  type AutomacaoExecucaoItem,
} from "@/lib/api/automacoes";
import { normalizarGrafo } from "../lib/workflow-graph-utils";
import type { WorkflowEdgeModel, WorkflowNodeModel } from "../types";

const isDebug = process.env.NODE_ENV === "development";

type WorkspaceDataLog = {
  nodes: number;
  edges: number;
  isPublished: boolean;
  updatedAt?: string | null;
};

function logDebug(action: string, payload?: Record<string, unknown>) {
  if (!isDebug) {
    return;
  }

  console.info("[AutomacoesIO]", action, payload ?? {});
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error ?? "Erro desconhecido"),
  };
}

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
  const onWorkspaceLoadedRef = useRef(onWorkspaceLoaded);
  const onToastRef = useRef(onToast);

  useEffect(() => {
    onWorkspaceLoadedRef.current = onWorkspaceLoaded;
  }, [onWorkspaceLoaded]);

  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [ultimoSave, setUltimoSave] = useState<string | null>(null);
  const [execucoes, setExecucoes] = useState<AutomacaoExecucaoItem[]>([]);
  const [isLoadingExecucoes, setIsLoadingExecucoes] = useState(false);
  const loadExecucoesRef = useRef<null | (() => Promise<void>)>(null);

  const safeSetUltimoSave = (valor: unknown) => {
    const data = new Date(String(valor));
    if (Number.isNaN(data.getTime())) {
      setUltimoSave(null);
      return;
    }
    setUltimoSave(data.toLocaleString("pt-BR"));
  };

  const traceWorkspaceData = ({ nodes, edges, isPublished, updatedAt }: WorkspaceDataLog) => {
    logDebug("workspace carregado", {
      nodes,
      edges,
      isPublished,
      updatedAt,
      updatedAtDate: updatedAt ? new Date(updatedAt).toISOString() : null,
    });
  };

  const loadExecucoes = useCallback(async () => {
    logDebug("carregar execucoes iniciada");
    setIsLoadingExecucoes(true);
    try {
      const data = await listarExecucoesWorkspace(50);
      logDebug("execucoes recebidas", {
        total: data?.execucoes?.length ?? 0,
      });
      setExecucoes(data.execucoes);
    } catch {
      console.error("[AutomacoesIO] Falha ao carregar execuções", {
        payload: { action: "loadExecucoes" },
      });
      onToastRef.current({
        type: "error",
        title: "Erro ao carregar execuções",
        description: "Não foi possível carregar os logs da automação.",
      });
    } finally {
      setIsLoadingExecucoes(false);
    }
  }, []);

  useEffect(() => {
    loadExecucoesRef.current = loadExecucoes;
    logDebug("referencia loadExecucoes atualizada", {
      hasLoadExecucoes: typeof loadExecucoesRef.current === "function",
    });
  }, [loadExecucoes]);

  const loadWorkspace = useCallback(async () => {
    logDebug("carregar workspace iniciada");
    setIsLoading(true);
    try {
      const data = await obterWorkspace();
      logDebug("resposta bruta do workspace", {
        workspaceId: data?.workspace?.id,
        hasDraft: Boolean(data?.workspace?.rascunho_grafo_json),
        publishedId: data?.workspace?.versao_publicada_id ?? null,
        rawDraftLength: data?.workspace?.rascunho_grafo_json?.length ?? 0,
      });

      if (!data?.workspace) {
        throw new Error("Resposta sem workspace.");
      }

        if (data.workspace.rascunho_grafo_json) {
          const grafo = normalizarGrafo(JSON.parse(data.workspace.rascunho_grafo_json));
          traceWorkspaceData({
            nodes: grafo.nodes.length,
            edges: grafo.edges.length,
            isPublished: Boolean(data.published),
            updatedAt: data.workspace.atualizado_em,
          });
          onWorkspaceLoadedRef.current({ nodes: grafo.nodes, edges: grafo.edges });
        }

      if (!data.workspace.rascunho_grafo_json) {
        logDebug("workspace sem rascunho", { workspaceId: data.workspace.id });
      }

      setIsPublished(!!data.published);
      safeSetUltimoSave(data.workspace.atualizado_em);
    } catch (e) {
      const erroFormatado = formatError(e);
      console.error("[AutomacoesIO] Falha ao carregar workspace:", {
        error: erroFormatado,
        raw: safeStringify({
          workspace: { id: "workspace", updated_at: "atualizado_em" },
        }),
      });
      onToastRef.current({
        type: "error",
        title: "Erro ao carregar automações",
        description: "Não foi possível carregar o workspace.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const grafoJson = JSON.stringify({ nodes, edges });
      logDebug("salvar workspace", {
        grafoBytes: grafoJson.length,
        nodes: nodes.length,
        edges: edges.length,
      });
      await salvarWorkspace(grafoJson);
      setUltimoSave(new Date().toLocaleString("pt-BR"));
      onToastRef.current({ type: "success", title: "Automação salva", description: "Rascunho salvo com sucesso." });
      return true;
    } catch (e) {
      const erroFormatado = formatError(e);
      console.error("[AutomacoesIO] Erro ao salvar:", {
        error: erroFormatado,
        payload: safeStringify({ nodes, edges }),
      });
      onToastRef.current({ type: "error", title: "Erro ao salvar", description: "Não foi possível salvar o rascunho." });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [edges, nodes]);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      logDebug("publicar fluxo iniciado", { nodes: nodes.length, edges: edges.length });
      const saveOk = await handleSave();
      if (!saveOk) {
        logDebug("publicar fluxo bloqueado por falha no save");
        return;
      }

      const data = await publicarWorkspace();
      logDebug("publicado com sucesso", {
        workspaceId: data?.workspace?.id,
        publishedId: data?.published?.id,
      });
      setIsPublished(!!data.published);
      onToastRef.current({ type: "success", title: "Automação publicada", description: "Nova versão publicada com sucesso." });
    } catch (e) {
      const erroFormatado = formatError(e);
      console.error("[AutomacoesIO] Erro ao publicar:", {
        error: erroFormatado,
        payload: safeStringify({ nodes, edges }),
      });
      onToastRef.current({ type: "error", title: "Erro ao publicar", description: "Revise o fluxo e tente novamente." });
    } finally {
      setIsPublishing(false);
    }
  }, [handleSave, nodes, edges]);

  const handleUnpublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      await despublicarWorkspace();
      logDebug("despublicar concluido", { isPublishedAntes: isPublished });
      setIsPublished(false);
      onToastRef.current({ type: "success", title: "Automação despublicada", description: "O fluxo voltou para estado de rascunho." });
    } catch (e) {
      const erroFormatado = formatError(e);
      console.error("[AutomacoesIO] Erro ao despublicar:", {
        error: erroFormatado,
      });
      onToastRef.current({ type: "error", title: "Erro ao despublicar", description: "Não foi possível despublicar a automação." });
    } finally {
      setIsPublishing(false);
    }
  }, [isPublished]);

  const handleDelete = useCallback(async () => {
    setIsPublishing(true);
    try {
      logDebug("excluir fluxo iniciado");
      await excluirWorkspace();
      onToastRef.current({ type: "success", title: "Automação excluída", description: "O fluxo foi removido com sucesso." });
      // Recarregar workspace para criar novo vazio
      await loadWorkspace();
      return true;
    } catch (e) {
      const erroFormatado = formatError(e);
      console.error("[AutomacoesIO] Erro ao excluir:", {
        error: erroFormatado,
      });
      onToastRef.current({ type: "error", title: "Erro ao excluir", description: "Não foi possível excluir a automação." });
      return false;
    } finally {
      setIsPublishing(false);
    }
  }, [loadWorkspace]);

  useEffect(() => {
    logDebug("montando hook de automacoes", { mountAt: new Date().toISOString() });
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (activeView === "logs") {
      if (!loadExecucoesRef.current) {
        logDebug("loadExecucoes ignorado: referencia indisponivel", { activeView });
        return;
      }

      void loadExecucoesRef.current();
    }
  }, [activeView]);

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
    handleDelete,
  };
}
