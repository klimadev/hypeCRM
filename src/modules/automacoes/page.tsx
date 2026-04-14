"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { AutomacoesCanvasStatus } from "./components/automacoes-canvas-status";
import { AutomacoesCanvasToolbar } from "./components/automacoes-canvas-toolbar";
import { AutomacoesLogsSection } from "./components/automacoes-logs-section";
import { BuilderCanvas, type BuilderCanvasApi } from "./components/builder-canvas";
import { NodeCreationDialog } from "./components/node-creation-dialog";
import { criarWorkflowEdge, criarWorkflowNode, WORKFLOW_KIND_META, WORKFLOW_STEP_OPTIONS, WORKFLOW_TRIGGER_OPTIONS } from "./lib/workflow-builder-seeds";
import { createNextNodePosition } from "./lib/workflow-graph-utils";
import { useAutomacoesWorkspaceIO } from "./hooks/use-automacoes-workspace-io";
import { useWhatsappInstanciasConectadas } from "./hooks/use-whatsapp-instancias-conectadas";
import { useWorkflowValidation } from "./hooks/use-workflow-validation";
import type { WorkflowBranch, WorkflowEdgeModel, WorkflowNodeConfig, WorkflowNodeModel, WorkflowNodeTemplate } from "./types";

type DialogMode = "trigger" | "step" | null;

export function ModuloAutomacoes() {
  const { addToast } = useToast();
  const router = useRouter();
  const [nodes, setNodes] = useState<WorkflowNodeModel[]>([]);
  const [edges, setEdges] = useState<WorkflowEdgeModel[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [canvasApi, setCanvasApi] = useState<BuilderCanvasApi | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [creationSourceId, setCreationSourceId] = useState<string | null>(null);
  const [creationBranch, setCreationBranch] = useState<WorkflowBranch>("default");
  const [insertionEdgeId, setInsertionEdgeId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"canvas" | "logs">("canvas");
  const whatsappInstancias = useWhatsappInstanciasConectadas();

  const {
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
  } = useAutomacoesWorkspaceIO({
    nodes,
    edges,
    activeView,
    onWorkspaceLoaded: ({ nodes: loadedNodes, edges: loadedEdges }) => {
      setNodes(loadedNodes);
      setEdges(loadedEdges);
    },
    onToast: addToast,
  });

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

  const validationMessages = useWorkflowValidation({ nodes, edges });

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
              <AutomacoesCanvasStatus
                isLoading={isLoading}
                isPublished={isPublished}
                ultimoSave={ultimoSave}
                selectedNodeLabel={selectedNode?.label ?? null}
                selectedNodeKindLabel={selectedNode ? WORKFLOW_KIND_META[selectedNode.kind].label : null}
                selectedEdgeText={selectedEdge ? `Conexao selecionada: ${selectedEdge.source} para ${selectedEdge.target}` : null}
                validationMessage={validationMessages[0] ?? null}
              />

              <AutomacoesCanvasToolbar
                hasNodes={hasNodes}
                canAddStep={canAddStep}
                isSaving={isSaving}
                isLoading={isLoading}
                isPublishing={isPublishing}
                isPublished={isPublished}
                canPublishDraft={hasNodes && validationMessages.length === 0}
                hasSelection={Boolean(selectedNodeId || selectedEdgeId)}
                onOpenStepDialog={openStepDialog}
                onSave={() => {
                  void handleSave();
                }}
                onTogglePublish={() => {
                  if (isPublished) {
                    void handleUnpublish();
                    return;
                  }
                  void handlePublish();
                }}
                onRemoveSelection={removeSelection}
                onDelete={async () => {
                  const success = await handleDelete();
                  if (success) {
                    router.refresh();
                  }
                }}
                onZoomOut={() => canvasApi?.zoomOut()}
                onZoomIn={() => canvasApi?.zoomIn()}
                onFit={() => canvasApi?.fit()}
              />
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
            <AutomacoesLogsSection
              execucoes={execucoes}
              isLoadingExecucoes={isLoadingExecucoes}
              onReload={() => {
                void loadExecucoes();
              }}
            />
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
