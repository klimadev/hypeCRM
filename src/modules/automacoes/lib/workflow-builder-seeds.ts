import type {
  WorkflowBranch,
  WorkflowEdgeModel,
  WorkflowNodeConfig,
  WorkflowNodeKind,
  WorkflowNodeModel,
  WorkflowNodeTemplate,
} from "../types";

type NodeKindMeta = {
  color: string;
  soft: string;
  label: string;
};

export const WORKFLOW_KIND_META: Record<WorkflowNodeKind, NodeKindMeta> = {
  gatilho: {
    color: "var(--brand)",
    soft: "color-mix(in_srgb,var(--brand)_18%,transparent)",
    label: "Gatilho",
  },
  acao: {
    color: "var(--info-alt)",
    soft: "color-mix(in_srgb,var(--info-alt)_18%,transparent)",
    label: "Ação",
  },
};

export const WORKFLOW_TRIGGER_OPTIONS: WorkflowNodeTemplate[] = [
  {
    id: "trigger-lead-created",
    kind: "gatilho",
    label: "Lead criado",
    description: "Inicia a jornada quando um novo lead entra no CRM.",
  },
];

export const WORKFLOW_STEP_OPTIONS: WorkflowNodeTemplate[] = [
  {
    id: "action-whatsapp-send",
    kind: "acao",
    label: "Enviar msg WhatsApp",
    description: "Envia uma mensagem automática para o lead criado.",
  },
];

export function criarWorkflowNode(template: WorkflowNodeTemplate, x: number, y: number): WorkflowNodeModel {
  const type = template.id === "trigger-lead-created" ? "trigger.lead_criado" : "whatsapp.enviar_texto";

  return {
    id: `${template.kind}-${Math.random().toString(36).slice(2, 10)}`,
    kind: template.kind,
    type,
    label: template.label,
    description: template.description,
    x,
    y,
    config: criarConfigPadrao(template.kind),
  };
}

function criarConfigPadrao(kind: WorkflowNodeKind): WorkflowNodeConfig {
  if (kind === "gatilho") {
    return {};
  }

  return {
    messageTemplate: "",
    whatsappInstanceId: "",
    sendToLeadPhone: true,
    manualPhones: [],
  };
}

export function criarWorkflowEdge(source: string, target: string, sourceHandle: WorkflowBranch = "default"): WorkflowEdgeModel {
  return {
    id: `edge-${source}-${sourceHandle}-${target}`,
    source,
    target,
    sourceHandle,
  };
}
