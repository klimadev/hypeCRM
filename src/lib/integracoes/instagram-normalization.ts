import type { InstagramInboxMessage } from "./instagram-inbox";

export type InstagramMensagemApi = {
  id: string;
  from?: { id?: string; name?: string; username?: string };
  message?: string;
  created_time?: string;
  attachments?: { data?: Array<{ type?: string; url?: string }> };
};

export type InstagramMensagemNormalizada = {
  messageId: string;
  conversationId: string;
  participantId: string | null;
  participantName: string | null;
  participantUsername: string | null;
  fromMe: boolean;
  kind: string;
  text: string | null;
  createdAt: string;
  timestamp: number;
  payloadJson: string;
  attachments: Array<{ type: string; url: string | null }>;
};

export function mapearMensagemInstagramNormalizadaParaInbox(
  mensagem: Pick<
    InstagramMensagemNormalizada,
    "messageId" | "participantId" | "participantName" | "participantUsername" | "fromMe" | "text" | "createdAt" | "attachments"
  >,
): InstagramInboxMessage {
  return {
    id: mensagem.messageId,
    from_id: mensagem.participantId,
    from_name: mensagem.participantName,
    from_username: mensagem.participantUsername,
    from_me: mensagem.fromMe,
    text: mensagem.text,
    created_at: mensagem.createdAt,
    attachments: mensagem.attachments,
  };
}

export function normalizarMensagemInstagramApi(input: {
  conversationId: string;
  contaUsername: string;
  mensagem: InstagramMensagemApi;
}): InstagramMensagemNormalizada {
  const createdAt = input.mensagem.created_time ?? new Date().toISOString();
  const attachments = input.mensagem.attachments?.data?.map((attachment) => ({
    type: attachment.type ?? "unknown",
    url: attachment.url ?? null,
  })) ?? [];

  return {
    messageId: input.mensagem.id,
    conversationId: input.conversationId,
    participantId: input.mensagem.from?.id ?? null,
    participantName: input.mensagem.from?.name ?? null,
    participantUsername: input.mensagem.from?.username ?? null,
    fromMe: !!input.mensagem.from?.username && input.mensagem.from.username === input.contaUsername,
    kind: attachments[0]?.type ?? "text",
    text: input.mensagem.message ?? null,
    createdAt,
    timestamp: Math.floor(new Date(createdAt).getTime() / 1000),
    payloadJson: JSON.stringify(input.mensagem),
    attachments,
  };
}

export function mapearMensagemInstagramDbParaInbox(registro: {
  mensagem_id: string;
  participant_id: string | null;
  participant_name: string | null;
  participant_username: string | null;
  from_me: boolean;
  conteudo: string | null;
  timestamp: number;
  tipo: string;
  payload_json: string | null;
}): InstagramInboxMessage {
  const payload = registro.payload_json
    ? JSON.parse(registro.payload_json) as { attachments?: Array<{ type?: string; url?: string | null }> }
    : null;
  const attachments = Array.isArray(payload?.attachments)
    ? payload.attachments.map((attachment) => ({
        type: attachment?.type ?? registro.tipo,
        url: attachment?.url ?? null,
      }))
    : [];

  return {
    id: registro.mensagem_id,
    from_id: registro.participant_id,
    from_name: registro.participant_name,
    from_username: registro.participant_username,
    from_me: registro.from_me,
    text: registro.conteudo,
    created_at: new Date(registro.timestamp * 1000).toISOString(),
    attachments,
  };
}
