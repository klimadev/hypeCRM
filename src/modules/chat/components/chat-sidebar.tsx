"use client";

import { useMemo, useState } from "react";
import { Search, MessageCircle, ChevronDown, Activity, Plus, RotateCw, Inbox, MailOpen, Briefcase, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatItem } from "./chat-item";
import { ChatNewChatDialog } from "./chat-new-chat-dialog";
import { ChatFiltersContent } from "./chat-filters-content";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip } from "@/components/ui/tooltip";
import type { ChatCategoriaContagens, ChatCategoriaInbox, ChatUnificado } from "../types";
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
  filtroCategoria: ChatCategoriaInbox;
  setFiltroCategoria: (categoria: ChatCategoriaInbox) => void;
  categoriaContagens: ChatCategoriaContagens;
  temMais: boolean;
  carregarMais: () => void;
  total: number;
  onIniciarNovoChat: (params: { telefone: string; instanceName: string }) => Promise<void>;
  instanciasWhatsapp: WhatsappInstancia[];
  recarregar: () => Promise<void>;
  recarregandoInbox: boolean;
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
  filtroCategoria,
  setFiltroCategoria,
  categoriaContagens,
  temMais,
  carregarMais,
  total,
  onIniciarNovoChat,
  instanciasWhatsapp,
  recarregar,
  recarregandoInbox,
  filtrosDockAberto,
  onAlternarFiltrosDock,
}: ChatSidebarProps) {
  const [filtrosMobileAbertos, setFiltrosMobileAbertos] = useState(false);
  const [novoChatOpen, setNovoChatOpen] = useState(false);
  const filtrosAtivos = useMemo(
    () => Number(filtroOrigem !== "todos") + Number(filtroFila !== "todas") + Number(filtroCanal !== "todos") + Number(filtroCategoria !== "todas"),
    [filtroCanal, filtroCategoria, filtroFila, filtroOrigem],
  );

  const categoriasRapidas: Array<{
    id: Exclude<ChatCategoriaInbox, "todas">;
    label: string;
    count: number;
    icon: React.ElementType;
  }> = [
    { id: "em_aberto", label: "Em aberto", count: categoriaContagens.em_aberto, icon: Inbox },
    { id: "nao_lidas", label: "Não lidas", count: categoriaContagens.nao_lidas, icon: MailOpen },
    { id: "sem_negocio", label: "Sem negócio", count: categoriaContagens.sem_negocio, icon: Briefcase },
    { id: "com_negocio", label: "Com negócio", count: categoriaContagens.com_negocio, icon: CheckCircle },
  ];
  const ultimoSyncLabel = ultimoSyncEm
    ? new Date(ultimoSyncEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--surface)]">
      <div className="flex shrink-0 flex-col gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-soft)] px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-medium text-[var(--text-primary)]">Conversas</h2>
              {total > 0 ? <span className="text-[11px] text-[var(--text-tertiary)]">{total}</span> : null}
            </div>
            <div className={cn("mt-0.5 inline-flex items-center gap-1.5 text-[10px]", erro ? "text-[var(--danger)]" : sseConectado ? "text-[var(--text-tertiary)]" : "text-[var(--warning)]")}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span>{erro ? "Erro na sincronização" : sseConectado ? `Atualizado ${ultimoSyncLabel}` : `Sincronizando ${ultimoSyncLabel}`}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip content={`Atualizar inbox (${ultimoSyncLabel})`}>
              <button
                type="button"
                onClick={() => void recarregar()}
                disabled={recarregandoInbox || carregando}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Atualizar inbox"
              >
                <RotateCw className={cn("h-3.5 w-3.5", recarregandoInbox && "animate-spin")} />
              </button>
            </Tooltip>
            <Tooltip content="Nova conversa">
              <button
                type="button"
                onClick={() => setNovoChatOpen(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
                aria-label="Nova conversa"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar conversa"
              className="h-9 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] pl-10 pr-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>

          <>
            <button
              type="button"
              onClick={onAlternarFiltrosDock}
              aria-expanded={Boolean(filtrosDockAberto)}
              className="relative hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] md:inline-flex"
            >
              <Activity className="h-3.5 w-3.5" />
              {filtrosAtivos > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--brand)] px-1 py-0.5 text-[9px] font-semibold text-white">
                  {filtrosAtivos}
                </span>
              ) : null}
              <ChevronDown className={cn("absolute bottom-1 right-1 h-3 w-3 transition-transform", filtrosDockAberto && "rotate-180")} />
            </button>

            <button
              type="button"
              onClick={() => setFiltrosMobileAbertos(true)}
              aria-expanded={filtrosMobileAbertos}
              className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] md:hidden"
            >
              <Activity className="h-3.5 w-3.5" />
              {filtrosAtivos > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--brand)] px-1 py-0.5 text-[9px] font-semibold text-white">
                  {filtrosAtivos}
                </span>
              ) : null}
              <ChevronDown className="absolute bottom-1 right-1 h-3 w-3" />
            </button>
          </>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {categoriasRapidas.map((categoria) => {
            const Icon = categoria.icon;
            const ativo = filtroCategoria === categoria.id;

            return (
              <Tooltip
                key={categoria.id}
                content={
                  <>
                    <div>{categoria.label}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{categoria.count} conversa(s)</div>
                  </>
                }
              >
                <button
                  type="button"
                  onClick={() => setFiltroCategoria(ativo ? "todas" : categoria.id)}
                  className={cn(
                    "group relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                    ativo
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                      : "border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]",
                  )}
                  aria-label={`${categoria.label}: ${categoria.count}`}
                >
                  <Icon className="h-4 w-4" />
                  {categoria.count > 0 ? (
                    <span
                      className={cn(
                        "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border px-1 text-[9px] font-semibold",
                        ativo
                          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                          : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]",
                      )}
                    >
                      {categoria.count > 99 ? "99+" : categoria.count}
                    </span>
                  ) : null}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 pb-1.5 pt-1">
        {carregando ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl bg-[var(--surface-elevated)]"
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
