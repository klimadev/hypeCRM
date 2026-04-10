"use client";

import {
  applyNodeChanges,
  BaseEdge,
  type Connection,
  Controls,
  Background,
  EdgeLabelRenderer,
  Handle,
  getSmoothStepPath,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type EdgeMouseHandler,
  type Node,
  type NodeMouseHandler,
  type OnNodesChange,
  type NodeProps,
} from "@xyflow/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { WORKFLOW_KIND_META } from "../lib/workflow-builder-seeds";
import type { WorkflowBranch, WorkflowEdgeModel, WorkflowNodeConfig, WorkflowNodeModel } from "../types";
import "@xyflow/react/dist/style.css";

export type BuilderCanvasApi = {
  fit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  center: () => void;
};

type BuilderCanvasProps = {
  nodes: WorkflowNodeModel[];
  edges: WorkflowEdgeModel[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onNodeMove: (nodeId: string, x: number, y: number) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onEdgeSelect: (edgeId: string | null) => void;
  onConnect: (sourceId: string, targetId: string, sourceHandle: WorkflowBranch) => void;
  onRequestCreateFromNode: (nodeId: string, branch?: WorkflowBranch) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onRequestInsertOnEdge: (edgeId: string) => void;
  onNodeConfigChange: (nodeId: string, configPatch: WorkflowNodeConfig) => void;
  onCanvasReady: (api: BuilderCanvasApi) => void;
};

type FlowNodeData = {
  model: WorkflowNodeModel;
  onAddNext: (nodeId: string, branch?: WorkflowBranch) => void;
  hasOutgoing: boolean;
  hasOutgoingSim: boolean;
  hasOutgoingNao: boolean;
  isFocused: boolean;
  entering: boolean;
  onDeleteNode: (nodeId: string) => void;
  onConfigChange: (nodeId: string, configPatch: WorkflowNodeConfig) => void;
};

type FlowEdgeData = {
  selected: boolean;
  fromSelectedNode: boolean;
  onDeleteEdge: (edgeId: string) => void;
  onInsertEdge: (edgeId: string) => void;
};

const NODE_SIZE = { width: 248, height: 124 };

const nodeTypes = {
  workflow: memo(function WorkflowNodeCard({ data, dragging }: NodeProps<Node<FlowNodeData, "workflow">>) {
    const meta = WORKFLOW_KIND_META[data.model.kind];
    const continuationBorder = data.hasOutgoing ? "rgba(56,189,248,0.28)" : "rgba(56,189,248,0.45)";
    const isCondition = data.model.kind === "condicao";

    return (
      <div
        className="relative rounded-[22px] border bg-[rgba(16,16,19,0.98)] p-4 transition-[border-color,box-shadow,opacity] duration-150 ease-[var(--ease-productive)]"
        data-interactive
        style={{
          width: NODE_SIZE.width,
          minHeight: NODE_SIZE.height,
          borderColor: data.isFocused ? meta.color : "rgba(255,255,255,0.08)",
          boxShadow: dragging
            ? `0 24px 54px -30px ${meta.soft}, 0 14px 34px rgba(0,0,0,0.42)`
            : data.isFocused
              ? `0 0 0 1px ${meta.soft}`
              : "0 10px 24px rgba(0,0,0,0.22)",
          opacity: dragging ? 0.96 : 1,
          transform: dragging ? "scale(1.02)" : "scale(1)",
          animation: data.entering ? "fadeIn 180ms var(--ease-productive), scaleIn 220ms var(--ease-snappy)" : undefined,
        }}
      >
        <div
          className="absolute left-0 top-0 h-[7px] w-full rounded-t-[22px]"
          style={{ backgroundColor: meta.color, opacity: data.isFocused ? 1 : 0.84 }}
        />

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: meta.color }}>
          {meta.label}
        </p>
        <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{data.model.label}</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{data.model.description}</p>

        <button
          type="button"
          aria-label="Excluir nó"
          className="nodrag nopan absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[color:rgba(255,255,255,0.14)] bg-[color:rgba(12,12,14,0.9)] text-xs text-[var(--text-secondary)] opacity-0 transition-all duration-150 hover:border-[color:rgba(248,113,113,0.8)] hover:text-[color:rgba(248,113,113,0.95)] group-hover:opacity-100"
          style={{ opacity: data.isFocused ? 1 : undefined }}
          onClick={(event) => {
            event.stopPropagation();
            data.onDeleteNode(data.model.id);
          }}
        >
          x
        </button>

        {data.isFocused ? (
          <div className="nodrag nopan mt-3 grid gap-2 rounded-[12px] border border-[var(--border-subtle)] bg-[color:rgba(9,9,11,0.82)] p-2.5">
            {data.model.kind === "gatilho" ? (
              <>
                <input
                  className="h-8 rounded-[8px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-2 text-xs text-[var(--text-primary)]"
                  value={data.model.config.canal ?? ""}
                  onChange={(event) => data.onConfigChange(data.model.id, { canal: event.target.value })}
                  placeholder="Canal"
                />
                <input
                  className="h-8 rounded-[8px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-2 text-xs text-[var(--text-primary)]"
                  value={String(data.model.config.janelaMinutos ?? "")}
                  onChange={(event) => data.onConfigChange(data.model.id, { janelaMinutos: Number(event.target.value || 0) })}
                  placeholder="Janela (min)"
                />
              </>
            ) : null}

            {data.model.kind === "acao" ? (
              <>
                <input
                  className="h-8 rounded-[8px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-2 text-xs text-[var(--text-primary)]"
                  value={data.model.config.modeloMensagem ?? ""}
                  onChange={(event) => data.onConfigChange(data.model.id, { modeloMensagem: event.target.value })}
                  placeholder="Template"
                />
                <input
                  className="h-8 rounded-[8px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-2 text-xs text-[var(--text-primary)]"
                  value={String(data.model.config.delayMinutos ?? "")}
                  onChange={(event) => data.onConfigChange(data.model.id, { delayMinutos: Number(event.target.value || 0) })}
                  placeholder="Delay (min)"
                />
              </>
            ) : null}

            {data.model.kind === "condicao" ? (
              <>
                <input
                  className="h-8 rounded-[8px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-2 text-xs text-[var(--text-primary)]"
                  value={data.model.config.campo ?? ""}
                  onChange={(event) => data.onConfigChange(data.model.id, { campo: event.target.value })}
                  placeholder="Campo"
                />
                <input
                  className="h-8 rounded-[8px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-2 text-xs text-[var(--text-primary)]"
                  value={data.model.config.valor ?? ""}
                  onChange={(event) => data.onConfigChange(data.model.id, { valor: event.target.value })}
                  placeholder="Valor"
                />
              </>
            ) : null}
          </div>
        ) : null}

        {data.isFocused && !isCondition ? (
          <div className="pointer-events-none absolute -right-[92px] top-1/2 flex -translate-y-1/2 items-center">
            <div className="h-px w-11 bg-[linear-gradient(90deg,rgba(56,189,248,0.52),rgba(56,189,248,0.08))]" />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                  data.onAddNext(data.model.id, "default");
                }}
              className="animate-scale-in pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border bg-[color:rgba(12,12,14,0.96)] text-[18px] font-semibold leading-none text-[#67e8f9] shadow-[0_10px_28px_-14px_rgba(6,182,212,0.9)] transition-all duration-150 hover:scale-[1.04] hover:border-[color:rgba(56,189,248,0.75)] hover:text-[#a5f3fc]"
              style={{ borderColor: continuationBorder }}
              aria-label="Adicionar proximo nó"
            >
              +
            </button>
          </div>
        ) : null}

        {data.isFocused && isCondition ? (
          <div className="pointer-events-none absolute -right-[108px] top-1/2 grid -translate-y-1/2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Sim</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  data.onAddNext(data.model.id, "sim");
                }}
                className="animate-scale-in pointer-events-auto nodrag nopan inline-flex h-8 w-8 items-center justify-center rounded-full border bg-[color:rgba(12,12,14,0.96)] text-[18px] font-semibold leading-none text-[#67e8f9]"
                style={{ borderColor: data.hasOutgoingSim ? continuationBorder : "rgba(56,189,248,0.65)" }}
                aria-label="Adicionar ramo sim"
              >
                +
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Nao</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  data.onAddNext(data.model.id, "nao");
                }}
                className="animate-scale-in pointer-events-auto nodrag nopan inline-flex h-8 w-8 items-center justify-center rounded-full border bg-[color:rgba(12,12,14,0.96)] text-[18px] font-semibold leading-none text-[#67e8f9]"
                style={{ borderColor: data.hasOutgoingNao ? continuationBorder : "rgba(56,189,248,0.65)" }}
                aria-label="Adicionar ramo nao"
              >
                +
              </button>
            </div>
          </div>
        ) : null}

        <Handle
          type="target"
          id="input"
          position={Position.Left}
          className="!h-3.5 !w-3.5 !border-2 !bg-[#09090b]"
          style={{ borderColor: meta.color }}
        />
        <Handle
          type="source"
          id={isCondition ? "sim" : "default"}
          position={Position.Right}
          className="!h-3.5 !w-3.5 !border-2 !bg-[var(--text-primary)]"
          style={{ borderColor: meta.color, top: isCondition ? "35%" : undefined }}
        />
        {isCondition ? (
          <Handle
            type="source"
            id="nao"
            position={Position.Right}
            className="!h-3.5 !w-3.5 !border-2 !bg-[var(--text-primary)]"
            style={{ borderColor: meta.color, top: "68%" }}
          />
        ) : null}
      </div>
    );
  }),
};

