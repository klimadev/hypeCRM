"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import type { ChatUnificado } from "../types";
import {
  formatarTimestampRelativoChat,
  obterMetaOrigemLead,
  obterNomeChat,
  formatarDataAbsolutaChat,
} from "../helpers";
import { formatarPreviewChat } from "../preview";

type ChatItemProps = {
  chat: ChatUnificado;
  isSelected: boolean;
  onClick: () => void;
};

const TIPO_ICONE: Record<string, string> = {
  imageMessage: "📷",
  videoMessage: "🎥",
  audioMessage: "🎙",
  documentMessage: "📄",
  stickerMessage: "🙂",
  locationMessage: "📍",
  liveLocationMessage: "📍",
  contactMessage: "👤",
  listMessage: "📋",
  buttonsMessage: "🔘",
  templateMessage: "📄",
  orderMessage: "🛒",
  reactionMessage: "💬",
  protocolMessage: "ℹ️",
};

export function ChatItem({ chat, isSelected, onClick }: ChatItemProps) {
  const nome = obterNomeChat(chat);
  const ultimaMsg = chat.ultimaMensagem;
  const timestamp = ultimaMsg?.timestamp;
  const fromMe = ultimaMsg?.fromMe ?? false;
  const kind = ultimaMsg?.kind ?? "";
  const tipoIcone = TIPO_ICONE[kind] || "💬";
  const hasMedia = ultimaMsg?.hasMedia && !ultimaMsg?.conteudo;
  const origemLead = obterMetaOrigemLead(chat.leadMatch?.origem);
  const previewMensagem = formatarPreviewChat(ultimaMsg);
  const canalLabel = chat.canal === "instagram" ? "📸 Instagram" : "💬 WhatsApp";
  const resumoSecundario = chat.semMatch
    ? "Novo contato"
    : chat.leadMatch?.nome_estagio ?? chat.leadMatch?.nome_funcionario ?? "Lead vinculado";
  const dataAbsoluta = timestamp ? formatarDataAbsolutaChat(timestamp) : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-[18px] border px-3 py-2.5 text-left transition-all duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        isSelected
          ? "border-[color:rgba(139,92,246,0.32)] bg-[linear-gradient(180deg,rgba(139,92,246,0.16),rgba(139,92,246,0.08))] shadow-[0_0_0_1px_rgba(139,92,246,0.08)]"
          : "border-transparent bg-[color:rgba(255,255,255,0.01)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold",
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
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{nome}</span>
            <div className="flex shrink-0 items-center gap-1.5">
              {timestamp ? (
                <span className="text-[10px] font-medium text-[var(--text-tertiary)]">
                  {formatarTimestampRelativoChat(timestamp)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
            <span>{canalLabel}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-[var(--border-strong)]" />
            <span className="truncate normal-case tracking-normal text-[var(--text-secondary)]">
              {resumoSecundario}
            </span>
          </div>

          <div className="mt-1.5 flex items-start gap-2">
            <span
              className={cn(
                "shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded text-[11px]",
                fromMe
                  ? "bg-[color:rgba(139,92,246,0.15)] text-[var(--brand)]"
                  : "bg-[color:rgba(16,185,129,0.15)] text-[var(--success)]",
              )}
            >
              {fromMe ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-[12px] leading-snug text-[var(--text-secondary)]">
                {tipoIcone}{" "}
                {hasMedia ? (
                  <span className="text-[var(--text-tertiary)] italic">Mídia</span>
                ) : (
                  previewMensagem
                )}
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {chat.unreadCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                  {chat.unreadCount}
                </span>
              ) : (
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {chat.semMatch ? "Sem vínculo" : fromMe ? "Enviada" : "Recebida"}
                </span>
              )}
              {dataAbsoluta && timestamp ? (
                <span className="text-[9px] text-[var(--text-tertiary)]" title={dataAbsoluta}>
                  · {dataAbsoluta}
                </span>
              ) : null}
            </div>

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