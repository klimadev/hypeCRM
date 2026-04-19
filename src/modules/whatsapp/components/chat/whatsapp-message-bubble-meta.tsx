"use client";

import { Check, CheckCheck, Clock3, Trash2, Volume2 } from "lucide-react";
import type { WhatsappChatMessage } from "@/modules/whatsapp/types";

export function formatTimeWhatsappMessageBubble(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReceiptIconWhatsappMessageBubble({ message, size = "default" }: { message: WhatsappChatMessage; size?: "sm" | "default" }) {
  const iconClass = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  const textClass = size === "sm" ? "text-[9px]" : "text-[var(--text-tertiary)]";

  if (!message.fromMe) {
    if (message.status === "PENDING") return <Clock3 className={`${iconClass} text-[var(--text-tertiary)]`} />;
    if (message.status === "SENT") return <span className={textClass}>Enviada</span>;
    if (message.status === "DELIVERED") return <Check className={`${iconClass} text-[var(--text-tertiary)]`} />;
    if (message.status === "READ") return <CheckCheck className={`${iconClass} text-[var(--success)]`} />;
    if (message.status === "PLAYED") return <Volume2 className={`${iconClass} text-[var(--info-alt)]`} />;
    if (message.status === "DELETED") return <Trash2 className={`${iconClass} text-[var(--text-tertiary)]`} />;
    return null;
  }

  if (message.status === "PENDING") return <Clock3 className={`${iconClass} text-[var(--text-tertiary)]`} />;
  if (message.status === "SENT") return <Check className={`${iconClass} text-[var(--text-tertiary)]`} />;
  if (message.status === "DELIVERED") return <CheckCheck className={`${iconClass} text-[var(--text-tertiary)]`} />;
  if (message.status === "READ") return <CheckCheck className={`${iconClass} text-[var(--brand)]`} />;
  if (message.status === "PLAYED") return <Volume2 className={`${iconClass} text-[var(--info-alt)]`} />;
  if (message.status === "DELETED") return <Trash2 className={`${iconClass} text-[var(--text-tertiary)]`} />;
  return null;
}
