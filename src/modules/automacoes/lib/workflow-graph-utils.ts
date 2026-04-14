import type { WorkflowEdgeModel, WorkflowNodeModel } from "../types";

export function isNodeValido(node: unknown): node is WorkflowNodeModel {
  if (!node || typeof node !== "object") return false;
  const value = node as Record<string, unknown>;
  if (typeof value.id !== "string") return false;
  if (value.kind !== "gatilho" && value.kind !== "acao") return false;
  if (value.type !== "trigger.lead_criado" && value.type !== "whatsapp.enviar_texto") return false;
  if (typeof value.label !== "string" || typeof value.description !== "string") return false;
  if (typeof value.x !== "number" || typeof value.y !== "number") return false;
  return typeof value.config === "object" && value.config !== null;
}

export function isEdgeValida(edge: unknown): edge is WorkflowEdgeModel {
  if (!edge || typeof edge !== "object") return false;
  const value = edge as Record<string, unknown>;
  return (
    typeof value.id === "string" &&
    typeof value.source === "string" &&
    typeof value.target === "string" &&
    value.sourceHandle === "default"
  );
}

export function normalizarGrafo(grafo: unknown): { nodes: WorkflowNodeModel[]; edges: WorkflowEdgeModel[] } {
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

export function createNextNodePosition(nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[], sourceNodeId: string | null) {
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
