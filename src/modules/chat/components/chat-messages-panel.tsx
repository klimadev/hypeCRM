"use client";

import { Loader2 } from "lucide-react";
import { ChatMessageList } from "./chat-message-list";
import { ChatMessageComposer } from "./chat-message-composer";
import { useChatMessages } from "../hooks/use-chat-messages";

type ChatMessagesPanelProps = {
  instanceName: string;
  remoteJid: string;
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
};

export function ChatMessagesPanel({ instanceName, remoteJid, chatContext }: ChatMessagesPanelProps) {
  const {
    messages,
    carregando,
    erro,
    enviando,
    sseConectado,
    recarregar,
    sendMessage,
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
        <div className="flex items-center justify-center gap-2 border-b border-[var(--border-subtle)] bg-amber-500/10 px-4 py-1">
          <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
          <span className="text-[11px] text-amber-400">Reconectando tempo real...</span>
        </div>
      ) : null}

      <ChatMessageList
        instanceName={instanceName}
        remoteJid={remoteJid}
        messages={messages}
        carregando={carregando}
        erro={erro}
        recarregar={recarregar}
      />

      <ChatMessageComposer
        instanceName={instanceName}
        remoteJid={remoteJid}
        enviando={enviando}
        chatContext={chatContext}
        agendadas={agendadas}
        sendMessage={sendMessage}
        scheduleMessage={scheduleMessage}
        cancelScheduledMessage={cancelScheduledMessage}
        recarregarAgendadas={recarregarAgendadas}
      />
    </div>
  );
}
