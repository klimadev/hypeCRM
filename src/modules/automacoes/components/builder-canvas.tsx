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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { WORKFLOW_KIND_META } from "../lib/workflow-builder-seeds";
import type { WorkflowBranch, WorkflowEdgeModel, WorkflowNodeConfig, WorkflowNodeModel } from "../types";
import "@xyflow/react/dist/style.css";

type WhatsappInstanciaOption = {
  id: string;
  nome: string;
};

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
  whatsappInstancias: WhatsappInstanciaOption[];
};

type FlowNodeData = {
  model: WorkflowNodeModel;
  onAddNext: (nodeId: string, branch?: WorkflowBranch) => void;
  hasOutgoing: boolean;
  isFocused: boolean;
  entering: boolean;
  onDeleteNode: (nodeId: string) => void;
  onConfigChange: (nodeId: string, configPatch: WorkflowNodeConfig) => void;
  whatsappInstancias: WhatsappInstanciaOption[];
};

type FlowEdgeData = {
  selected: boolean;
  fromSelectedNode: boolean;
  onDeleteEdge: (edgeId: string) => void;
  onInsertEdge: (edgeId: string) => void;
};

const NODE_SIZE = { width: 248, height: 124 };

function parseManualPhones(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter((item, idx, arr) => item.length > 0 && arr.indexOf(item) === idx);
}