const edgeTypes = {
  workflow: memo(function WorkflowEdgeComponent(props: EdgeProps<Edge<FlowEdgeData>>) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      targetX: props.targetX,
      targetY: props.targetY,
      sourcePosition: props.sourcePosition,
      targetPosition: props.targetPosition,
    });
    const stroke = props.data?.selected
      ? "rgba(56,189,248,0.95)"
      : props.data?.fromSelectedNode
        ? "rgba(56,189,248,0.82)"
        : "rgba(161,161,170,0.88)";

    return (
      <>
        <BaseEdge path={edgePath} style={{ stroke, strokeWidth: props.data?.selected ? 2.4 : 1.6 }} />
        {props.data?.selected ? (
          <EdgeLabelRenderer>
            <div
              className="nodrag nopan absolute z-20 flex items-center gap-1"
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                pointerEvents: "all",
              }}
            >
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:rgba(255,255,255,0.16)] bg-[color:rgba(12,12,14,0.96)] text-xs text-[var(--text-secondary)] transition hover:border-[color:rgba(56,189,248,0.8)] hover:text-[color:rgba(103,232,249,0.95)]"
                aria-label="Inserir nó na conexão"
                onMouseDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  props.data?.onInsertEdge(props.id);
                }}
              >
                +
              </button>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:rgba(255,255,255,0.16)] bg-[color:rgba(12,12,14,0.96)] text-xs text-[var(--text-secondary)] transition hover:border-[color:rgba(248,113,113,0.8)] hover:text-[color:rgba(248,113,113,0.95)]"
                aria-label="Excluir conexão"
                onMouseDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  props.data?.onDeleteEdge(props.id);
                }}
              >
                x
              </button>
            </div>
          </EdgeLabelRenderer>
        ) : null}
      </>
    );
  }),
};

