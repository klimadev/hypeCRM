"use client";

import { ModulePageShell } from "@/components/shared/module-page-shell";
import { MessageCircle } from "lucide-react";
import { useChatModule } from "./hooks/use-chat-module";
import { ChatSidebar } from "./components/chat-sidebar";
import { ChatPanel } from "./components/chat-panel";
import type { Props } from "./types";
import { cn } from "@/lib/utils";

export function ModuloChat({ perfil, idUsuario }: Props) {
  const vm = useChatModule({ perfil, idUsuario });

  return (
    <ModulePageShell
      spacing="lg"
      fillHeight
      className="flex-1 min-h-0"
    >
      <div className="flex h-full min-h-0 max-h-full gap-2 overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(12,12,14,0.96),rgba(9,9,11,0.98))] lg:gap-1.5">
        <aside
          className={cn(
            "min-h-0 w-full shrink-0 md:w-[18rem] lg:w-[18.5rem] xl:w-[19rem]",
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
            temMais={vm.temMais}
            carregarMais={vm.carregarMais}
            total={vm.total}
          />
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 overflow-hidden border-l border-[var(--border-subtle)] bg-[var(--surface)] md:border-l md:border-r-0">
          {vm.chatSelecionado ? (
            <ChatPanel
              chat={vm.chatSelecionado}
              perfil={vm.perfil}
              onVoltar={() => vm.setChatSelecionado(null)}
              onRegistrarLead={vm.onRegistrarComoLead}
              onCriarNegocio={vm.onCriarNegocio}
              onTransferirLead={vm.onTransferirLead}
            />
          ) : (
            <div className="hidden h-full items-center justify-center p-8 text-center md:flex">
              <div className="max-w-sm space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)]">
                  <MessageCircle className="h-6 w-6 text-[var(--text-tertiary)]" />
                </div>
                <p className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                  Abra uma conversa para começar
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  A lista fica fixa na esquerda e o restante da tela vira o contexto da conversa.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </ModulePageShell>
  );
}
