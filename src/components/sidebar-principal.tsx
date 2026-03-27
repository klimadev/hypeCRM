"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useTransition, useMemo } from "react";
import {
  BarChart3,
  WalletCards,
  LayoutGrid,
  Settings2,
  Target,
  Users,
  X,
  MessageCircle,
  Zap,
} from "lucide-react";
import { BotaoSair } from "@/components/botao-sair";
import { SessaoToken } from "@/lib/tipos";
import { DadosUsuarioLogado } from "@/lib/autenticacao";
import { cn } from "@/lib/utils";
import { usePendenciasGlobais } from "@/modules/kanban/hooks/use-pendencias-globais";
import { TOUR_TARGETS } from "@/modules/onboarding/lib/selectors";

type ItemMenu = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tourTarget?: string;
  children?: ItemMenu[];
};

type Props = {
  sessao: SessaoToken;
  dadosUsuario: DadosUsuarioLogado | null;
};

type Secao = {
  titulo: string;
  itens: ItemMenu[];
};

const SIGLA_PERFIL: Record<SessaoToken["perfil"], string> = {
  EMPRESA: "ADM",
  GERENTE: "GTE",
  COLABORADOR: "CLB",
};

const LABEL_PERFIL: Record<SessaoToken["perfil"], string> = {
  EMPRESA: "Administrador",
  GERENTE: "Gerente",
  COLABORADOR: "Colaborador",
};

function gerarIniciais(nome: string | undefined, perfil: SessaoToken["perfil"]) {
  const nomeTratado = nome?.trim();
  if (!nomeTratado) return SIGLA_PERFIL[perfil];

  const partesNome = nomeTratado.split(/\s+/).filter(Boolean);
  if (partesNome.length === 1) {
    return partesNome[0].slice(0, 2).toUpperCase();
  }

  return `${partesNome[0][0] ?? ""}${partesNome[partesNome.length - 1][0] ?? ""}`.toUpperCase();
}

function MenuItemComBadge({
  href,
  label,
  icon: Icone,
  ativo,
  resumo,
  onClick,
  tourTarget,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ativo: boolean;
  resumo?: { total: number; porGravidade: Record<string, number> } | null;
  onClick?: () => void;
  tourTarget?: string;
}) {
  const temPendenciaCritica = resumo?.porGravidade.critica && resumo.porGravidade.critica > 0;
  const temPendencia = resumo && resumo.total > 0;

  return (
    <Link
      href={href}
      onClick={onClick}
      data-tour={tourTarget}
      className={cn(
        "relative flex items-center justify-between rounded-[var(--radius-control)] border border-transparent px-3 py-2.5 text-[13px] font-medium tracking-[-0.01em] text-[var(--text-secondary)] transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)] hover:-translate-y-[1px] hover:border-[var(--border-subtle)] hover:bg-white/4 hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-sm)]",
        ativo &&
          "border-[color:rgba(139,92,246,0.22)] bg-[var(--brand-soft)] pl-4 text-[var(--text-primary)] shadow-[0_12px_30px_-22px_rgba(139,92,246,0.7)] hover:border-[color:rgba(139,92,246,0.28)] hover:bg-[color:rgba(139,92,246,0.22)] hover:text-[var(--text-primary)]",
      )}
    >
      <div className="flex items-center gap-2.5">
        {ativo ? <span className="absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[var(--brand)]" /> : null}
        <Icone className={cn("h-4 w-4", ativo && "text-[var(--brand)]")} />
        {label}
      </div>
      {temPendencia && (
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-[#09090b]",
            temPendenciaCritica ? "bg-[var(--danger)]" : "bg-[var(--warning)]",
          )}
        >
          {resumo.total > 99 ? "99+" : resumo.total}
        </span>
      )}
    </Link>
  );
}

