"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { BotaoSair } from "@/components/botao-sair";
import { cn } from "@/lib/utils";
import { usePendenciasGlobais } from "@/modules/kanban/hooks/use-pendencias-globais";
import type { DadosUsuarioLogado } from "@/lib/autenticacao";
import type { SessaoToken } from "@/lib/tipos";
import { construirSecoesNavegacao, gerarIniciais, obterLabelPerfil } from "./navigation/navigation-config";
import { SidebarNavSection } from "./navigation/sidebar-nav-section";

type Props = { sessao: SessaoToken; dadosUsuario: DadosUsuarioLogado | null };

export function SidebarPrincipal({ sessao, dadosUsuario }: Props) {
  const pathname = usePathname();
  const { resumo } = usePendenciasGlobais();
  const secoes = useMemo(() => construirSecoesNavegacao(sessao), [sessao]);
  const perfilExibicao = obterLabelPerfil(sessao.perfil);
  const onNavigate = () => undefined;

  const nomeExibicao = dadosUsuario?.nome?.trim() || "Sem nome";
  const cargoExibicao = dadosUsuario?.cargo?.trim() || perfilExibicao;
  const iniciaisNome = gerarIniciais(dadosUsuario?.nome, sessao.perfil);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[4.5rem] shrink-0 border-r border-[var(--border-subtle)] bg-[var(--canvas)] lg:block">
      <div className="flex h-full flex-col items-center px-1.5 py-2.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <div className="relative h-9 w-9 overflow-hidden rounded-[13px] border border-white/10 bg-[var(--surface-elevated)]">
            <Image src="/logo.png" alt="HYPE CRM" fill className="object-cover" />
          </div>
        </div>

        <nav className="mt-3 flex w-full flex-1 flex-col gap-3 overflow-y-auto px-0.5" aria-label="Navegação principal">
          {secoes.map((secao) => (
            <SidebarNavSection key={secao.titulo} section={secao} expanded={false} pathname={pathname} onNavigate={onNavigate} resumo={resumo ?? undefined} />
          ))}
        </nav>

        <div className="mt-auto flex w-full flex-col items-center gap-1.5 pt-2.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            title={`${nomeExibicao} • ${cargoExibicao}`}
            aria-label={`${nomeExibicao}, ${cargoExibicao}`}
            className="h-10 w-10 rounded-full border-[color:rgba(139,92,246,0.3)] bg-[linear-gradient(135deg,rgba(139,92,246,0.9),rgba(34,211,238,0.7))] text-[10px] font-semibold uppercase text-[#09090b] shadow-[0_12px_24px_-10px_rgba(139,92,246,0.6)] hover:bg-[linear-gradient(135deg,rgba(139,92,246,0.95),rgba(34,211,238,0.76))]"
          >
            {iniciaisNome}
          </Button>
          <BotaoSair
            apenasIcone
            className={cn(
              "h-9 w-9 rounded-[13px] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]",
            )}
          />
        </div>
      </div>
    </aside>
  );
}
