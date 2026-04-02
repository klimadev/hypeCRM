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
  const nomeEmpresaExibicao = dadosUsuario?.nomeEmpresa?.trim();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[4.75rem] shrink-0 p-2 lg:block xl:w-[18rem]">
      <div className="relative flex h-full flex-col rounded-[24px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.98))] p-3 shadow-[var(--shadow-overlay)] xl:p-4">
        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_28%)] opacity-80" />
        <div className="relative flex items-center gap-3 pb-4">
          <div className="relative h-10 w-10 overflow-hidden rounded-[14px] border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
            <Image src="/logo.png" alt="HYPE CRM" fill className="object-cover" />
          </div>
          <div className="hidden min-w-0 xl:block">
            <p className="text-sm font-semibold text-[var(--text-primary)]">HYPE CRM</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Operação dark premium</p>
          </div>
        </div>
        <nav className="relative flex flex-1 flex-col gap-4 overflow-y-auto pr-1" aria-label="Navegação principal">
          {secoes.map((secao) => (
            <SidebarNavSection key={secao.titulo} section={secao} expanded={true} pathname={pathname} onNavigate={onNavigate} resumo={resumo ?? undefined} />
          ))}
        </nav>
        <div className="relative mt-auto space-y-3 pt-3">
          <div className="flex items-center gap-3 rounded-[20px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-3">
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:rgba(139,92,246,0.3)] bg-[linear-gradient(135deg,rgba(139,92,246,0.9),rgba(34,211,238,0.7))] text-[11px] font-semibold uppercase text-[#09090b] shadow-[0_12px_24px_-10px_rgba(139,92,246,0.6)]" aria-label={`${nomeExibicao}, ${cargoExibicao}`}>
              {iniciaisNome}
            </button>
            <div className="hidden min-w-0 flex-1 xl:block">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{nomeExibicao}</p>
              <p className="truncate text-[11px] text-[var(--text-secondary)]">{cargoExibicao}</p>
              {nomeEmpresaExibicao ? <p className="truncate text-[10px] text-[var(--text-tertiary)]">{nomeEmpresaExibicao}</p> : null}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" className="hidden flex-1 xl:inline-flex">Perfil</Button>
            <BotaoSair apenasIcone className={cn("h-9 w-9 rounded-lg", "xl:w-auto xl:flex-1")} />
          </div>
        </div>
      </div>
    </aside>
  );
}
