export type WorkflowNodeKind = "gatilho" | "acao";

export type WorkflowBranch = "default";

export type WorkflowNodeConfig = {
  messageTemplate?: string;
  whatsappInstanceId?: string;
  sendToLeadPhone?: boolean;
  manualPhones?: string[];
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
  type: "trigger.lead_criado" | "whatsapp.enviar_texto";
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
