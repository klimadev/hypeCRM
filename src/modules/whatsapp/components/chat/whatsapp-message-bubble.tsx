import { Check, CheckCheck, Clock3, RotateCcw, Trash2, Volume2 } from "lucide-react";
import type { WhatsappChatMessage } from "@/modules/whatsapp/types";

type Props = {
  message: WhatsappChatMessage;
  onRetry?: (message: WhatsappChatMessage) => void;
};

function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReceiptIcon({ message }: { message: WhatsappChatMessage }) {
  if (!message.fromMe) return null;
  if (message.status === "PENDING") return <Clock3 className="h-3 w-3 text-[var(--text-tertiary)]" />;
  if (message.status === "SENT") return <Check className="h-3 w-3 text-[var(--text-tertiary)]" />;
  if (message.status === "DELIVERED") return <CheckCheck className="h-3 w-3 text-[var(--text-tertiary)]" />;
  if (message.status === "READ") return <CheckCheck className="h-3 w-3 text-[var(--brand)]" />;
  if (message.status === "PLAYED") return <Volume2 className="h-3 w-3 text-[var(--info-alt)]" />;
  if (message.status === "DELETED") return <Trash2 className="h-3 w-3 text-[var(--text-tertiary)]" />;
  return null;
}

export function WhatsappMessageBubble({ message, onRetry }: Props) {
  const outgoing = message.fromMe;
  const isDeleted = message.status === "DELETED";
  return (
    <div className={`flex w-full ${outgoing ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] border px-3 py-2 text-[13px] leading-6 shadow-[var(--shadow-sm)] ${
          outgoing
            ? "border-[color:rgba(139,92,246,0.22)] bg-[linear-gradient(180deg,rgba(139,92,246,0.16),rgba(139,92,246,0.12))] rounded-br-none"
            : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] rounded-bl-none"
        } ${isDeleted ? "opacity-50" : ""}`}
        style={{
          borderRadius: outgoing ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        }}
        >
        {isDeleted ? (
          <p className="whitespace-pre-wrap text-sm italic text-[var(--text-tertiary)]">Mensagem excluída</p>
        ) : (
          <p className="whitespace-pre-wrap text-[var(--text-primary)]">{message.text}</p>
        )}
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[var(--text-tertiary)]">
          {message.status === "ERROR" ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 font-medium text-[var(--danger)] transition-colors hover:text-[color:#fb7185]"
              onClick={() => onRetry?.(message)}
            >
              <RotateCcw className="h-3 w-3" />
              Falhou
            </button>
          ) : (
            <>
              <span>{formatTime(message.timestamp)}</span>
              <ReceiptIcon message={message} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
