"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import type { ChatUnificado } from "../types";
import {
  formatarTimestampRelativoChat,
  obterMetaOrigemLead,
  obterNomeChat,
} from "../helpers";
import { formatarPreviewChat } from "../preview";

type ChatItemProps = {
  chat: ChatUnificado;
  isSelected: boolean;
  onClick: () => void;
};

export function ChatItem({ chat, isSelected, onClick }: ChatItemProps) {
  const nome = obterNomeChat(chat);
  const timestamp = chat.ultimaMensagem?.timestamp;
  const origemLead = obterMetaOrigemLead(chat.leadMatch?.origem);
  const previewMensagem = formatarPreviewChat(chat.ultimaMensagem);
  const resumoSecundario = chat.semMatch
    ? "Novo contato"
    : chat.leadMatch?.nome_estagio ?? chat.leadMatch?.nome_funcionario ?? "Lead vinculado";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-2xl border px-3 py-2.5 text-left transition-all duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        isSelected
          ? "border-[color:rgba(139,92,246,0.32)] bg-[linear-gradient(180deg,rgba(139,92,246,0.14),rgba(139,92,246,0.08))] shadow-[0_0_0_1px_rgba(139,92,246,0.08)]"
          : "border-transparent bg-[color:rgba(255,255,255,0.01)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
            chat.semMatch
              ? "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-secondary)]"
              : "border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.08)] text-emerald-400",
          )}
        >
          {chat.semMatch ? (
            <MessageCircle className="h-4 w-4" />
          ) : (
            <span>{nome.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                "truncate text-[13px] font-semibold",
                chat.semMatch ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]",
              )}
            >
              {nome}
            </span>
            {timestamp ? (
              <span className="shrink-0 text-[10px] font-medium text-[var(--text-tertiary)]">
                {formatarTimestampRelativoChat(timestamp)}
              </span>
            ) : null}
          </div>

          <p className="mt-1 line-clamp-1 text-[12px] leading-snug text-[var(--text-secondary)]">
            {previewMensagem}
          </p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 text-[11px] text-[var(--text-tertiary)]">
              <span className="truncate">{resumoSecundario}</span>
            </div>

            {chat.unreadCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                {chat.unreadCount}
              </span>
            ) : null}

            {chat.semMatch ? (
              <Badge variant="secondary" size="sm">
                Novo
              </Badge>
            ) : origemLead ? (
              <Badge variant={origemLead.variant} size="sm" dot>
                {origemLead.label}
              </Badge>
            ) : (
              <Badge variant="success" size="sm" dot>
                CRM
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
