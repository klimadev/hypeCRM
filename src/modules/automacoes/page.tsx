"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crosshair, Plus, Save, Send, Slash, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { BuilderCanvas, type BuilderCanvasApi } from "./components/builder-canvas";
import { NodeCreationDialog } from "./components/node-creation-dialog";
import { criarWorkflowEdge, criarWorkflowNode, WORKFLOW_KIND_META, WORKFLOW_STEP_OPTIONS, WORKFLOW_TRIGGER_OPTIONS } from "./lib/workflow-builder-seeds";
import type { WorkflowBranch, WorkflowEdgeModel, WorkflowNodeConfig, WorkflowNodeModel, WorkflowNodeTemplate } from "./types";
import { despublicarWorkspace, listarExecucoesWorkspace, obterWorkspace, publicarWorkspace, salvarWorkspace, type AutomacaoExecucaoItem } from "@/lib/api/automacoes";
import { listarInstanciasWhatsapp } from "@/lib/api/whatsapp.instances";
import { instanciaWhatsappEstaConectada } from "@/lib/whatsapp-instancia-status";

type WhatsappInstanciaOption = {
  id: string;
  nome: string;
};

function isNodeValido(node: unknown): node is WorkflowNodeModel {
  if (!node || typeof node !== "object") return false;
  const value = node as Record<string, unknown>;
  if (typeof value.id !== "string") return false;
  if (value.kind !== "gatilho" && value.kind !== "acao") return false;
  if (value.type !== "trigger.lead_criado" && value.type !== "whatsapp.enviar_texto") return false;
  if (typeof value.label !== "string" || typeof value.description !== "string") return false;
  if (typeof value.x !== "number" || typeof value.y !== "number") return false;
  return typeof value.config === "object" && value.config !== null;
}

function isEdgeValida(edge: unknown): edge is WorkflowEdgeModel {
  if (!edge || typeof edge !== "object") return false;
  const value = edge as Record<string, unknown>;
  return (
    typeof value.id === "string" &&
    typeof value.source === "string" &&
    typeof value.target === "string" &&
    value.sourceHandle === "default"
  );
}

