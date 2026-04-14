import { useMemo } from "react";
import type { WorkflowEdgeModel, WorkflowNodeModel } from "../types";

type UseWorkflowValidationParams = {
  nodes: WorkflowNodeModel[];
  edges: WorkflowEdgeModel[];
};

export function useWorkflowValidation({ nodes, edges }: UseWorkflowValidationParams) {
  return useMemo(() => {
    const messages: string[] = [];
    const triggerCount = nodes.filter((node) => node.kind === "gatilho").length;
    const actionCount = nodes.filter((node) => node.kind === "acao").length;

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
  }, [edges, nodes]);
}
