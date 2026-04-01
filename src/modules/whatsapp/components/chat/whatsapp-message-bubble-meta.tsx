"use client";

import { Check, CheckCheck, Clock3, Trash2, Volume2 } from "lucide-react";
import type { WhatsappChatMessage } from "@/modules/whatsapp/types";

export function formatTimeWhatsappMessageBubble(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReceiptIconWhatsappMessageBubble({ message }: { message: WhatsappChatMessage }) {
  if (!message.fromMe) return null;
  if (message.status === "PENDING") return <Clock3 className="h-3 w-3 text-[var(--text-tertiary)]" />;
  if (message.status === "SENT") return <Check className="h-3 w-3 text-[var(--text-tertiary)]" />;
  if (message.status === "DELIVERED") return <CheckCheck className="h-3 w-3 text-[var(--text-tertiary)]" />;
  if (message.status === "READ") return <CheckCheck className="h-3 w-3 text-[var(--brand)]" />;
  if (message.status === "PLAYED") return <Volume2 className="h-3 w-3 text-[var(--info-alt)]" />;
  if (message.status === "DELETED") return <Trash2 className="h-3 w-3 text-[var(--text-tertiary)]" />;
  return null;
}
