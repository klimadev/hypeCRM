"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePendenciasGlobais } from "@/modules/kanban/hooks/use-pendencias-globais";
import type { DadosUsuarioLogado } from "@/lib/autenticacao";
import type { SessaoToken } from "@/lib/tipos";
import { construirSecoesNavegacao, gerarIniciais, obterLabelPerfil } from "./navigation/navigation-config";
import { ThemeToggleIcon } from "@/components/theme-toggle";
import { FeedbackTrigger } from "@/components/feedback-trigger";
import { BotaoSair } from "@/components/botao-sair";

type Props = { sessao: SessaoToken; dadosUsuario: DadosUsuarioLogado | null };

const ABAS_PRIMARIAS = new Set(["/resumo", "/leads", "/kanban", "/chat"]);

export function TopNavBar({ sessao, dadosUsuario }: Props) {
  const pathname = usePathname();
  const { resumo } = usePendenciasGlobais();
  const secoes = useMemo(() => construirSecoesNavegacao(sessao), [sessao]);
  const todosItens = useMemo(() => secoes.flatMap((s) => s.itens), [secoes]);

  const primarias = todosItens.filter((i) => ABAS_PRIMARIAS.has(i.href));
  const overflow = todosItens.filter((i) => !ABAS_PRIMARIAS.has(i.href));

  const nomeExibicao = dadosUsuario?.nome?.trim() || "Sem nome";
  const cargoExibicao = dadosUsuario?.cargo?.trim() || obterLabelPerfil(sessao.perfil);
  const iniciaisNome = gerarIniciais(dadosUsuario?.nome, sessao.perfil);
  const badgeCount = resumo?.total ?? 0;

  function estaAtivo(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const ativoOverflow = overflow.some((i) => estaAtivo(i.href));

  return (
    <header className="fixed inset-x-0 top-0 z-30 hidden lg:block">
      <div className="flex h-12 md:h-14 items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-glass)] px-3 md:px-4 backdrop-blur-[12px]">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-3 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--info-alt)] text-[9px] font-bold text-white">
            H
          </div>
          <span className="hidden sm:inline text-sm font-bold text-[var(--text-primary)]">
            HYPE CRM
          </span>
        </div>

        {/* Primary tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {primarias.map((item) => {
            const isAtivo = estaAtivo(item.href);
            const isKanban = item.href === "/kanban";
            const Icone = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-100 shrink-0",
                  isAtivo
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]",
                )}
              >
                <Icone className="h-4 w-4" />
                <span>{item.label}</span>
                {isKanban && badgeCount > 0 && (
                  <Badge variant="warning" size="sm" className="ml-0.5">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </Badge>
                )}
                {isAtivo && (
                  <span className="absolute -bottom-1.5 inset-x-0 mx-auto h-0.5 w-5 rounded-full bg-[var(--brand)]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Overflow menu */}
        {overflow.length > 0 && (
          <Popover>
            <PopoverTrigger
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors duration-100 shrink-0",
                ativoOverflow
                  ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "text-[var(--text-tertiary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]",
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Mais</span>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1.5">
              <div className="space-y-0.5">
                {overflow.map((item) => {
                  const Icone = item.icon;
                  const isAtivo = estaAtivo(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isAtivo
                          ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]",
                      )}
                    >
                      <Icone className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Spacer */}
        <div className="flex-1 min-w-4" />

        {/* User area */}
        <Popover>
          <PopoverTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--surface-elevated)] shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--info-alt)] text-[8px] font-semibold text-white">
              {iniciaisNome}
            </div>
            <span className="hidden md:block text-sm text-[var(--text-secondary)] max-w-[100px] truncate">
              {nomeExibicao}
            </span>
            <ChevronDown className="hidden md:block h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2">
            <div className="mb-2 px-3 py-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{nomeExibicao}</p>
              <p className="text-xs text-[var(--text-tertiary)]">HYPE CRM • {cargoExibicao}</p>
            </div>
            <div className="h-px bg-[var(--border-subtle)] mb-2" />
            <div className="flex items-center justify-center gap-3 px-3 py-1">
              <FeedbackTrigger isLoggedIn={Boolean(sessao.id_usuario)} />
              <ThemeToggleIcon />
              <BotaoSair
                apenasIcone
                className="h-9 w-9 rounded-[13px] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