const nodeTypes = {
  workflow: memo(function WorkflowNodeCard({ data, dragging }: NodeProps<Node<FlowNodeData, "workflow">>) {
    const [manualPhoneDraft, setManualPhoneDraft] = useState("");
    const meta = WORKFLOW_KIND_META[data.model.kind];
    const continuationBorder = data.hasOutgoing
      ? "color-mix(in_srgb,var(--info)_28%,transparent)"
      : "color-mix(in_srgb,var(--info)_45%,transparent)";
    const manualPhones = data.model.config.manualPhones ?? [];
    return (
      <div
        className="relative rounded-[22px] border bg-[var(--surface)] p-4 transition-[border-color,box-shadow,opacity] duration-150 ease-[var(--ease-productive)]"
        data-interactive
        style={{
          width: NODE_SIZE.width,
          minHeight: NODE_SIZE.height,
          borderColor: data.isFocused ? meta.color : "var(--border-subtle)",
          boxShadow: dragging
            ? `0 24px 54px -30px ${meta.soft}, var(--shadow-md)`
            : data.isFocused
              ? `0 0 0 1px ${meta.soft}`
              : "var(--shadow-sm)",
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
          className="nodrag nopan absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-xs text-[var(--text-secondary)] opacity-0 transition-all duration-150 hover:border-[color-mix(in_srgb,var(--danger)_56%,transparent)] hover:text-[var(--danger)] group-hover:opacity-100"
          style={{ opacity: data.isFocused ? 1 : undefined }}
          onClick={(event) => {
            event.stopPropagation();
            data.onDeleteNode(data.model.id);
          }}
        >
          x
        </button>

        {data.isFocused ? (
          <div className="nodrag nopan mt-3 grid gap-2 rounded-[12px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-2.5">
            {data.model.kind === "gatilho" ? <p className="text-xs text-[var(--text-secondary)]">Sem configurações para este gatilho.</p> : null}

            {data.model.kind === "acao" ? (
              <>
                <Textarea
                  className="min-h-20 text-xs"
                  value={data.model.config.messageTemplate ?? ""}
                  onChange={(event) => data.onConfigChange(data.model.id, { messageTemplate: event.target.value })}
                  placeholder="Digite a mensagem"
                />
                <Select
                  value={data.model.config.whatsappInstanceId ?? ""}
                  onValueChange={(value) => data.onConfigChange(data.model.id, { whatsappInstanceId: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione a instância" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.whatsappInstancias.map((instancia) => (
                      <SelectItem key={instancia.id} value={instancia.id}>
                        {instancia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-between gap-2 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-2.5 py-2">
                  <span className="text-[11px] text-[var(--text-secondary)]">Usar telefone do lead criado</span>
                  <Switch
                    checked={data.model.config.sendToLeadPhone !== false}
                    onCheckedChange={(checked) => data.onConfigChange(data.model.id, { sendToLeadPhone: checked })}
                  />
                </div>

                <div className="grid gap-1.5">
                  <p className="text-[11px] text-[var(--text-secondary)]">Números manuais (tags)</p>
                  <Input
                    value={manualPhoneDraft}
                    onChange={(event) => setManualPhoneDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== ",") {
                        return;
                      }
                      event.preventDefault();
                      const phones = parseManualPhones(manualPhoneDraft);
                      if (phones.length === 0) {
                        return;
                      }
                      const merged = [...manualPhones, ...phones].filter((item, idx, arr) => arr.indexOf(item) === idx);
                      data.onConfigChange(data.model.id, { manualPhones: merged });
                      setManualPhoneDraft("");
                    }}
                    placeholder="Digite e pressione Enter"
                    className="h-8 text-xs"
                  />
                  {manualPhones.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {manualPhones.map((phone) => (
                        <button
                          key={phone}
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--info)_36%,transparent)] bg-[color-mix(in_srgb,var(--info)_14%,transparent)] px-2 py-0.5 text-[10px] text-[var(--info)]"
                          onClick={() => data.onConfigChange(data.model.id, { manualPhones: manualPhones.filter((item) => item !== phone) })}
                          title="Remover número"
                        >
                          {phone}
                          <span className="text-[11px] leading-none">x</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[var(--text-tertiary)]">Sem números manuais adicionados.</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {data.isFocused ? (
          <div className="pointer-events-none absolute -right-[92px] top-1/2 flex -translate-y-1/2 items-center">
            <div className="h-px w-11 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--info)_52%,transparent),color-mix(in_srgb,var(--info)_8%,transparent))]" />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                  data.onAddNext(data.model.id, "default");
                }}
              className="animate-scale-in pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border bg-[var(--surface-elevated)] text-[18px] font-semibold leading-none text-[var(--info)] shadow-[var(--shadow-sm)] transition-all duration-150 hover:scale-[1.04] hover:border-[color-mix(in_srgb,var(--info)_75%,transparent)] hover:text-[var(--info-alt)]"
              style={{ borderColor: continuationBorder }}
              aria-label="Adicionar proximo nó"
            >
              +
            </button>
          </div>
        ) : null}

        <Handle
          type="target"
          id="input"
          position={Position.Left}
          className="!h-3.5 !w-3.5 !border-2 !bg-[var(--canvas)]"
          style={{ borderColor: meta.color }}
        />
        <Handle
          type="source"
          id="default"
          position={Position.Right}
          className="!h-3.5 !w-3.5 !border-2 !bg-[var(--text-primary)]"
          style={{ borderColor: meta.color }}
        />
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
      ? "var(--info)"
      : props.data?.fromSelectedNode
        ? "color-mix(in_srgb,var(--info)_82%,var(--text-secondary))"
        : "var(--text-secondary)";

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
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-xs text-[var(--text-secondary)] transition hover:border-[color-mix(in_srgb,var(--info)_72%,transparent)] hover:text-[var(--info)]"
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
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-xs text-[var(--text-secondary)] transition hover:border-[color-mix(in_srgb,var(--danger)_72%,transparent)] hover:text-[var(--danger)]"
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
    whatsappInstancias,
  } = props;
  const reactFlow = useReactFlow<Node<FlowNodeData, "workflow">, Edge>();
  const didAutoCenterRef = useRef(false);
  const prevNodeIdsRef = useRef<Set<string>>(new Set());
  const [enteringNodeIds, setEnteringNodeIds] = useState<Set<string>>(new Set());

  const outgoingCountByNode = useMemo(() => {
    const map = new Map<string, { total: number }>();
    edges.forEach((edge) => {
      const current = map.get(edge.source) ?? { total: 0 };
      current.total += 1;
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
          isFocused: node.id === selectedNodeId,
          entering: enteringNodeIds.has(node.id),
          onDeleteNode,
          onConfigChange: onNodeConfigChange,
          whatsappInstancias,
        },
        draggable: true,
      })),
    [enteringNodeIds, nodes, onDeleteNode, onNodeConfigChange, onRequestCreateFromNode, outgoingCountByNode, selectedNodeId, whatsappInstancias],
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
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "var(--text-secondary)" },
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
    <div className="automation-flow-shell relative flex min-h-0 flex-1 overflow-hidden rounded-[24px] bg-[var(--surface)]">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--text-primary)_6%,transparent),transparent_35%)]" />
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
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "var(--text-secondary)" },
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
        <Background color="color-mix(in_srgb,var(--text-secondary)_20%,transparent)" gap={22} />
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
