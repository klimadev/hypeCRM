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
    color: "#8b5cf6",
    soft: "rgba(139,92,246,0.16)",
    label: "Gatilho",
  },
  acao: {
    color: "#06b6d4",
    soft: "rgba(6,182,212,0.16)",
    label: "Ação",
  },
  condicao: {
    color: "#f59e0b",
    soft: "rgba(245,158,11,0.16)",
    label: "Condição",
  },
};

export const WORKFLOW_TRIGGER_OPTIONS: WorkflowNodeTemplate[] = [
  {
    id: "trigger-message",
    kind: "gatilho",
    label: "Recebeu mensagem",
    description: "Dispara visualmente quando um contato envia uma nova mensagem.",
  },
  {
    id: "trigger-lead-created",
    kind: "gatilho",
    label: "Lead criado",
    description: "Inicia a jornada quando um novo lead entra no CRM.",
  },
  {
    id: "trigger-stage-changed",
    kind: "gatilho",
    label: "Negócio mudou de etapa",
    description: "Abre o fluxo ao detectar uma mudança de etapa comercial.",
  },
  {
    id: "trigger-meeting",
    kind: "gatilho",
    label: "Horário agendado",
    description: "Começa a automação quando um compromisso é marcado.",
  },
];

export const WORKFLOW_STEP_OPTIONS: WorkflowNodeTemplate[] = [
  {
    id: "action-reply",
    kind: "acao",
    label: "Enviar resposta automática",
    description: "Simula uma resposta inicial para manter o ritmo do atendimento.",
  },
  {
    id: "action-task",
    kind: "acao",
    label: "Criar tarefa para o time",
    description: "Representa um handoff interno no fluxo visual.",
  },
  {
    id: "condition-keyword",
    kind: "condicao",
    label: "Mensagem contém palavra-chave",
    description: "Divide o fluxo em caminhos visuais com base no conteúdo da mensagem.",
  },
  {
    id: "condition-stage",
    kind: "condicao",
    label: "Negócio está em etapa crítica",
    description: "Cria uma bifurcação mockada para cenários prioritários.",
  },
];

export function criarWorkflowNode(template: WorkflowNodeTemplate, x: number, y: number): WorkflowNodeModel {
  return {
    id: `${template.kind}-${Math.random().toString(36).slice(2, 10)}`,
    kind: template.kind,
    label: template.label,
    description: template.description,
    x,
    y,
    config: criarConfigPadrao(template.kind),
  };
}

function criarConfigPadrao(kind: WorkflowNodeKind): WorkflowNodeConfig {
  if (kind === "gatilho") {
    return {
      canal: "whatsapp",
      janelaMinutos: 10,
    };
  }

  if (kind === "acao") {
    return {
      canal: "whatsapp",
      delayMinutos: 0,
      modeloMensagem: "Resposta inicial",
    };
  }

  return {
    campo: "mensagem",
    operador: "contem",
    valor: "urgente",
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
