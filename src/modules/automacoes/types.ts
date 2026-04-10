export type WorkflowNodeKind = "gatilho" | "acao" | "condicao";

export type WorkflowBranch = "default" | "sim" | "nao";

export type WorkflowNodeConfig = {
  canal?: string;
  janelaMinutos?: number;
  delayMinutos?: number;
  modeloMensagem?: string;
  campo?: string;
  operador?: string;
  valor?: string;
};

export type WorkflowNodeTemplate = {
  id: string;
  kind: WorkflowNodeKind;
  label: string;
  description: string;
};

export type WorkflowNodeModel = {
  id: string;
  kind: WorkflowNodeKind;
  label: string;
  description: string;
  x: number;
  y: number;
  config: WorkflowNodeConfig;
};

export type WorkflowEdgeModel = {
  id: string;
  source: string;
  target: string;
  sourceHandle: WorkflowBranch;
};
