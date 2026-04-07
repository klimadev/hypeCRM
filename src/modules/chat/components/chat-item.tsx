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
  const canalLabel = chat.canal === "instagram" ? "Instagram" : "WhatsApp";
  const resumoSecundario = chat.semMatch
    ? "Novo contato"
    : chat.leadMatch?.nome_estagio ?? chat.leadMatch?.nome_funcionario ?? "Lead vinculado";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-[18px] border px-2.5 py-2 text-left transition-all duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        isSelected
          ? "border-[color:rgba(139,92,246,0.32)] bg-[linear-gradient(180deg,rgba(139,92,246,0.16),rgba(139,92,246,0.08))] shadow-[0_0_0_1px_rgba(139,92,246,0.08)]"
          : "border-transparent bg-[color:rgba(255,255,255,0.01)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
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
            <span className="truncate text-[12.5px] font-semibold text-[var(--text-primary)]">{nome}</span>
            {timestamp ? (
              <span className="shrink-0 text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                {formatarTimestampRelativoChat(timestamp)}
              </span>
            ) : null}
          </div>

          <div className="mt-0.5 flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            <span>{canalLabel}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--border-strong)]" />
            <span className="truncate normal-case tracking-normal text-[10px] text-[var(--text-secondary)]">{resumoSecundario}</span>
          </div>

          <p className="mt-1 line-clamp-1 text-[11px] leading-snug text-[var(--text-secondary)]">
            {previewMensagem}
          </p>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            {chat.unreadCount > 0 ? (
              <span className="inline-flex min-w-4.5 items-center justify-center rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--brand)]">
                {chat.unreadCount}
              </span>
            ) : (
              <span className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                {chat.semMatch ? "Sem vínculo" : "Em acompanhamento"}
              </span>
            )}

            {chat.semMatch ? (
              <Badge variant="secondary" size="sm" className="px-2 py-0.5 text-[9px]">
                Novo
              </Badge>
            ) : origemLead ? (
              <Badge variant={origemLead.variant} size="sm" className="px-2 py-0.5 text-[9px]" dot>
                {origemLead.label}
              </Badge>
            ) : (
              <Badge variant="success" size="sm" className="px-2 py-0.5 text-[9px]" dot>
                CRM
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
