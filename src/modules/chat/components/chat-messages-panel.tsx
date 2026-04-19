"use client";

import { Loader2 } from "lucide-react";
import { ChatMessageList } from "./chat-message-list";
import { ChatMessageComposer, type ChatMessageComposerFollowUpContext } from "./chat-message-composer";
import { useChatMessages } from "../hooks/use-chat-messages";

type ChatMessagesPanelProps = {
  instanceName: string;
  remoteJid: string;
  unreadCount?: number;
  chatContext?: {
    telefone: string;
    pushName: string | null;
    canal: "whatsapp" | "instagram";
    leadMatch: {
      id: string;
      nome: string;
      id_estagio: string;
      id_negocio: string | null;
      nome_estagio: string | null;
      nome_funcionario: string | null;
      nome_pdv: string | null;
      negocio: { titulo: string } | null;
    } | null;
  };
  followUpContext?: ChatMessageComposerFollowUpContext | null;
};

export function ChatMessagesPanel({ instanceName, remoteJid, unreadCount = 0, chatContext, followUpContext }: ChatMessagesPanelProps) {
  const {
    messages,
    carregando,
    carregandoMais,
    erro,
    enviando,
    sseConectado,
    recarregar,
    carregarMensagensAnteriores,
    sendMessage,
    sendMedia,
    scheduleMessage,
    cancelScheduledMessage,
    agendadas,
    recarregarAgendadas,
  } = useChatMessages({
    instanceName,
    remoteJid,
  });
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {!sseConectado ? (
        <div className="flex items-center justify-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--warning)]/10 px-4 py-1">
          <Loader2 className="h-3 w-3 animate-spin text-[var(--warning)]" />
          <span className="text-[11px] text-[var(--warning)]">Reconectando tempo real...</span>
        </div>
      ) : null}

      <ChatMessageList
        instanceName={instanceName}
        remoteJid={remoteJid}
        messages={messages}
        unreadCount={unreadCount}
        carregando={carregando}
        carregandoMais={carregandoMais}
        erro={erro}
        recarregar={recarregar}
        carregarMensagensAnteriores={carregarMensagensAnteriores}
      />

      <ChatMessageComposer
        instanceName={instanceName}
        remoteJid={remoteJid}
        enviando={enviando}
        chatContext={chatContext}
        followUpContext={followUpContext}
        agendadas={agendadas}
        sendMessage={sendMessage}
        sendMedia={sendMedia}
        scheduleMessage={scheduleMessage}
        cancelScheduledMessage={cancelScheduledMessage}
        recarregarAgendadas={recarregarAgendadas}
      />
    </div>
  );
}