export function SidebarPrincipal({ sessao, dadosUsuario }: Props) {
  const pathname = usePathname();
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [, startTransition] = useTransition();
  const [submenuAberto, setSubmenuAberto] = useState<string | null>(
    pathname.startsWith("/equipe") ? "/equipe" : null
  );
  const { resumo } = usePendenciasGlobais();

  const toggleSubmenu = (href: string) => {
    setSubmenuAberto(submenuAberto === href ? null : href);
  };

  const fecharSidebar = () => {
    startTransition(() => {
      setSidebarAberta(false);
    });
  };

  const secoes: Secao[] = useMemo(() => [
    {
      titulo: "GERAL",
      itens: [{ href: "/resumo", label: "Resumo", icon: BarChart3, tourTarget: TOUR_TARGETS.sidebarResumo }],
    },
    {
      titulo: "OPERAÇÃO",
      itens: [
        { href: "/kanban", label: "Leads", icon: LayoutGrid, tourTarget: TOUR_TARGETS.sidebarKanban },
        ...(sessao.perfil === "EMPRESA" ? [{ href: "/recebimentos", label: "Recebimentos", icon: WalletCards }] : []),
        ...(sessao.perfil !== "COLABORADOR"
          ? [
              {
                href: "/equipe",
                label: "Equipe",
                icon: Users,
                tourTarget: TOUR_TARGETS.sidebarEquipe,
                children: [
                  { href: "/equipe/metas", label: "Metas", icon: Target },
                ],
              },
            ]
          : [{ href: "/minhas-metas", label: "Minhas Metas", icon: Target }]),
      ],
    },
    {
      titulo: "SISTEMA",
      itens: [
        ...(sessao.perfil === "EMPRESA" || sessao.perfil === "GERENTE"
          ? [{ href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, tourTarget: TOUR_TARGETS.sidebarWhatsapp }]
          : []),
        ...(sessao.perfil === "EMPRESA" || sessao.perfil === "GERENTE"
          ? [{ href: "/automacoes", label: "Automações", icon: Zap }]
          : []),
        ...(sessao.perfil === "EMPRESA"
          ? [{ href: "/configs", label: "Configurações", icon: Settings2, tourTarget: TOUR_TARGETS.sidebarConfigs }]
          : []),
      ],
    },
  ], [sessao.perfil]);

  const nomeExibicao = dadosUsuario?.nome?.trim() || "Sem nome";
  const cargoExibicao = dadosUsuario?.cargo?.trim() || LABEL_PERFIL[sessao.perfil];
  const iniciaisNome = gerarIniciais(dadosUsuario?.nome, sessao.perfil);
  const nomeEmpresaExibicao = dadosUsuario?.nomeEmpresa?.trim();

  const conteudoSidebar = (
    <div className="relative flex h-full flex-col gap-4 overflow-clip rounded-[28px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.98))] p-4 text-[var(--text-primary)] shadow-[var(--shadow-overlay)] lg:min-h-[calc(100vh-2rem)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_28%)] opacity-80" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <div className="relative flex h-full flex-col gap-4">
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <div className="relative h-10 w-10 overflow-hidden rounded-[14px] border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
            <Image
              src="/logo.png"
              alt="HYPE CRM"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">HYPE CRM</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Operations cockpit</p>
          </div>
        </div>
      </div>

      <nav className="space-y-5">
        {secoes.map((secao) => (
          <div key={secao.titulo} className="space-y-1.5">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              {secao.titulo}
            </p>

            <div className="space-y-1">
              {secao.itens.map((item) => {
                const Icone = item.icon;
                const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const temChildren = item.children && item.children.length > 0;
                const isSubmenuOpen = temChildren && submenuAberto === item.href;

                if (item.href === "/kanban") {
                  return (
                    <MenuItemComBadge
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={Icone}
                      ativo={ativo}
                      resumo={resumo ?? undefined}
                      tourTarget={item.tourTarget}
                      onClick={fecharSidebar}
                      />
                  );
                }

                // Item com submenu (ex: Equipe)
                if (temChildren) {
                  return (
                    <div key={item.href}>
                      <div
                        className={cn(
                           "relative flex w-full items-center justify-between rounded-[var(--radius-control)] border border-transparent px-3 py-2.5 text-[13px] font-medium tracking-[-0.01em] text-[var(--text-secondary)] transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)] hover:-translate-y-[1px] hover:border-[var(--border-subtle)] hover:bg-white/4 hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-sm)]",
                           ativo &&
                             "border-[color:rgba(139,92,246,0.22)] bg-[var(--brand-soft)] pl-4 text-[var(--text-primary)] shadow-[0_12px_30px_-22px_rgba(139,92,246,0.7)] hover:border-[color:rgba(139,92,246,0.28)] hover:bg-[color:rgba(139,92,246,0.22)] hover:text-[var(--text-primary)]",
                         )}
                       >
                        <Link
                          href={item.href}
                          onClick={fecharSidebar}
                          data-tour={item.tourTarget}
                          className="flex flex-1 items-center gap-2.5"
                        >
                           {ativo ? <span className="absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[var(--brand)]" /> : null}
                           <Icone className={cn("h-4 w-4", ativo && "text-[var(--brand)]")} />
                           {item.label}
                         </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSubmenu(item.href);
                          }}
                          className="rounded-[var(--radius-control)] p-1 text-[var(--text-tertiary)] transition-[background-color,color,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                        >
                          <span
                            className={cn(
                              "block h-4 w-4 rounded-sm border-b-2 border-r-2 border-current transition-transform duration-[var(--duration-fast)] ease-[var(--ease-snappy)]",
                              isSubmenuOpen ? "translate-y-[2px] rotate-45" : "-translate-y-[1px] rotate-[225deg]",
                            )}
                          />
                        </button>
                      </div>

                      {/* Sub-itens */}
                      {isSubmenuOpen && (
                        <div className="ml-4 mt-1 space-y-1 border-l border-[var(--border-subtle)] pl-3">
                          {item.children!.map((child) => {
                            const ChildIcon = child.icon;
                            const childAtivo = pathname === child.href || pathname.startsWith(`${child.href}/`);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={fecharSidebar}
                                className={cn(
                                  "relative flex items-center gap-2.5 rounded-[var(--radius-control)] border border-transparent px-3 py-2 text-[13px] font-medium tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-productive)]",
                                  childAtivo
                                    ? "border-[color:rgba(139,92,246,0.18)] bg-[color:rgba(139,92,246,0.16)] text-[var(--text-primary)]"
                                    : "text-[var(--text-tertiary)] hover:border-[var(--border-subtle)] hover:bg-white/4 hover:text-[var(--text-secondary)]",
                                )}
                              >
                                <ChildIcon className={cn("h-3.5 w-3.5", childAtivo && "text-[var(--brand)]")} />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Item normal sem submenu
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={fecharSidebar}
                    data-tour={item.tourTarget}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-[var(--radius-control)] border border-transparent px-3 py-2.5 text-[13px] font-medium tracking-[-0.01em] text-[var(--text-secondary)] transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)] hover:-translate-y-[1px] hover:border-[var(--border-subtle)] hover:bg-white/4 hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-sm)]",
                      ativo &&
                        "border-[color:rgba(139,92,246,0.22)] bg-[var(--brand-soft)] pl-4 text-[var(--text-primary)] shadow-[0_12px_30px_-22px_rgba(139,92,246,0.7)] hover:border-[color:rgba(139,92,246,0.28)] hover:bg-[color:rgba(139,92,246,0.22)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    {ativo ? <span className="absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[var(--brand)]" /> : null}
                    <Icone className={cn("h-4 w-4", ativo && "text-[var(--brand)]")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-[24px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-3 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:rgba(139,92,246,0.24)] bg-[linear-gradient(135deg,rgba(139,92,246,0.9),rgba(34,211,238,0.7))] text-sm font-semibold uppercase text-[#09090b] shadow-[0_18px_34px_-22px_rgba(139,92,246,0.75)]">
            {iniciaisNome}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium tracking-[-0.01em] text-[var(--text-primary)]">
              {nomeExibicao}
            </p>
            <div className="flex items-center gap-2">
              <p className="truncate text-[10px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{cargoExibicao}</p>
              <span className="rounded-full border border-[var(--border-subtle)] bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                {SIGLA_PERFIL[sessao.perfil]}
              </span>
            </div>
            {nomeEmpresaExibicao && (
              <div className="mt-1 flex items-center gap-1">
                <span className="rounded-full border border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.14)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--success)]">
                  {nomeEmpresaExibicao.length > 20
                    ? nomeEmpresaExibicao.substring(0, 20) + "..."
                    : nomeEmpresaExibicao}
                </span>
              </div>
            )}
          </div>

          <BotaoSair apenasIcone className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="w-full lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-72 lg:shrink-0 lg:self-start lg:p-4">
        <div className="hidden lg:block">{conteudoSidebar}</div>

        {sidebarAberta && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-[var(--surface-overlay)] backdrop-blur-sm"
              onClick={fecharSidebar}
            />
            <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] p-4">
              <button
                type="button"
                onClick={fecharSidebar}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-glass)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] backdrop-blur-md"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
              {conteudoSidebar}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
