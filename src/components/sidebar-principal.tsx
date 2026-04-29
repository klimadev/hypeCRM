"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { PanelTopClose } from "lucide-react";
import { BotaoSair } from "@/components/botao-sair";
import { ThemeToggleIcon } from "@/components/theme-toggle";
import { FeedbackTrigger } from "@/components/feedback-trigger";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
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
  const [expandida, setExpandida] = useState(false);
  const perfilExibicao = obterLabelPerfil(sessao.perfil);
  const onNavigate = () => undefined;

  const nomeExibicao = dadosUsuario?.nome?.trim() || "Sem nome";
  const cargoExibicao = dadosUsuario?.cargo?.trim() || perfilExibicao;
  const iniciaisNome = gerarIniciais(dadosUsuario?.nome, sessao.perfil);

  return (
    <aside className="fixed left-4 top-4 bottom-4 z-40 hidden lg:block">
      <div
        data-expanded={expandida ? "true" : "false"}
        className={cn(
          "dashboard-sidebar-dock relative flex h-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[30px] border border-[color:var(--sidebar-dock-border)] bg-[var(--surface-glass)] p-2.5 shadow-[var(--shadow-xl)] backdrop-blur-[12px] transform-gpu transition-[width,transform,box-shadow,background-color,border-color] duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.1)] will-change-[width,transform]",
          expandida ? "w-[var(--sidebar-dock-expanded-width)]" : "w-[var(--sidebar-dock-collapsed-width)]",
        )}
        onMouseEnter={() => setExpandida(true)}
        onMouseLeave={() => setExpandida(false)}
        onFocusCapture={() => setExpandida(true)}
        onBlurCapture={(event) => {
          const proximoFoco = event.relatedTarget;

          if (!(proximoFoco instanceof Node) || !event.currentTarget.contains(proximoFoco)) {
            setExpandida(false);
          }
        }}
      >
        <div
          className={cn(
            "flex items-center rounded-[22px] border border-[color:rgba(255,255,255,0.08)] bg-[color:rgba(255,255,255,0.04)] transition-[padding,background-color,border-color] duration-200 ease-[var(--ease-productive)]",
            expandida ? "gap-3 px-2.5 py-2.5" : "justify-center border-transparent bg-transparent px-0 py-0",
          )}
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            title={`${nomeExibicao} • ${cargoExibicao}`}
            aria-label={`${nomeExibicao}, ${cargoExibicao}`}
            className="h-10 w-10 shrink-0 rounded-full border-[var(--brand)] bg-[linear-gradient(135deg,var(--brand),var(--info-alt))] text-[10px] font-semibold uppercase text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] hover:brightness-105"
          >
            {iniciaisNome}
          </Button>
          {expandida ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{nomeExibicao}</p>
              <p className="truncate text-xs text-[var(--text-tertiary)]">HYPE CRM • {cargoExibicao}</p>
            </div>
          ) : null}
        </div>

        <nav className="sidebar-scroll-invisible mt-4 flex w-full flex-1 flex-col gap-3 overflow-y-auto pr-1" aria-label="Navegação principal">
          {secoes.map((secao) => (
            <SidebarNavSection key={secao.titulo} section={secao} expanded={expandida} pathname={pathname} onNavigate={onNavigate} resumo={resumo ?? undefined} />
          ))}
        </nav>

        <div className="mt-auto flex w-full flex-col gap-2 pt-3">
          {expandida ? (
            <div className="grid grid-cols-3 items-center gap-2">
              <FeedbackTrigger isLoggedIn={Boolean(sessao?.id_usuario)} />
              <ThemeToggleIcon />
              <BotaoSair
                apenasIcone
                className="h-9 w-9 rounded-[13px] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
              />
            </div>
          ) : (
            <Popover>
              <Tooltip content="Ações rápidas" side="right">
                <span>
                  <PopoverTrigger
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[13px] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] transition-[border-color,background-color,color,transform] duration-200 hover:-translate-y-px hover:border-[var(--brand-ring)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
                    aria-label="Abrir ações rápidas"
                  >
                    <PanelTopClose className="h-4 w-4" />
                  </PopoverTrigger>
                </span>
              </Tooltip>
              <PopoverContent className="w-44 p-2">
                <div className="grid grid-cols-3 gap-2">
                  <FeedbackTrigger isLoggedIn={Boolean(sessao?.id_usuario)} />
                  <ThemeToggleIcon />
                  <BotaoSair
                    apenasIcone
                    className="h-9 w-9 rounded-[13px] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
                  />
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </aside>
  );
}
