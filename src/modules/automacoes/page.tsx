"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crosshair, Plus, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuilderCanvas, type BuilderCanvasApi } from "./components/builder-canvas";
import { NodeCreationDialog } from "./components/node-creation-dialog";
import { criarWorkflowEdge, criarWorkflowNode, WORKFLOW_KIND_META, WORKFLOW_STEP_OPTIONS, WORKFLOW_TRIGGER_OPTIONS } from "./lib/workflow-builder-seeds";
import type { WorkflowBranch, WorkflowEdgeModel, WorkflowNodeConfig, WorkflowNodeModel, WorkflowNodeTemplate } from "./types";

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
  const [nodes, setNodes] = useState<WorkflowNodeModel[]>([]);
  const [edges, setEdges] = useState<WorkflowEdgeModel[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [canvasApi, setCanvasApi] = useState<BuilderCanvasApi | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [creationSourceId, setCreationSourceId] = useState<string | null>(null);
  const [creationBranch, setCreationBranch] = useState<WorkflowBranch>("default");
  const [insertionEdgeId, setInsertionEdgeId] = useState<string | null>(null);

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

  const dialogOptions = dialogMode === "trigger" ? WORKFLOW_TRIGGER_OPTIONS : WORKFLOW_STEP_OPTIONS;

  function openTriggerDialog() {
    setCreationSourceId(null);
    setCreationBranch("default");
    setInsertionEdgeId(null);
    setDialogMode("trigger");
  }

  function openStepDialog() {
    setCreationSourceId(selectedNodeId);
    setCreationBranch("default");
    setInsertionEdgeId(null);
    setDialogMode("step");
  }

  function openStepDialogFromNode(nodeId: string, branch: WorkflowBranch = "default") {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setCreationSourceId(nodeId);
    setCreationBranch(branch);
    setInsertionEdgeId(null);
    setDialogMode("step");
  }

  function openStepDialogFromEdge(edgeId: string) {
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
    const triggerCount = nodes.filter((node) => node.kind === "gatilho").length;

    if (triggerCount === 0) {
      messages.push("Adicione pelo menos um gatilho para iniciar o fluxo.");
    }

    const incomingByTarget = new Map<string, number>();
    edges.forEach((edge) => {
      incomingByTarget.set(edge.target, (incomingByTarget.get(edge.target) ?? 0) + 1);
    });

    const orphanCount = nodes.filter((node) => node.kind !== "gatilho" && (incomingByTarget.get(node.id) ?? 0) === 0).length;
    if (orphanCount > 0) {
      messages.push(`${orphanCount} nó(s) sem conexão de entrada.`);
    }

    const conditionIssues = nodes
      .filter((node) => node.kind === "condicao")
      .map((node) => {
        const hasSim = edges.some((edge) => edge.source === node.id && edge.sourceHandle === "sim");
        const hasNao = edges.some((edge) => edge.source === node.id && edge.sourceHandle === "nao");
        return hasSim && hasNao ? null : `Condição "${node.label}" sem saída ${!hasSim ? "Sim" : "Não"}.`;
      })
      .filter((message): message is string => message !== null);

    messages.push(...conditionIssues);
    return messages;
  }, [edges, nodes]);

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
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-5">
          <div className="pointer-events-auto rounded-[18px] border border-[var(--border-subtle)] bg-[color:rgba(12,12,14,0.86)] px-3.5 py-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm" dot>
                Fluxo
              </Badge>
              <Badge variant="warning" size="sm" dot>
                MVP local (nao salva)
              </Badge>
              {selectedNode ? (
                <span className="text-xs text-[var(--text-secondary)]">{WORKFLOW_KIND_META[selectedNode.kind].label}</span>
              ) : null}
            </div>
            {selectedNode ? <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{selectedNode.label}</p> : null}
            {selectedEdge ? (
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Conexao selecionada: {selectedEdge.source} para {selectedEdge.target}
                {selectedEdge.sourceHandle !== "default" ? ` (${selectedEdge.sourceHandle.toUpperCase()})` : ""}
              </p>
            ) : null}
            {validationMessages.length > 0 ? (
              <p className="mt-1 text-xs text-[color:rgba(248,113,113,0.92)]">{validationMessages[0]}</p>
            ) : (
              <p className="mt-1 text-xs text-[color:rgba(74,222,128,0.9)]">Fluxo visual consistente.</p>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-2 rounded-[18px] border border-[var(--border-subtle)] bg-[color:rgba(12,12,14,0.86)] p-2 backdrop-blur-md">
            {hasNodes ? (
              <Button type="button" size="sm" variant="outline" onClick={openStepDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo nó
              </Button>
            ) : null}
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
                <p className="text-xs text-[var(--text-secondary)]">Crie o primeiro nó para iniciar o fluxo.</p>
              </div>
              <Button type="button" size="sm" onClick={openTriggerDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Criar nó
              </Button>
            </div>
          </div>
        ) : null}
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
            ? `${insertionEdgeId ? "Será inserido após" : "Será conectado a"} ${creationSourceNode.label}${creationBranch !== "default" ? ` (${creationBranch.toUpperCase()})` : ""}`
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
