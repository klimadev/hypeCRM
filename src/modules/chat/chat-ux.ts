import type { UnifiedChatMessage } from "@/lib/api/whatsapp.chat";
import type { ChatUnificado } from "@/modules/chat/types";

export type ChatSignalTone = "brand" | "warning" | "info" | "success" | "secondary";

export type ChatSignal = {
  label: string;
  tone: ChatSignalTone;
};

export type ChatPrimaryAction = {
  tipo: "registrar_lead" | "marcar_lido" | "criar_negocio" | "transferir";
  label: string;
};

export function listarSinaisOperacionaisChat(chat: ChatUnificado): ChatSignal[] {
  const sinais: ChatSignal[] = [];

  if (chat.unreadCount > 0) {
    sinais.push({ label: `${chat.unreadCount} não lidas`, tone: "warning" });
  }

  if (!chat.semMatch && !chat.leadMatch?.id_funcionario) {
    sinais.push({ label: "Sem responsável", tone: "warning" });
  }

  if (!chat.semMatch && !chat.leadMatch?.id_negocio) {
    sinais.push({ label: "Sem negócio", tone: "info" });
  }

  return sinais.slice(0, 2);
}

export function obterResumoOperacionalChat(chat: ChatUnificado) {
  if (chat.semMatch) {
    return "Novo contato";
  }

  if (!chat.leadMatch?.id_funcionario) {
    return "Sem responsável";
  }

  if (!chat.leadMatch?.id_negocio) {
    return "Sem negócio";
  }

  if (chat.leadMatch?.nome_estagio) {
    return chat.leadMatch.nome_estagio;
  }

  if (chat.ultimaMensagem?.fromMe) {
    return "Aguardando resposta";
  }

  return "Conversa em andamento";
}

export function obterAcaoPrimariaChat(chat: ChatUnificado): ChatPrimaryAction {
  if (chat.semMatch) {
    return { tipo: "registrar_lead", label: "Registrar lead" };
  }

  if (chat.canal === "whatsapp" && chat.unreadCount > 0) {
    return { tipo: "marcar_lido", label: "Marcar como lido" };
  }

  if (!chat.leadMatch?.id_negocio) {
    return { tipo: "criar_negocio", label: "Criar negócio" };
  }

  return { tipo: "transferir", label: "Transferir" };
}

export function obterPlaceholderComposerChat(params: {
  agendar: boolean;
  canal: "whatsapp" | "instagram";
  semMatch: boolean;
  followUpStatus: "ATIVO" | "PAUSADO" | "ENCERRADO" | null;
}) {
  if (params.agendar) {
    return "Mensagem agendada";
  }

  if (params.semMatch) {
    return "Escreva a primeira mensagem";
  }

  if (params.followUpStatus === "PAUSADO") {
    return "Responda para retomar";
  }

  if (params.canal === "instagram") {
    return "Responder no Instagram";
  }

  return "Digite uma mensagem";
}

export function encontrarIndicePrimeiraMensagemNaoLida(messages: UnifiedChatMessage[], unreadCount: number): number | null {
  if (unreadCount <= 0 || messages.length === 0) {
    return null;
  }

  let restantes = unreadCount;
  let fallback: number | null = null;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.fromMe) {
      continue;
    }

    fallback = index;
    restantes -= 1;
    if (restantes === 0) {
      return index;
    }
  }

  return fallback;
}