function BuilderCanvasInner(props: BuilderCanvasProps) {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    onNodeMove,
    onNodeSelect,
    onEdgeSelect,
    onConnect,
    onRequestCreateFromNode,
    onDeleteNode,
    onDeleteEdge,
    onRequestInsertOnEdge,
    onNodeConfigChange,
    onCanvasReady,
  } = props;
  const reactFlow = useReactFlow<Node<FlowNodeData, "workflow">, Edge>();
  const didAutoCenterRef = useRef(false);
  const prevNodeIdsRef = useRef<Set<string>>(new Set());
  const [enteringNodeIds, setEnteringNodeIds] = useState<Set<string>>(new Set());

  const outgoingCountByNode = useMemo(() => {
    const map = new Map<string, { total: number; sim: number; nao: number }>();
    edges.forEach((edge) => {
      const current = map.get(edge.source) ?? { total: 0, sim: 0, nao: 0 };
      current.total += 1;
      if (edge.sourceHandle === "sim") {
        current.sim += 1;
      }
      if (edge.sourceHandle === "nao") {
        current.nao += 1;
      }
      map.set(edge.source, current);
    });
    return map;
  }, [edges]);

  const externalFlowNodes = useMemo<Node<FlowNodeData, "workflow">[]>(
    () =>
      nodes.map((node) => ({
        id: node.id,
        type: "workflow",
        position: { x: node.x, y: node.y },
        data: {
          model: node,
          onAddNext: onRequestCreateFromNode,
          hasOutgoing: (outgoingCountByNode.get(node.id)?.total ?? 0) > 0,
          hasOutgoingSim: (outgoingCountByNode.get(node.id)?.sim ?? 0) > 0,
          hasOutgoingNao: (outgoingCountByNode.get(node.id)?.nao ?? 0) > 0,
          isFocused: node.id === selectedNodeId,
          entering: enteringNodeIds.has(node.id),
          onDeleteNode,
          onConfigChange: onNodeConfigChange,
        },
        draggable: true,
      })),
    [enteringNodeIds, nodes, onDeleteNode, onNodeConfigChange, onRequestCreateFromNode, outgoingCountByNode, selectedNodeId],
  );

  const [flowNodes, setFlowNodes] = useState<Node<FlowNodeData, "workflow">[]>(externalFlowNodes);

  useEffect(() => {
    const nextIds = new Set(nodes.map((node) => node.id));
    const entering = nodes.filter((node) => !prevNodeIdsRef.current.has(node.id)).map((node) => node.id);

    setEnteringNodeIds(new Set(entering));
    prevNodeIdsRef.current = nextIds;

    if (entering.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setEnteringNodeIds(new Set());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [nodes]);

  useEffect(() => {
    setFlowNodes(externalFlowNodes);
  }, [externalFlowNodes]);

  const handleNodesChange = useMemo<OnNodesChange<Node<FlowNodeData, "workflow">>>(
    () => (changes) => {
      setFlowNodes((current) => applyNodeChanges(changes, current));
    },
    [],
  );

  const flowEdges = useMemo<Edge<FlowEdgeData>[]>(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: "input",
        type: "workflow",
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "rgba(161,161,170,0.92)" },
        data: {
          selected: edge.id === selectedEdgeId,
          fromSelectedNode: edge.source === selectedNodeId,
          onDeleteEdge,
          onInsertEdge: onRequestInsertOnEdge,
        },
      })),
    [edges, onDeleteEdge, onRequestInsertOnEdge, selectedEdgeId, selectedNodeId],
  );

  const handleNodeClick: NodeMouseHandler<Node<FlowNodeData, "workflow">> = (_event, node) => {
    onNodeSelect(node.id);
    onEdgeSelect(null);
  };

  const handleNodeDragStop: NodeMouseHandler<Node<FlowNodeData, "workflow">> = (_event, node) => {
    onNodeMove(node.id, node.position.x, node.position.y);
  };

  const handleEdgeClick: EdgeMouseHandler<Edge> = (_event, edge) => {
    onNodeSelect(null);
    onEdgeSelect(edge.id);
  };

  useEffect(() => {
    onCanvasReady({
      fit: () => reactFlow.fitView({ padding: 0.22, duration: 300 }),
      zoomIn: () => reactFlow.zoomIn({ duration: 180 }),
      zoomOut: () => reactFlow.zoomOut({ duration: 180 }),
      center: () => reactFlow.fitView({ padding: 0.3, duration: 260 }),
    });
  }, [onCanvasReady, reactFlow]);

  useEffect(() => {
    if (nodes.length === 0) {
      didAutoCenterRef.current = false;
      return;
    }

    if (didAutoCenterRef.current) {
      return;
    }

    didAutoCenterRef.current = true;
    const frame = requestAnimationFrame(() => {
      reactFlow.fitView({ padding: 0.28, duration: 320, maxZoom: 1.05 });
    });

    return () => cancelAnimationFrame(frame);
  }, [nodes.length, reactFlow]);

  return (
    <div className="automation-flow-shell relative flex min-h-0 flex-1 overflow-hidden rounded-[24px] bg-[#0a0a0c]">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_35%)]" />
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.45}
        maxZoom={1.65}
        fitView
        fitViewOptions={{ padding: 0.28 }}
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "rgba(161,161,170,0.92)" },
        }}
        onNodeClick={handleNodeClick}
        onNodesChange={handleNodesChange}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={handleEdgeClick}
        onPaneClick={() => {
          onNodeSelect(null);
          onEdgeSelect(null);
        }}
        onConnect={(params: Connection) => {
          if (!params.source || !params.target || params.source === params.target) {
            return;
          }

          const sourceHandle = (params.sourceHandle as WorkflowBranch | null) ?? "default";
          onConnect(params.source, params.target, sourceHandle);
        }}
        className="h-full min-h-[44rem] w-full"
      >
        <Background color="rgba(255,255,255,0.05)" gap={22} />
        <Controls showInteractive={false} position="bottom-right" className="opacity-80" />
      </ReactFlow>
    </div>
  );
}

export function BuilderCanvas(props: BuilderCanvasProps) {
  return (
    <ReactFlowProvider>
      <BuilderCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
