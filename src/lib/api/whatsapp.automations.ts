import type {
  WhatsappAutomacao,
  WhatsappAutomacaoCreateInput,
  WhatsappAutomacaoUpdateInput,
  WhatsappFollowUpDispatchResultado,
} from "@/modules/whatsapp/types";
import { type ApiErro, type ResultadoApi, lerJsonSeguro } from "./whatsapp.shared";

export async function listarAutomacoesWhatsapp(): Promise<ResultadoApi<{ automacoes: WhatsappAutomacao[] }>> {
  const resposta = await fetch("/api/whatsapp/automations");
  const json = await lerJsonSeguro<{ automacoes?: WhatsappAutomacao[] } & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar automações." };
  }

  return { ok: true, dados: { automacoes: json.automacoes ?? [] } };
}

export async function criarAutomacaoWhatsapp(
  data: WhatsappAutomacaoCreateInput,
): Promise<ResultadoApi<{ automacao: WhatsappAutomacao | null }>> {
  const resposta = await fetch("/api/whatsapp/automations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await lerJsonSeguro<{ automacao?: WhatsappAutomacao } & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao criar automação." };
  }

  return { ok: true, dados: { automacao: json.automacao ?? null } };
}

export async function atualizarAutomacaoWhatsapp(
  id: string,
  data: WhatsappAutomacaoUpdateInput,
): Promise<ResultadoApi<{ automacao: WhatsappAutomacao | null }>> {
  const resposta = await fetch(`/api/whatsapp/automations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await lerJsonSeguro<{ automacao?: WhatsappAutomacao } & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao atualizar automação." };
  }

  return { ok: true, dados: { automacao: json.automacao ?? null } };
}

export async function gerarPreviewAutomacaoWhatsapp(
  mensagem: string,
): Promise<ResultadoApi<{ preview: string | null }>> {
  const resposta = await fetch("/api/whatsapp/automations/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mensagem }),
  });
  const json = await lerJsonSeguro<{ preview?: string } & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao gerar preview." };
  }

  return { ok: true, dados: { preview: typeof json.preview === "string" ? json.preview : null } };
}

export async function dispararDispatchFollowUpWhatsapp(
  limite = 50,
): Promise<ResultadoApi<WhatsappFollowUpDispatchResultado>> {
  const resposta = await fetch("/api/whatsapp/automations/follow-up/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limite }),
  });
  const json = await lerJsonSeguro<Partial<WhatsappFollowUpDispatchResultado> & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao processar follow-ups." };
  }

  return {
    ok: true,
    dados: {
      runId: typeof json.runId === "string" ? json.runId : "dispatch-sem-id",
      processados: typeof json.processados === "number" ? json.processados : 0,
      enviados: typeof json.enviados === "number" ? json.enviados : 0,
      falhas: typeof json.falhas === "number" ? json.falhas : 0,
      detalhes: Array.isArray(json.detalhes) ? json.detalhes : [],
      metrics: json.metrics,
    },
  };
}

export async function excluirAutomacaoWhatsapp(id: string): Promise<ResultadoApi<null>> {
  const resposta = await fetch(`/api/whatsapp/automations/${id}`, { method: "DELETE" });
  const json = await lerJsonSeguro<ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao excluir automação." };
  }

  return { ok: true, dados: null };
}
