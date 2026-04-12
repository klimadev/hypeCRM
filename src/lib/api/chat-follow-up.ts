type ResultadoApi<T> = { ok: true; dados: T } | { ok: false; erro: string };

export type FollowUpTemplateEtapa = {
  id: string;
  ordem: number;
  delayMinutos: number;
  conteudo: string;
  ativo: boolean;
};

export type FollowUpTemplate = {
  id: string;
  nome: string;
  descricao: string | null;
  canal: "whatsapp";
  ativo: boolean;
  permiteRepeticao: boolean;
  maxCiclos: number;
  pausarSeResponder: boolean;
  etapas: FollowUpTemplateEtapa[];
  criadoEm: string;
  atualizadoEm: string;
};

export type FollowUpConversa = {
  id: string;
  status: "ATIVO" | "PAUSADO" | "ENCERRADO";
  etapaAtual: number;
  cicloAtual: number;
  proximoDisparoEm: string | null;
  ultimaSaidaEm: string | null;
  ultimaRespostaEm: string | null;
  motivoPausa: string | null;
  motivoEncerramento: string | null;
  template: Pick<FollowUpTemplate, "id" | "nome" | "maxCiclos" | "permiteRepeticao">;
};

export type FollowUpTemplatePayload = {
  nome: string;
  descricao: string | null;
  canal: "whatsapp";
  ativo: boolean;
  permiteRepeticao: boolean;
  maxCiclos: number;
  pausarSeResponder: boolean;
  etapas: Array<{
    ordem: number;
    delayMinutos: number;
    conteudo: string;
    ativo: boolean;
  }>;
};

async function parseErro(resposta: Response, fallback: string) {
  const json = await resposta.json().catch(() => ({}));
  return (json.erro as string) ?? fallback;
}

export async function listarTemplatesFollowUp(): Promise<ResultadoApi<{ templates: FollowUpTemplate[] }>> {
  const resposta = await fetch("/api/chat/follow-up/templates", { cache: "no-store" });
  if (!resposta.ok) return { ok: false, erro: await parseErro(resposta, "Erro ao listar templates.") };
  const json = await resposta.json();
  return { ok: true, dados: { templates: json.templates ?? [] } };
}

export async function criarTemplateFollowUp(payload: FollowUpTemplatePayload): Promise<ResultadoApi<{ template: FollowUpTemplate }>> {
  const resposta = await fetch("/api/chat/follow-up/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resposta.ok) return { ok: false, erro: await parseErro(resposta, "Erro ao criar template.") };
  const json = await resposta.json();
  return { ok: true, dados: { template: json.template } };
}

export async function atualizarTemplateFollowUp(id: string, payload: FollowUpTemplatePayload): Promise<ResultadoApi<{ template: FollowUpTemplate }>> {
  const resposta = await fetch("/api/chat/follow-up/templates", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...payload }),
  });
  if (!resposta.ok) return { ok: false, erro: await parseErro(resposta, "Erro ao atualizar template.") };
  const json = await resposta.json();
  return { ok: true, dados: { template: json.template } };
}

export async function excluirTemplateFollowUp(id: string): Promise<ResultadoApi<null>> {
  const resposta = await fetch("/api/chat/follow-up/templates", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!resposta.ok) return { ok: false, erro: await parseErro(resposta, "Erro ao excluir template.") };
  return { ok: true, dados: null };
}

export async function obterConversaFollowUp(instanceName: string, remoteJid: string): Promise<ResultadoApi<{ conversa: FollowUpConversa | null }>> {
  const search = new URLSearchParams({ instanceName, remoteJid });
  const resposta = await fetch(`/api/chat/follow-up/conversation?${search.toString()}`, { cache: "no-store" });
  if (!resposta.ok) return { ok: false, erro: await parseErro(resposta, "Erro ao carregar follow-up.") };
  const json = await resposta.json();
  return { ok: true, dados: { conversa: json.conversa ?? null } };
}

export async function ativarConversaFollowUp(payload: { instanceName: string; remoteJid: string; idLead: string; templateId: string }): Promise<ResultadoApi<{ conversa: FollowUpConversa }>> {
  const resposta = await fetch("/api/chat/follow-up/conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resposta.ok) return { ok: false, erro: await parseErro(resposta, "Erro ao ativar follow-up.") };
  const json = await resposta.json();
  return { ok: true, dados: { conversa: json.conversa } };
}

export async function acionarConversaFollowUp(payload: { conversaId: string; acao: "PAUSAR" | "RETOMAR" | "ENCERRAR" }): Promise<ResultadoApi<{ conversa: FollowUpConversa }>> {
  const resposta = await fetch("/api/chat/follow-up/conversation", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resposta.ok) return { ok: false, erro: await parseErro(resposta, "Erro ao atualizar follow-up.") };
  const json = await resposta.json();
  return { ok: true, dados: { conversa: json.conversa } };
}
