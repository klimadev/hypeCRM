"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { MessageCircle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatConnectionStatus, WhatsappChatBlockedState, WhatsappChatMessage } from "@/modules/whatsapp/types";
import { WhatsappConnectionBadge } from "./whatsapp-connection-badge";
import { WhatsappMessageList } from "./whatsapp-message-list";
import { WhatsappMessageInput } from "./whatsapp-message-input";

type Props = {
  nomeContato: string;
  messages: WhatsappChatMessage[];
  connectionStatus: ChatConnectionStatus;
  loading: boolean;
  sending: boolean;
  canSend: boolean;
  error: string | null;
  blockedState?: WhatsappChatBlockedState | null;
  onSendMessage: (text: string) => Promise<void>;
  onRetryMessage: (message: WhatsappChatMessage) => Promise<void>;
};

export function WhatsappChatPanel({
  nomeContato,
  messages,
  connectionStatus,
  loading,
  sending,
  canSend,
  error,
  blockedState,
  onSendMessage,
  onRetryMessage,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-soft)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
            {nomeContato.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">{nomeContato}</p>
            <p className="text-xs text-[var(--text-secondary)]">Conversa ativa</p>
          </div>
        </div>
        <WhatsappConnectionBadge status={connectionStatus} />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth bg-[var(--surface)] p-3"
      >
        <WhatsappMessageList 
          messages={messages} 
          loading={loading} 
          onRetry={(message) => void onRetryMessage(message)} 
        />
      </div>

      <div className="border-t border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
        {error && (
          <p className="mb-2 rounded-xl border border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-2 text-xs text-[var(--danger)]">
            {error}
          </p>
        )}
        {blockedState && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] px-3 py-2 text-[var(--warning)]">
            <p className="text-xs text-[var(--text-primary)]">{blockedState.message}</p>
            {blockedState.actionHref ? (
              <Button asChild size="sm" variant="outline" className="h-8 rounded-xl border-[var(--warning)] bg-[var(--surface-soft)] text-[var(--warning)] hover:bg-[color-mix(in_srgb,var(--warning)_12%,transparent)]">
                <Link href={blockedState.actionHref}>
                  <Settings2 className="mr-1 h-3.5 w-3.5" />
                  {blockedState.actionLabel ?? "Configurar"}
                </Link>
              </Button>
            ) : null}
          </div>
        )}
        {!blockedState && !canSend && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] px-3 py-2">
            <p className="text-xs text-[var(--text-secondary)]">WhatsApp desconectado.</p>
            <Button asChild size="sm" variant="outline" className="h-7 rounded-xl border-[var(--warning)] bg-[var(--surface-soft)] text-[var(--warning)] hover:bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-xs">
              <Link href="/whatsapp">
                <MessageCircle className="mr-1 h-3.5 w-3.5" />
                Conectar
              </Link>
            </Button>
          </div>
        )}
      </div>

      <WhatsappMessageInput disabled={Boolean(blockedState) || !canSend} sending={sending} onSend={onSendMessage} />
    </div>
  );
}
