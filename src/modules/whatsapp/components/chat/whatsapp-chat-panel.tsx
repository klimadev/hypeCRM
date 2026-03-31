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
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))] text-[var(--text-primary)] shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-4 py-3">
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
        className="flex-1 overflow-y-auto scroll-smooth bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.06),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent)] p-3"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)
          `,
          backgroundSize: "20px 20px, 100% 100%",
        }}
      >
        <WhatsappMessageList 
          messages={messages} 
          loading={loading} 
          onRetry={(message) => void onRetryMessage(message)} 
        />
      </div>

      <div className="border-t border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
        {error && (
          <p className="mb-2 rounded-[var(--radius-control)] border border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.12)] px-3 py-2 text-xs text-[var(--danger)]">
            {error}
          </p>
        )}
        {blockedState && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.12)] px-3 py-2 text-[var(--warning)]">
            <p className="text-xs text-[rgba(250,250,250,0.9)]">{blockedState.message}</p>
            {blockedState.actionHref ? (
              <Button asChild size="sm" variant="outline" className="h-8 rounded-[calc(var(--radius-control)-2px)] border-[rgba(245,158,11,0.24)] bg-[color:rgba(255,255,255,0.03)] text-[var(--warning)] hover:border-[rgba(245,158,11,0.34)] hover:bg-[color:rgba(245,158,11,0.12)]">
                <Link href={blockedState.actionHref}>
                  <Settings2 className="mr-1 h-3.5 w-3.5" />
                  {blockedState.actionLabel ?? "Configurar"}
                </Link>
              </Button>
            ) : null}
          </div>
        )}
        {!blockedState && !canSend && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.1)] px-3 py-2">
            <p className="text-xs text-[var(--text-secondary)]">WhatsApp desconectado.</p>
            <Button asChild size="sm" variant="outline" className="h-7 rounded-[calc(var(--radius-control)-2px)] border-[rgba(245,158,11,0.24)] bg-[color:rgba(255,255,255,0.03)] text-[var(--warning)] hover:border-[rgba(245,158,11,0.34)] hover:bg-[color:rgba(245,158,11,0.12)] text-xs">
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
