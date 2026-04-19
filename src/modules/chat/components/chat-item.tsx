"use client";

import { Check, CheckCheck, Clock3, MessageCircle, Trash2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatUnificado } from "../types";
import {
  formatarDataAbsolutaChat,
  formatarTimestampRelativoChat,
  obterNomeChat,
} from "../helpers";
import { formatarPreviewChat } from "../preview";
import { obterResumoOperacionalChat } from "../chat-ux";

type ChatItemProps = {
  chat: ChatUnificado;
  isSelected: boolean;
  onClick: () => void;
};

const STATUS_ICON: Record<string, { icon: React.ReactNode; label: string }> = {
  PENDING: { icon: <Clock3 className="h-2.5 w-2.5" />, label: "Pendente" },
  SENT: { icon: <Check className="h-2.5 w-2.5" />, label: "Enviada" },
  DELIVERED: { icon: <CheckCheck className="h-2.5 w-2.5" />, label: "Recebida" },
  READ: { icon: <CheckCheck className="h-2.5 w-2.5 text-[var(--success)]" />, label: "Lida" },
  PLAYED: { icon: <Volume2 className="h-2.5 w-2.5" />, label: "Reproduzida" },
  DELETED: { icon: <Trash2 className="h-2.5 w-2.5" />, label: "Excluída" },
};

export function ChatItem({ chat, isSelected, onClick }: ChatItemProps) {
  const nome = obterNomeChat(chat);
  const ultimaMsg = chat.ultimaMensagem;
  const timestamp = ultimaMsg?.timestamp;
  const previewMensagem = formatarPreviewChat(ultimaMsg);
  const resumoOperacional = obterResumoOperacionalChat(chat);
  const resumoSecundario = chat.canal === "instagram" ? `Instagram · ${resumoOperacional}` : resumoOperacional;
  const dataAbsoluta = timestamp ? formatarDataAbsolutaChat(timestamp) : "";
  const statusInfo = ultimaMsg?.status ? STATUS_ICON[ultimaMsg.status] : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-2xl border px-3 py-2 text-left transition-colors",
        isSelected
          ? "border-[var(--border-strong)] bg-[var(--surface-elevated)]"
          : "border-transparent bg-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--surface-soft)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[12px] font-medium text-[var(--text-primary)]",
            chat.unreadCount > 0 && "border-[color:rgba(16,185,129,0.24)]",
          )}
        >
          {chat.semMatch ? <MessageCircle className="h-4 w-4" /> : <span>{nome.charAt(0).toUpperCase()}</span>}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-medium text-[var(--text-primary)]">{nome}</span>
            {timestamp ? (
              <span className={cn("shrink-0 text-[10px] font-medium", chat.unreadCount > 0 ? "text-[var(--success)]" : "text-[var(--text-tertiary)]")} title={dataAbsoluta || undefined}>
                {formatarTimestampRelativoChat(timestamp)}
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-[12px] leading-snug text-[var(--text-secondary)]">{previewMensagem}</p>
            {statusInfo ? (
              <span className="shrink-0 flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]" title={statusInfo.label}>
                {statusInfo.icon}
              </span>
            ) : null}
            {chat.unreadCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--success)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {chat.unreadCount}
              </span>
            ) : null}
          </div>

          <p className="mt-1 truncate text-[11px] text-[var(--text-tertiary)]">{resumoSecundario}</p>
        </div>
      </div>
    </button>
  );
}