function normalizarGrafo(grafo: unknown): { nodes: WorkflowNodeModel[]; edges: WorkflowEdgeModel[] } {
  if (!grafo || typeof grafo !== "object") {
    return { nodes: [], edges: [] };
  }

  const value = grafo as { nodes?: unknown[]; edges?: unknown[] };
  const nodes = Array.isArray(value.nodes) ? value.nodes.filter(isNodeValido) : [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = Array.isArray(value.edges)
    ? value.edges
        .filter(isEdgeValida)
        .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    : [];

  return { nodes, edges };
}

type DialogMode = "trigger" | "step" | null;

function createNextNodePosition(nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[], sourceNodeId: string | null) {
  const sourceNode = sourceNodeId ? nodes.find((node) => node.id === sourceNodeId) ?? null : null;

  if (!sourceNode) {
    const furthestX = nodes.reduce((max, node) => Math.max(max, node.x), 120);
    const stagger = (nodes.length % 3) * 132;

    return { x: furthestX + 300, y: 180 + stagger };
  }

  const outgoingEdges = edges.filter((edge) => edge.source === sourceNode.id).length;
  const branchOffset = outgoingEdges * 142 - (outgoingEdges > 0 ? 71 : 0);

  return { x: sourceNode.x + 320, y: sourceNode.y + branchOffset };
}

export function ModuloAutomacoes() {
  const { addToast } = useToast();
  const [nodes, setNodes] = useState<WorkflowNodeModel[]>([]);
  const [edges, setEdges] = useState<WorkflowEdgeModel[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [canvasApi, setCanvasApi] = useState<BuilderCanvasApi | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [creationSourceId, setCreationSourceId] = useState<string | null>(null);
  const [creationBranch, setCreationBranch] = useState<WorkflowBranch>("default");
  const [insertionEdgeId, setInsertionEdgeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [ultimoSave, setUltimoSave] = useState<string | null>(null);
  const [whatsappInstancias, setWhatsappInstancias] = useState<WhatsappInstanciaOption[]>([]);
  const [activeView, setActiveView] = useState<"canvas" | "logs">("canvas");
  const [execucoes, setExecucoes] = useState<AutomacaoExecucaoItem[]>([]);
  const [isLoadingExecucoes, setIsLoadingExecucoes] = useState(false);

  const loadExecucoes = useCallback(async () => {
    setIsLoadingExecucoes(true);
    try {
      const data = await listarExecucoesWorkspace(50);
      setExecucoes(data.execucoes);
    } catch {
      addToast({
        type: "error",
        title: "Erro ao carregar execuções",
        description: "Não foi possível carregar os logs da automação.",
      });
    } finally {
      setIsLoadingExecucoes(false);
    }
  }, [addToast]);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await obterWorkspace();
      if (data.workspace.rascunho_grafo_json) {
        const grafo = normalizarGrafo(JSON.parse(data.workspace.rascunho_grafo_json));
        setNodes(grafo.nodes);
        setEdges(grafo.edges);
      }
      setIsPublished(!!data.published);
      setUltimoSave(new Date(data.workspace.atualizado_em).toLocaleString("pt-BR"));
    } catch {
      addToast({ type: "error", title: "Erro ao carregar automações", description: "Não foi possível carregar o workspace." });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const grafoJson = JSON.stringify({ nodes, edges });
      await salvarWorkspace(grafoJson);
      setUltimoSave(new Date().toLocaleString("pt-BR"));
      addToast({ type: "success", title: "Automação salva", description: "Rascunho salvo com sucesso." });
      return true;
    } catch (e) {
      console.error("Erro ao salvar:", e);
      addToast({ type: "error", title: "Erro ao salvar", description: "Não foi possível salvar o rascunho." });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [addToast, edges, nodes]);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      const saveOk = await handleSave();
      if (!saveOk) {
        return;
      }
      const data = await publicarWorkspace();
      setIsPublished(!!data.published);
      addToast({ type: "success", title: "Automação publicada", description: "Nova versão publicada com sucesso." });
    } catch (e) {
      console.error("Erro ao publicar:", e);
      addToast({ type: "error", title: "Erro ao publicar", description: "Revise o fluxo e tente novamente." });
    } finally {
      setIsPublishing(false);
    }
  }, [addToast, handleSave]);

  const handleUnpublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      await despublicarWorkspace();
      setIsPublished(false);
      addToast({ type: "success", title: "Automação despublicada", description: "O fluxo voltou para estado de rascunho." });
    } catch (e) {
      console.error("Erro ao despublicar:", e);
      addToast({ type: "error", title: "Erro ao despublicar", description: "Não foi possível despublicar a automação." });
    } finally {
      setIsPublishing(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    void (async () => {
      const resultado = await listarInstanciasWhatsapp();
      if (!resultado.ok) {
        return;
      }

      const conectadas = resultado.dados.instancias
        .filter(instanciaWhatsappEstaConectada)
        .map((instancia) => ({ id: instancia.id, nome: instancia.nome }));

      setWhatsappInstancias(conectadas);
    })();
  }, []);

  useEffect(() => {
    if (activeView === "logs") {
      void loadExecucoes();
    }
  }, [activeView, loadExecucoes]);

  const hasNodes = nodes.length > 0;
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const selectedEdge = useMemo(() => edges.find((edge) => edge.id === selectedEdgeId) ?? null, [edges, selectedEdgeId]);
  const creationSourceNode = useMemo(
    () => nodes.find((node) => node.id === creationSourceId) ?? null,
    [creationSourceId, nodes],
  );
  const triggerCount = useMemo(() => nodes.filter((node) => node.kind === "gatilho").length, [nodes]);
  const actionCount = useMemo(() => nodes.filter((node) => node.kind === "acao").length, [nodes]);
  const canAddStep = triggerCount > 0 && actionCount === 0;

  const dialogOptions = useMemo(() => {
    if (dialogMode === "trigger") {
      return triggerCount === 0 ? WORKFLOW_TRIGGER_OPTIONS : [];
    }

    if (dialogMode === "step") {
      return canAddStep ? WORKFLOW_STEP_OPTIONS : [];
    }

    return [];
  }, [canAddStep, dialogMode, triggerCount]);

  function openTriggerDialog() {
    if (triggerCount > 0) {
      return;
    }
    setCreationSourceId(null);
    setCreationBranch("default");
    setInsertionEdgeId(null);
    setDialogMode("trigger");
  }

  function openStepDialog() {
    if (!canAddStep) {
      return;
    }
    setCreationSourceId(selectedNodeId);
    setCreationBranch("default");
    setInsertionEdgeId(null);
    setDialogMode("step");
  }

  function openStepDialogFromNode(nodeId: string, branch: WorkflowBranch = "default") {
    if (!canAddStep) {
      return;
    }
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setCreationSourceId(nodeId);
    setCreationBranch(branch);
    setInsertionEdgeId(null);
    setDialogMode("step");
  }

  function openStepDialogFromEdge(edgeId: string) {
    if (!canAddStep) {
      return;
    }
    const edge = edges.find((item) => item.id === edgeId);
    if (!edge) {
      return;
    }

    setSelectedNodeId(null);
    setSelectedEdgeId(edgeId);
    setCreationSourceId(edge.source);
    setCreationBranch(edge.sourceHandle);
    setInsertionEdgeId(edgeId);
    setDialogMode("step");
  }

  function closeDialog() {
    setCreationSourceId(null);
    setCreationBranch("default");
    setInsertionEdgeId(null);
    setDialogMode(null);
  }

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const removeSelection = useCallback(() => {
    if (selectedEdgeId) {
      setEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId));
      setSelectedEdgeId(null);
      return;
    }

    if (!selectedNodeId) {
      return;
    }

    setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
    setEdges((current) => current.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
    setSelectedNodeId(null);
  }, [selectedEdgeId, selectedNodeId]);

  function handleCreateNode(template: WorkflowNodeTemplate) {
    const position = createNextNodePosition(nodes, edges, creationSourceId);
    const nextNode = criarWorkflowNode(template, position.x, position.y);

    setNodes((current) => [...current, nextNode]);
    setSelectedNodeId(nextNode.id);

    if (creationSourceId) {
      setEdges((current) => {
        if (insertionEdgeId) {
          const edgeToSplit = current.find((edge) => edge.id === insertionEdgeId);

          if (edgeToSplit) {
            const withoutOriginal = current.filter((edge) => edge.id !== insertionEdgeId);
            const incomingEdge = criarWorkflowEdge(edgeToSplit.source, nextNode.id, edgeToSplit.sourceHandle);
            const outgoingEdge = criarWorkflowEdge(nextNode.id, edgeToSplit.target, "default");
            const withIncoming = withoutOriginal.some((edge) => edge.id === incomingEdge.id)
              ? withoutOriginal
              : [...withoutOriginal, incomingEdge];

            return withIncoming.some((edge) => edge.id === outgoingEdge.id) ? withIncoming : [...withIncoming, outgoingEdge];
          }
        }

        const nextEdge = criarWorkflowEdge(creationSourceId, nextNode.id, creationBranch);
        const edgeExists = current.some(
          (edge) => edge.source === nextEdge.source && edge.target === nextEdge.target && edge.sourceHandle === nextEdge.sourceHandle,
        );

        return edgeExists ? current : [...current, nextEdge];
      });
    }

    setCreationSourceId(null);
    setCreationBranch("default");
    setInsertionEdgeId(null);
    setDialogMode(null);
  }

  function handleConnect(sourceId: string, targetId: string, sourceHandle: WorkflowBranch) {
    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }

    setEdges((current) => {
      const nextEdge = criarWorkflowEdge(sourceId, targetId, sourceHandle);
      const edgeExists = current.some(
        (edge) => edge.source === nextEdge.source && edge.target === nextEdge.target && edge.sourceHandle === nextEdge.sourceHandle,
      );

      return edgeExists ? current : [...current, nextEdge];
    });

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }

  const validationMessages = useMemo(() => {
    const messages: string[] = [];

    if (triggerCount === 0) {
      messages.push("Adicione o gatilho Lead criado para iniciar o fluxo.");
    }

    if (triggerCount > 1) {
      messages.push("O fluxo permite apenas um gatilho.");
    }

    if (actionCount === 0) {
      messages.push("Adicione a ação Enviar msg WhatsApp.");
    }

    if (actionCount > 1) {
      messages.push("O fluxo permite apenas uma ação.");
    }

    const incomingByTarget = new Map<string, number>();
    edges.forEach((edge) => {
      incomingByTarget.set(edge.target, (incomingByTarget.get(edge.target) ?? 0) + 1);
    });

    const orphanCount = nodes.filter((node) => node.kind !== "gatilho" && (incomingByTarget.get(node.id) ?? 0) === 0).length;
    if (orphanCount > 0) {
      messages.push(`${orphanCount} nó(s) sem conexão de entrada.`);
    }

    const acaoWhatsapp = nodes.find((node) => node.kind === "acao");
    if (acaoWhatsapp) {
      const messageTemplate = String(acaoWhatsapp.config.messageTemplate ?? "").trim();
      const whatsappInstanceId = String(acaoWhatsapp.config.whatsappInstanceId ?? "").trim();
      const sendToLeadPhone = acaoWhatsapp.config.sendToLeadPhone !== false;
      const manualPhones = Array.isArray(acaoWhatsapp.config.manualPhones)
        ? acaoWhatsapp.config.manualPhones.filter((phone) => String(phone).trim().length > 0)
        : [];

      if (!messageTemplate) {
        messages.push("Preencha a mensagem da ação WhatsApp.");
      }

      if (!whatsappInstanceId) {
        messages.push("Selecione a instância conectada para envio.");
      }

      if (!sendToLeadPhone && manualPhones.length === 0) {
        messages.push("Adicione ao menos um número manual ou habilite o telefone do lead.");
      }
    }

    return messages;
  }, [actionCount, edges, nodes, triggerCount]);

  useEffect(() => {
    if (dialogMode !== null) {
      return;
    }

    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearSelection();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        const activeTagName = (event.target as HTMLElement | null)?.tagName;
        if (activeTagName === "INPUT" || activeTagName === "TEXTAREA") {
          return;
        }

        event.preventDefault();
        removeSelection();
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [clearSelection, dialogMode, removeSelection]);

  return (
    <ModulePageShell
      spacing="md"
      className="flex h-[calc(100dvh-6.25rem)] min-h-0 flex-col overflow-hidden lg:h-[calc(100dvh-1.5rem)] xl:h-[calc(100dvh-2rem)]"
    >
      <section className="relative flex min-h-0 flex-1 overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[0_20px_60px_-42px_rgba(0,0,0,0.92)]">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "canvas" | "logs")} className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
          <TabsList className="w-fit">
            <TabsTrigger value="canvas">Canvas</TabsTrigger>
            <TabsTrigger value="logs">Execuções</TabsTrigger>
          </TabsList>

          <TabsContent value="canvas" className="relative mt-3 min-h-0 flex-1 overflow-hidden rounded-[22px] border border-[var(--border-subtle)]">
        <BuilderCanvas
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onNodeMove={(nodeId, x, y) => {
            setNodes((current) => current.map((node) => (node.id === nodeId ? { ...node, x, y } : node)));
          }}
          onNodeSelect={setSelectedNodeId}
          onEdgeSelect={setSelectedEdgeId}
          onConnect={handleConnect}
          onRequestCreateFromNode={openStepDialogFromNode}
          onDeleteNode={(nodeId) => {
            setNodes((current) => current.filter((node) => node.id !== nodeId));
            setEdges((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
            if (selectedNodeId === nodeId) {
              setSelectedNodeId(null);
            }
          }}
          onDeleteEdge={(edgeId) => {
            setEdges((current) => current.filter((edge) => edge.id !== edgeId));
            if (selectedEdgeId === edgeId) {
              setSelectedEdgeId(null);
            }
          }}
          onRequestInsertOnEdge={openStepDialogFromEdge}
          onNodeConfigChange={(nodeId, configPatch) => {
            setNodes((current) =>
              current.map((node) =>
                node.id === nodeId
                  ? {
                      ...node,
                      config: {
                        ...node.config,
                        ...configPatch,
                      } as WorkflowNodeConfig,
                    }
                  : node,
              ),
            );
          }}
          onCanvasReady={setCanvasApi}
          whatsappInstancias={whatsappInstancias}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-5">
          <div className="pointer-events-auto rounded-[18px] border border-[var(--border-subtle)] bg-[color:rgba(12,12,14,0.86)] px-3.5 py-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm" dot>
                Fluxo
              </Badge>
              {isLoading ? (
                <Badge variant="secondary" size="sm">
                  Carregando...
                </Badge>
              ) : isPublished ? (
                <Badge variant="success" size="sm" dot>
                  Publicada
                </Badge>
              ) : (
                <Badge variant="warning" size="sm" dot>
                  Rascunho
                </Badge>
              )}
              {ultimoSave && (
                <span className="text-xs text-[var(--text-secondary)]">Salvo: {ultimoSave}</span>
              )}
              {selectedNode ? (
                <span className="text-xs text-[var(--text-secondary)]">{WORKFLOW_KIND_META[selectedNode.kind].label}</span>
              ) : null}
            </div>
            {selectedNode ? <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{selectedNode.label}</p> : null}
            {selectedEdge ? (
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Conexao selecionada: {selectedEdge.source} para {selectedEdge.target}
              </p>
            ) : null}
            {validationMessages.length > 0 ? (
              <p className="mt-1 text-xs text-[color:rgba(248,113,113,0.92)]">{validationMessages[0]}</p>
            ) : (
              <p className="mt-1 text-xs text-[color:rgba(74,222,128,0.9)]">Fluxo visual consistente.</p>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-2 rounded-[18px] border border-[var(--border-subtle)] bg-[color:rgba(12,12,14,0.86)] p-2 backdrop-blur-md">
            {hasNodes && canAddStep ? (
              <Button type="button" size="sm" variant="outline" onClick={openStepDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo nó
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" onClick={handleSave} disabled={isSaving || isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={isPublished ? handleUnpublish : handlePublish}
              disabled={isPublishing || isLoading || (!isPublished && (!hasNodes || validationMessages.length > 0))}
            >
              {isPublished ? <Slash className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
              {isPublishing ? (isPublished ? "Despublicando..." : "Publicando...") : isPublished ? "Despublicar" : "Publicar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={removeSelection}
              aria-label="Excluir selecao"
              disabled={!selectedNodeId && !selectedEdgeId}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => canvasApi?.zoomOut()} aria-label="Afastar canvas">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => canvasApi?.zoomIn()} aria-label="Aproximar canvas">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => canvasApi?.fit()} aria-label="Ajustar fluxo ao canvas">
              <Crosshair className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!hasNodes ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-4">
            <div className="pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-[color:rgba(12,12,14,0.9)] px-4 py-3 backdrop-blur-md">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Comece pelo gatilho</p>
                <p className="text-xs text-[var(--text-secondary)]">Crie o nó Lead criado para iniciar o fluxo.</p>
              </div>
              <Button type="button" size="sm" onClick={openTriggerDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Criar nó
              </Button>
            </div>
          </div>
        ) : null}
          </TabsContent>

          <TabsContent value="logs" className="mt-3 min-h-0 flex-1 overflow-auto">
            <div className="mb-3 flex items-center justify-between">
              <Badge variant="info" size="sm" dot>
                Últimas execuções
              </Badge>
              <Button type="button" size="sm" variant="outline" onClick={() => void loadExecucoes()} disabled={isLoadingExecucoes}>
                {isLoadingExecucoes ? "Atualizando..." : "Atualizar logs"}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Contexto</TableHead>
                  <TableHead>Resumo</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {execucoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-[var(--text-tertiary)]">
                      {isLoadingExecucoes ? "Carregando execuções..." : "Sem execuções registradas até o momento."}
                    </TableCell>
                  </TableRow>
                ) : (
                  execucoes.map((execucao) => {
                    let resumo = "Sem detalhes";
                    if (execucao.log_resumido_json) {
                      try {
                        const parsed = JSON.parse(execucao.log_resumido_json) as {
                          erro?: string;
                          enviados?: number;
                          totalDestinatarios?: number;
                          instancia?: string;
                        };
                        if (parsed.erro) {
                          resumo = parsed.erro;
                        } else if (typeof parsed.enviados === "number") {
                          resumo = `${parsed.enviados}/${parsed.totalDestinatarios ?? parsed.enviados} envios (${parsed.instancia ?? "instância"})`;
                        }
                      } catch {
                        resumo = "Resumo indisponível";
                      }
                    }

                    const badgeVariant =
                      execucao.status === "CONCLUIDA" ? "success" : execucao.status === "FALHA" ? "error" : "info";

                    return (
                      <TableRow key={execucao.id}>
                        <TableCell>
                          <Badge variant={badgeVariant} size="sm" dot>
                            {execucao.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{execucao.trigger_tipo}</TableCell>
                        <TableCell>{execucao.contexto_ref_tipo ? `${execucao.contexto_ref_tipo}:${execucao.contexto_ref_id}` : "-"}</TableCell>
                        <TableCell>{resumo}</TableCell>
                        <TableCell>{new Date(execucao.criado_em).toLocaleString("pt-BR")}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </section>

      <NodeCreationDialog
        open={dialogMode !== null}
        title={dialogMode === "trigger" ? "Escolha o gatilho inicial" : "Adicione o próximo passo"}
        description={
          dialogMode === "trigger"
            ? "Crie a entrada visual que inicia o fluxo no canvas."
            : "Selecione um novo nó mockado para expandir a jornada visual."
        }
        confirmLabel={dialogMode === "trigger" ? "Criar primeiro nó" : "Adicionar nó"}
        contextLabel={
          creationSourceNode && dialogMode === "step"
            ? `${insertionEdgeId ? "Será inserido após" : "Será conectado a"} ${creationSourceNode.label}`
            : undefined
        }
        options={dialogOptions}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
        onConfirm={handleCreateNode}
      />
    </ModulePageShell>
  );
}
