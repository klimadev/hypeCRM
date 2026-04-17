"use client";

import { useMemo, useState } from "react";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { MessageCircle } from "lucide-react";
import { useChatModule } from "./hooks/use-chat-module";
import { ChatSidebar } from "./components/chat-sidebar";
import { ChatPanel } from "./components/chat-panel";
import { ChatFiltersContent } from "./components/chat-filters-content";
import type { Props } from "./types";
import { cn } from "@/lib/utils";

export function ModuloChat({ perfil, idUsuario }: Props) {
  const vm = useChatModule({ perfil, idUsuario });
  const [filtrosDockAberto, setFiltrosDockAberto] = useState(false);
  const filtrosAtivos = useMemo(
    () => Number(vm.filtroOrigem !== "todos") + Number(vm.filtroFila !== "todas") + Number(vm.filtroCanal !== "todos"),
    [vm.filtroCanal, vm.filtroFila, vm.filtroOrigem],
  );
  const ultimoSyncLabel = vm.ultimoSyncEm
    ? new Date(vm.ultimoSyncEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <ModulePageShell
      spacing="md"
      className="flex h-[calc(100dvh-6.25rem)] min-h-0 flex-col overflow-hidden lg:h-[calc(100dvh-1.5rem)] xl:h-[calc(100dvh-2rem)]"
    >
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(12,12,14,0.98),rgba(9,9,11,1))] shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
        <aside
          className={cn(
            "h-full min-h-0 w-full shrink-0 overflow-hidden md:w-[18rem] xl:w-[19.5rem] 2xl:w-[21rem]",
            vm.chatSelecionado ? "hidden md:block" : "block",
          )}
        >
          <ChatSidebar
            chats={vm.chats}
            chatSelecionado={vm.chatSelecionado}
            setChatSelecionado={vm.setChatSelecionado}
            busca={vm.busca}
            setBusca={vm.setBusca}
            filtroOrigem={vm.filtroOrigem}
            setFiltroOrigem={vm.setFiltroOrigem}
            carregando={vm.carregando}
            totalOrphans={vm.totalOrphans}
            totalMatched={vm.totalMatched}
            totalSemDono={vm.totalSemDono}
            totalSemNegocio={vm.totalSemNegocio}
            sseConectado={vm.sseConectado}
            ultimoSyncEm={vm.ultimoSyncEm}
            erro={vm.erro}
            filtroFila={vm.filtroFila}
            setFiltroFila={vm.setFiltroFila}
            filtroCanal={vm.filtroCanal}
            setFiltroCanal={vm.setFiltroCanal}
            filtroCategoria={vm.filtroCategoria}
            setFiltroCategoria={vm.setFiltroCategoria}
            categoriaContagens={vm.categoriaContagens}
            temMais={vm.temMais}
            carregarMais={vm.carregarMais}
            total={vm.total}
            onIniciarNovoChat={vm.onIniciarNovoChat}
            instanciasWhatsapp={vm.instanciasWhatsapp}
            recarregar={vm.recarregar}
            recarregandoInbox={vm.recarregandoInbox}
            filtrosDockAberto={filtrosDockAberto}
            onAlternarFiltrosDock={() => setFiltrosDockAberto((current) => !current)}
          />
        </aside>

        <div
          className={cn(
            "hidden min-h-0 shrink-0 overflow-hidden border-l border-[var(--border-subtle)] transition-[width,opacity] duration-200 ease-[var(--ease-productive)] md:block",
            filtrosDockAberto ? "w-[360px] opacity-100" : "w-0 opacity-0",
          )}
          aria-hidden={!filtrosDockAberto}
        >
          {filtrosDockAberto ? (
            <ChatFiltersContent
              filtroOrigem={vm.filtroOrigem}
              setFiltroOrigem={vm.setFiltroOrigem}
              filtroFila={vm.filtroFila}
              setFiltroFila={vm.setFiltroFila}
              filtroCanal={vm.filtroCanal}
              setFiltroCanal={vm.setFiltroCanal}
              totalOrphans={vm.totalOrphans}
              totalSemDono={vm.totalSemDono}
              totalSemNegocio={vm.totalSemNegocio}
              sseConectado={vm.sseConectado}
              ultimoSyncLabel={ultimoSyncLabel}
              erro={vm.erro}
              filtrosAtivos={filtrosAtivos}
              onFechar={() => setFiltrosDockAberto(false)}
            />
          ) : null}
        </div>

        <section className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-[var(--surface)]/90 backdrop-blur-sm md:border-l md:border-[var(--border-subtle)]">
          {vm.chatSelecionado ? (
            <ChatPanel
              key={`${vm.chatSelecionado.instanceName}:${vm.chatSelecionado.remoteJid}`}
              chat={vm.chatSelecionado}
              perfil={vm.perfil}
              onVoltar={() => vm.setChatSelecionado(null)}
              onRegistrarLead={vm.onRegistrarComoLead}
              onCriarNegocio={vm.onCriarNegocio}
              onTransferirLead={vm.onTransferirLead}
            />
          ) : (
            <div className="hidden h-full items-center justify-center p-8 text-center md:flex">
              <div className="max-w-md space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(139,92,246,0.12),rgba(255,255,255,0.03))]">
                  <MessageCircle className="h-6 w-6 text-[var(--text-tertiary)]" />
                </div>
                <p className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                  Caixa unificada pronta para operar
                </p>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  Selecione um contato para ler, responder ou agendar sem perder o contexto do CRM.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </ModulePageShell>
  );
}
