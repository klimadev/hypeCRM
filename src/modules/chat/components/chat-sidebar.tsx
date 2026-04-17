"use client";

import { useMemo, useState } from "react";
import { Search, MessageCircle, ChevronDown, Activity, Inbox, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatItem } from "./chat-item";
import { ChatNewChatDialog } from "./chat-new-chat-dialog";
import { ChatFiltersContent } from "./chat-filters-content";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ChatUnificado } from "../types";
import type { WhatsappInstancia } from "@/modules/whatsapp/types";

type ChatSidebarProps = {
  chats: ChatUnificado[];
  chatSelecionado: ChatUnificado | null;
  setChatSelecionado: (chat: ChatUnificado | null) => void;
  busca: string;
  setBusca: (termo: string) => void;
  filtroOrigem: "todos" | "anuncio" | "whatsapp" | "manual";
  setFiltroOrigem: (filtro: "todos" | "anuncio" | "whatsapp" | "manual") => void;
  carregando: boolean;
  totalOrphans: number;
  totalMatched: number;
  totalSemDono: number;
  totalSemNegocio: number;
  sseConectado: boolean;
  ultimoSyncEm: number | null;
  erro: string | null;
  filtroFila: "todas" | "sem_dono" | "sem_negocio";
  setFiltroFila: (filtro: "todas" | "sem_dono" | "sem_negocio") => void;
  filtroCanal: "todos" | "whatsapp" | "instagram";
  setFiltroCanal: (filtro: "todos" | "whatsapp" | "instagram") => void;
  temMais: boolean;
  carregarMais: () => void;
  total: number;
  onIniciarNovoChat: (params: { telefone: string; instanceName: string }) => Promise<void>;
  instanciasWhatsapp: WhatsappInstancia[];
  filtrosDockAberto?: boolean;
  onAlternarFiltrosDock?: () => void;
};

export function ChatSidebar({
  chats,
  chatSelecionado,
  setChatSelecionado,
  busca,
  setBusca,
  filtroOrigem,
  setFiltroOrigem,
  carregando,
  totalOrphans,
  totalMatched,
  totalSemDono,
  totalSemNegocio,
  sseConectado,
  ultimoSyncEm,
  erro,
  filtroFila,
  setFiltroFila,
  filtroCanal,
  setFiltroCanal,
  temMais,
  carregarMais,
  total,
  onIniciarNovoChat,
  instanciasWhatsapp,
  filtrosDockAberto,
  onAlternarFiltrosDock,
}: ChatSidebarProps) {
  const [filtrosMobileAbertos, setFiltrosMobileAbertos] = useState(false);
  const [novoChatOpen, setNovoChatOpen] = useState(false);
  const filtrosAtivos = useMemo(
    () => Number(filtroOrigem !== "todos") + Number(filtroFila !== "todas") + Number(filtroCanal !== "todos"),
    [filtroCanal, filtroFila, filtroOrigem],
  );
  const ultimoSyncLabel = ultimoSyncEm
    ? new Date(ultimoSyncEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--surface)]">
      <div className="flex shrink-0 flex-col gap-2.5 border-b border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(139,92,246,0.06),transparent)] px-3 py-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              <Inbox className="h-3.5 w-3.5" />
              Inbox
            </div>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">Conversas</h2>
              {total > 0 ? (
                <span className="rounded-full border border-[color:rgba(139,92,246,0.24)] bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                  {chats.length}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
              {total} ativos, {totalMatched} no CRM e {totalOrphans} novos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium",
                erro
                  ? "border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.12)] text-[var(--danger)]"
                  : sseConectado
                    ? "border-[color:rgba(16,185,129,0.22)] bg-[color:rgba(16,185,129,0.1)] text-[var(--success)]"
                    : "border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.12)] text-[var(--warning)]",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {erro ? "Erro" : sseConectado ? "Online" : "Sync"}
            </span>
            <button
              type="button"
              onClick={() => setNovoChatOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)] bg-[var(--brand-soft)] px-2.5 py-1 text-[10px] font-medium text-[var(--brand)] transition-colors hover:bg-[var(--brand)] hover:text-white"
            >
              <Plus className="h-3 w-3" />
              Nova conversa
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nome, telefone ou negócio"
              className="h-10 w-full rounded-[15px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>

          <>
            <button
              type="button"
              onClick={onAlternarFiltrosDock}
              aria-expanded={Boolean(filtrosDockAberto)}
              className="hidden h-10 shrink-0 items-center gap-2 rounded-[15px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] md:inline-flex"
            >
              <Activity className="h-3.5 w-3.5" />
              Filtros
              {filtrosAtivos > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                  {filtrosAtivos}
                </span>
              ) : null}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", filtrosDockAberto && "rotate-180")} />
            </button>

            <button
              type="button"
              onClick={() => setFiltrosMobileAbertos(true)}
              aria-expanded={filtrosMobileAbertos}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[15px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] md:hidden"
            >
              <Activity className="h-3.5 w-3.5" />
              Filtros
              {filtrosAtivos > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                  {filtrosAtivos}
                </span>
              ) : null}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 pb-1.5 pt-1.5">
        {carregando ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-[18px] bg-[var(--surface-elevated)]"
              />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <MessageCircle className="h-10 w-10 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              {busca
                ? "Nenhum chat encontrado para a busca"
                : "Nenhum chat disponivel"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <ChatItem
                key={`${chat.instanceName}-${chat.remoteJid}`}
                chat={chat}
                isSelected={
                  chatSelecionado?.remoteJid === chat.remoteJid &&
                  chatSelecionado?.instanceName === chat.instanceName
                }
                onClick={() => setChatSelecionado(chat)}
              />
            ))}

            {temMais && !busca && (
              <button
                type="button"
                onClick={carregarMais}
                className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Carregar mais
              </button>
            )}
          </div>
        )}
      </div>

      <ChatNewChatDialog
        open={novoChatOpen}
        onOpenChange={setNovoChatOpen}
        instancias={instanciasWhatsapp}
        onSubmit={onIniciarNovoChat}
      />

      <Sheet open={filtrosMobileAbertos} onOpenChange={setFiltrosMobileAbertos}>
        <SheetContent side="right" className="w-full max-w-sm p-0 md:hidden">
          <SheetHeader className="border-b border-[var(--border-subtle)] bg-[var(--surface)]">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100dvh-5rem)] min-h-0">
            <ChatFiltersContent
              filtroOrigem={filtroOrigem}
              setFiltroOrigem={setFiltroOrigem}
              filtroFila={filtroFila}
              setFiltroFila={setFiltroFila}
              filtroCanal={filtroCanal}
              setFiltroCanal={setFiltroCanal}
              totalOrphans={totalOrphans}
              totalSemDono={totalSemDono}
              totalSemNegocio={totalSemNegocio}
              sseConectado={sseConectado}
              ultimoSyncLabel={ultimoSyncLabel}
              erro={erro}
              filtrosAtivos={filtrosAtivos}
              onFechar={() => setFiltrosMobileAbertos(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
