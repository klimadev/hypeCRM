import { MessageCircleMore } from "lucide-react";
import type { WhatsappChatMessage } from "@/modules/whatsapp/types";
import { criarItensListaMensagensWhatsapp } from "@/modules/whatsapp/chat-helpers";
import { WhatsappMessageBubble } from "./whatsapp-message-bubble";

type Props = {
  messages: WhatsappChatMessage[];
  loading: boolean;
  onRetry: (message: WhatsappChatMessage) => void;
};

export function WhatsappMessageList({ messages, loading, onRetry }: Props) {
  if (!loading && messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-soft)] px-6 py-10 text-center text-[var(--text-secondary)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--brand)] bg-[var(--brand-soft)]">
          <MessageCircleMore className="h-8 w-8 text-[var(--brand)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma mensagem ainda</p>
        <p className="max-w-[220px] text-xs text-[var(--text-secondary)]">
          Envie uma mensagem para começar a conversa
        </p>
      </div>
    );
  }

  const itens = criarItensListaMensagensWhatsapp(messages);

  return (
    <div className="space-y-1.5">
      {itens.map((item) =>
        item.type === "separator" ? (
          <div key={item.key} className="flex items-center justify-center py-2">
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)] shadow-[var(--shadow-sm)]">
              {item.label}
            </span>
          </div>
        ) : (
          <WhatsappMessageBubble key={item.key} message={item.message} onRetry={onRetry} />
        ),
      )}
      {loading && (
        <div className="flex justify-center py-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--brand)]" />
        </div>
      )}
    </div>
  );
}
