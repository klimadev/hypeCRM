import { MessageCircleMore } from "lucide-react";
import type { WhatsappChatMessage } from "@/modules/whatsapp/types";
import { WhatsappMessageBubble } from "./whatsapp-message-bubble";

type Props = {
  messages: WhatsappChatMessage[];
  loading: boolean;
  onRetry: (message: WhatsappChatMessage) => void;
};

export function WhatsappMessageList({ messages, loading, onRetry }: Props) {
  if (!loading && messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-6 py-10 text-center text-[var(--text-secondary)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(139,92,246,0.18)] bg-[var(--brand-soft)]">
          <MessageCircleMore className="h-8 w-8 text-[var(--brand)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma mensagem ainda</p>
        <p className="max-w-[220px] text-xs text-[var(--text-secondary)]">
          Envie uma mensagem para começar a conversa
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {messages.map((message) => (
        <WhatsappMessageBubble key={message.messageId || message.id} message={message} onRetry={onRetry} />
      ))}
      {loading && (
        <div className="flex justify-center gap-1 py-2">
          <div className="h-2 w-2 rounded-full bg-[var(--brand)] animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-2 w-2 rounded-full bg-[var(--brand)] animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="h-2 w-2 rounded-full bg-[var(--brand)] animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      )}
    </div>
  );
}
