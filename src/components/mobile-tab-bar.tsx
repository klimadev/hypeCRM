"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Blocks, LayoutGrid, MessageCircle, MoreHorizontal, Settings2, Target, Users, WalletCards, MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggleRow } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { usePendenciasGlobais } from "@/modules/kanban/hooks/use-pendencias-globais";
import { obterItemIntegracoesNavegacao, podeExibirIntegracoesNaNavegacao } from "@/modules/integracoes/navegacao";
import type { SessaoToken } from "@/lib/tipos";

type TabConfig = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: string[];
};

type MobileTabBarProps = {
  perfil: SessaoToken["perfil"];
  isSuperAdmin?: boolean;
};

function getActiveTabIndex(pathname: string, _perfil: SessaoToken["perfil"]): number {
  if (pathname.startsWith("/resumo")) return 0;
  if (pathname.startsWith("/leads")) return 1;
  if (pathname.startsWith("/kanban")) return 2;
  if (
    pathname.startsWith("/recebimentos") ||
    pathname.startsWith("/equipe") ||
    pathname.startsWith("/minhas-metas") ||
    pathname.startsWith("/qr-code")
  ) return 3;
  return 4;
}

export function MobileTabBar({ perfil, isSuperAdmin }: MobileTabBarProps) {
  const pathname = usePathname();
  const { resumo } = usePendenciasGlobais();
  const badgeCount = resumo?.total ?? 0;
  const ativo = getActiveTabIndex(pathname, perfil);
  const itemIntegracoes = obterItemIntegracoesNavegacao();

  const quartaTab: TabConfig = perfil === "EMPRESA"
    ? { href: "/recebimentos", label: "Caixa", icon: WalletCards, match: ["/recebimentos", "/qr-code"] }
    : perfil !== "COLABORADOR"
      ? { href: "/equipe", label: "Equipe", icon: Users, match: ["/equipe"] }
      : { href: "/minhas-metas", label: "Metas", icon: Target, match: ["/minhas-metas"] };

  const tabs: TabConfig[] = [
    { href: "/resumo", label: "Resumo", icon: BarChart3, match: ["/resumo"] },
    { href: "/leads", label: "Leads", icon: Users, match: ["/leads"] },
    { href: "/kanban", label: "Negócios", icon: LayoutGrid, match: ["/kanban"] },
    quartaTab,
  ];

  const itensMais: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    ...(podeExibirIntegracoesNaNavegacao(perfil) ? [{ href: itemIntegracoes.href, label: itemIntegracoes.label, icon: Blocks }] : []),
    ...(perfil === "EMPRESA" || perfil === "GERENTE" ? [{ href: "/whatsapp", label: "WhatsApp", icon: MessageCircle }] : []),
    ...(perfil === "EMPRESA" ? [{ href: "/configs", label: "Ajustes", icon: Settings2 }] : []),
  ];

  return (
    <nav data-tab-bar className="fixed bottom-0 left-0 right-0 z-[var(--z-tab-bar)] lg:hidden" aria-label="Navegação principal móvel">
      <div
        className="flex items-center justify-around gap-1 border-t border-[var(--border-subtle)] bg-[var(--surface-glass)] px-2 pt-2 backdrop-blur-[20px]"
        style={{ height: "calc(var(--tab-bar-height) + env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex w-full max-w-lg items-center justify-around gap-1">
          {tabs.map((tab, i) => {
            const isActive = ativo === i;
            const Icone = tab.icon;
            const showBadge = i === 2 && badgeCount > 0;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-[13px] px-3 py-1.5 text-[10px] font-medium transition-colors duration-100 active:scale-[0.92] motion-reduce:active:scale-100",
                  isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]",
                )}
                style={{ minWidth: 48, minHeight: 44 }}
              >
                <span className="relative">
                  <Icone className={cn("h-5 w-5", isActive && "text-[var(--brand)]")} />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[9px] font-bold text-white leading-none">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
                {isActive && (
                  <span className="mx-auto mt-0.5 h-1 w-1 rounded-full bg-[var(--brand)]" aria-hidden="true" />
                )}
              </Link>
            );
          })}

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-[13px] px-3 py-1.5 text-[10px] font-medium transition-colors duration-100 active:scale-[0.92] motion-reduce:active:scale-100",
                  ativo === 4 ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]",
                )}
                style={{ minWidth: 48, minHeight: 44 }}
              >
                <MoreHorizontal className={cn("h-5 w-5", ativo === 4 && "text-[var(--brand)]")} />
                <span>Mais</span>
                {ativo === 4 && (
                  <span className="mx-auto mt-0.5 h-1 w-1 rounded-full bg-[var(--brand)]" aria-hidden="true" />
                )}
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-[24px] border-t border-[var(--border-subtle)] bg-[var(--surface-glass)] backdrop-blur-[20px] pb-[env(safe-area-inset-bottom,0px)]"
            >
              <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--text-tertiary)]" />

              <div className="px-2">
                <ThemeToggleRow />
              </div>

              {itensMais.length > 0 && (
                <div className="mt-4 space-y-1 px-2">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Acesso rápido
                  </p>
                  {itensMais.map((item) => {
                    const Icone = item.icon;
                    const itemAtivo = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] border px-4 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:active:scale-100",
                          itemAtivo
                            ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--text-primary)]"
                            : "border-[var(--border-subtle)] text-[var(--text-secondary)]",
                        )}
                      >
                        <Icone className={cn("h-4 w-4", itemAtivo && "text-[var(--brand)]")} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {isSuperAdmin && (
                <>
                  <div className="mx-2 my-2 h-px bg-[var(--border-subtle)]" />
                  <div className="mt-2 space-y-1 px-2">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--warning)]">
                      Super Admin
                    </p>
                    {[
                      { href: "/super-admin/usuarios", label: "Usuários", icon: Blocks },
                      { href: "/super-admin/feedbacks", label: "Feedbacks", icon: MessageSquare },
                    ].map((item) => {
                      const Icone = item.icon;
                      const itemAtivo = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] border px-4 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:active:scale-100",
                            itemAtivo
                              ? "border-[var(--warning)] bg-[color:rgba(245,158,11,0.12)] text-[var(--warning)]"
                              : "border-[var(--border-subtle)] text-[var(--text-secondary)]",
                          )}
                        >
                          <Icone className={cn("h-4 w-4", itemAtivo && "text-[var(--warning)]")} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
