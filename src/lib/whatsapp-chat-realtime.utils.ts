import type { ConversaResumo } from "@/modules/whatsapp/types";
import type { EvolutionConversa } from "./evolution-api";

export function criarWhereLeadMensagensRealtime(leadId: string, phoneNumber: string) {
  return leadId
    ? { id_lead: leadId }
    : { remote_jid: { contains: phoneNumber.replace(/\D/g, "") } };
}

export function normalizarLimiteConversasRealtime(limite?: number) {
  return Math.min(limite ?? 30, 50);
}

export function criarMensagemPreviewConversaRealtime(isFromMe: boolean) {
  return isFromMe ? "Você: mensagem enviada" : "Nova mensagem";
}

export function mapearConversaResumoRealtime(params: {
  conversa: EvolutionConversa;
  lead:
    | {
        id: string;
        nome: string;
        telefone: string;
        origem: string | null;
        estagioNome: string | null;
      }
    | null;
  agoraMs: number;
}): ConversaResumo {
  const { conversa, lead, agoraMs } = params;
  const chave = conversa.remoteJidAlt ?? conversa.remoteJid;
  const telefoneSemFormato = chave.replace("@s.whatsapp.net", "").replace("@g.us", "");
  const isFromMe = conversa.lastMessage?.key?.fromMe ?? false;
  const mensagemPreview = criarMensagemPreviewConversaRealtime(isFromMe);

  if (lead) {
    return {
      leadId: lead.id,
      leadNome: conversa.pushName?.trim() || lead.nome,
      leadTelefone: lead.telefone,
      leadOrigem: (lead.origem ?? "SINCRONIZACAO_WHATSAPP") as ConversaResumo["leadOrigem"],
      estagioNome: lead.estagioNome,
      ultimaMensagem: conversa.lastMessage
        ? {
            conteudo: mensagemPreview,
            fromMe: isFromMe,
            timestamp: agoraMs,
          }
        : null,
      naoLidas: isFromMe ? 0 : 1,
    };
  }

  return {
    leadId: `novo-${telefoneSemFormato}`,
    leadNome: conversa.pushName?.trim() || telefoneSemFormato,
    leadTelefone: telefoneSemFormato,
    leadOrigem: "SINCRONIZACAO_WHATSAPP",
    estagioNome: null,
    ultimaMensagem: conversa.lastMessage
      ? {
          conteudo: mensagemPreview,
          fromMe: isFromMe,
          timestamp: agoraMs,
        }
      : null,
    naoLidas: isFromMe ? 0 : 1,
  };
}

export function criarChaveChatStream(idEmpresa: string, idInstancia: string, leadId: string) {
  return `chat:${idEmpresa}:${idInstancia}:${leadId}`;
}

export function criarChaveConversasStream(
  idEmpresa: string,
  busca: string,
  naoLidas: boolean,
  limite: number,
) {
  return `conversation-list:${idEmpresa}:${busca || "_"}:${naoLidas ? "unread" : "all"}:${limite}`;
}
