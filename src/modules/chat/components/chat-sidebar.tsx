"use client";

import { Search, MessageCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatItem } from "./chat-item";
import type { ChatUnificado } from "../types";

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
}: ChatSidebarProps) {
  return (
    <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-[var(--surface)]">
      <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(139,92,246,0.06),transparent)] px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Chats</h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {totalMatched} em CRM · {totalOrphans} novos · {total} no total
            </p>
          </div>
          {total > 0 ? (
            <span className="rounded-full border border-[color:rgba(139,92,246,0.24)] bg-[var(--brand-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              {chats.length}
            </span>
          ) : null}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar chats..."
            className="h-9 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPill label="Todos" active={filtroOrigem === "todos"} onClick={() => setFiltroOrigem("todos")} />
          <FilterPill label="Anúncio" active={filtroOrigem === "anuncio"} tone="info" onClick={() => setFiltroOrigem("anuncio")} />
          <FilterPill label="WhatsApp" active={filtroOrigem === "whatsapp"} tone="success" onClick={() => setFiltroOrigem("whatsapp")} />
          <FilterPill label="Manual" active={filtroOrigem === "manual"} tone="secondary" onClick={() => setFiltroOrigem("manual")} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPill label={`Sem dono (${totalSemDono})`} active={filtroFila === "sem_dono"} tone="secondary" onClick={() => setFiltroFila("sem_dono")} />
          <FilterPill label={`Sem negócio (${totalSemNegocio})`} active={filtroFila === "sem_negocio"} tone="info" onClick={() => setFiltroFila("sem_negocio")} />
          <FilterPill label="Limpar fila" active={filtroFila === "todas"} onClick={() => setFiltroFila("todas")} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPill label="Todos" active={filtroCanal === "todos"} onClick={() => setFiltroCanal("todos")} />
          <FilterPill label="Instagram" active={filtroCanal === "instagram"} tone="secondary" onClick={() => setFiltroCanal("instagram")} />
          <FilterPill label="WhatsApp" active={filtroCanal === "whatsapp"} tone="success" onClick={() => setFiltroCanal("whatsapp")} />
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
          <div className="flex items-center justify-between gap-3">
            <span>Saúde da sincronização</span>
            <span className={cn("font-medium", sseConectado ? "text-[var(--success)]" : "text-[var(--warning)]")}>
              {sseConectado ? "Online" : "Reconnecting"}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span>Último sync</span>
            <span className="font-medium text-[var(--text-primary)]">
              {ultimoSyncEm ? new Date(ultimoSyncEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </span>
          </div>
          {erro ? <p className="mt-1 text-[var(--danger)]">{erro}</p> : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-2">
        {carregando ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-[var(--surface-elevated)]"
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
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Carregar mais
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type FilterPillProps = {
  label: string;
  active: boolean;
  tone?: "info" | "success" | "secondary";
  onClick: () => void;
};

function FilterPill({ label, active, tone = "secondary", onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
        active
          ? tone === "success"
            ? "border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.14)] text-[var(--success)]"
            : tone === "info"
              ? "border-[color:rgba(56,189,248,0.24)] bg-[color:rgba(56,189,248,0.14)] text-[var(--info)]"
              : "border-[var(--border-strong)] bg-[var(--surface-elevated)] text-[var(--text-primary)]"
          : "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.01)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
      )}
    >
      {label}
    </button>
  );
}
