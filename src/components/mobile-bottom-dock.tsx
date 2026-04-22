"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { BarChart3, Blocks, LayoutGrid, MessageCircle, MessageSquare, Settings2, Target, WalletCards, Users, MoreHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggleRow } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { obterItemIntegracoesNavegacao, podeExibirIntegracoesNaNavegacao } from "@/modules/integracoes/navegacao";
import type { SessaoToken } from "@/lib/tipos";

type DockItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type MobileBottomDockProps = {
  perfil: SessaoToken["perfil"];
  isSuperAdmin?: boolean;
};

function obterItensDock(perfil: SessaoToken["perfil"], isSuperAdmin?: boolean): DockItem[] {
  const itensPrincipais: DockItem[] = [
    { href: "/resumo", label: "Resumo", icon: BarChart3 },
    { href: "/leads", label: "Leads", icon: Users },
    { href: "/kanban", label: "Negócios", icon: LayoutGrid },
  ];

  const itemQuarto = perfil === "EMPRESA"
    ? { href: "/recebimentos", label: "Caixa", icon: WalletCards }
    : perfil !== "COLABORADOR"
      ? { href: "/equipe", label: "Equipe", icon: Users }
      : { href: "/minhas-metas", label: "Metas", icon: Target };

  return [
    ...itensPrincipais,
    itemQuarto,
    ...(perfil === "EMPRESA" || perfil === "GERENTE" ? [{ href: "/whatsapp", label: "WhatsApp", icon: MessageCircle }] : []),
    ...(perfil === "EMPRESA" ? [{ href: "/configs", label: "Ajustes", icon: Settings2 }] : []),
  ];
}

const itensAgrupados: DockItem[] = [
  { href: "/integracoes", label: "Integrações", icon: Blocks },

  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/configs", label: "Ajustes", icon: Settings2 },
];

const itensSuperAdmin: DockItem[] = [
  { href: "/super-admin/usuarios", label: "Usuários", icon: Blocks },
  { href: "/super-admin/feedbacks", label: "Feedbacks", icon: MessageSquare },
];

export function MobileBottomDock({ perfil, isSuperAdmin }: MobileBottomDockProps) {
  const pathname = usePathname();
  const itens = obterItensDock(perfil);
  const itemIntegracoes = obterItemIntegracoesNavegacao();
  const itensMais = itensAgrupados.filter((item) => {
    if (item.href === itemIntegracoes.href) return podeExibirIntegracoesNaNavegacao(perfil);
    if (item.href === "/whatsapp") return perfil === "EMPRESA" || perfil === "GERENTE";
    if (item.href === "/configs") return perfil === "EMPRESA";
    return true;
  });

  const itensSuperAdminFiltrados = itensSuperAdmin.filter(() => isSuperAdmin === true);

  return (
    <nav className="pointer-events-auto lg:hidden" aria-label="Navegação principal móvel">
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-50 w-[min(94vw,30rem)] -translate-x-1/2">
        <div className="relative overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-elevated)_82%,transparent)] px-2 py-2 shadow-[var(--shadow-md)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--brand-soft),transparent_44%)] opacity-80" />
          <div className="relative flex items-center justify-between gap-1">
            {itens.slice(0, 4).map((item) => {
              const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icone = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex min-h-11 min-w-11 flex-1 items-center justify-center rounded-full border border-transparent px-2.5 text-[11px] font-medium text-[var(--text-secondary)] transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)] motion-reduce:transition-none active:scale-[0.98]",
                    ativo
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                      : "bg-transparent",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-full bg-[var(--brand-soft)] transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-productive)] motion-reduce:transition-none",
                      ativo ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="relative flex flex-col items-center gap-1">
                    <Icone className={cn("h-4 w-4", ativo && "text-[var(--brand)]")} />
                    <span className="leading-none">{item.label}</span>
                  </span>
                </Link>
              );
            })}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "relative flex min-h-11 min-w-11 flex-1 items-center justify-center rounded-full border border-transparent px-2.5 text-[11px] font-medium text-[var(--text-secondary)] shadow-none hover:bg-transparent hover:text-[var(--text-primary)]",
                    itensMais.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--text-primary)]"
                      : "bg-transparent",
                  )}
                >
                  <span className="relative flex flex-col items-center gap-1">
                    <MoreHorizontal className={cn("h-4 w-4", itensMais.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) && "text-[var(--brand)]")} />
                    <span className="leading-none">Menu</span>
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm rounded-l-[24px] border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-4 grid grid-cols-1 gap-3 p-4">
                  <ThemeToggleRow />
                  <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Acesso rápido</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">Resumo</Badge>
                      <Badge variant="secondary">Leads</Badge>
                      <Badge variant="secondary">Negócios</Badge>
                    </div>
                  </div>
                  {itensMais.map((item) => {
                    const Icone = item.icon;
                    const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] border px-4 text-sm font-medium transition-colors",
                          ativo
                            ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--text-primary)]"
                            : "border-[var(--border-subtle)] bg-[var(--surface-soft)] text-[var(--text-secondary)]",
                        )}
                      >
                        <Icone className={cn("h-4 w-4", ativo && "text-[var(--brand)]")} />
                        {item.label}
                      </Link>
                    );
                  })}
                  {itensSuperAdminFiltrados.map((item) => {
                    const Icone = item.icon;
                    const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] border px-4 text-sm font-medium transition-colors",
                          ativo
                            ? "border-[var(--warning)] bg-[color:rgba(245,158,11,0.12)] text-[var(--warning)]"
                            : "border-[var(--border-subtle)] bg-[var(--surface-soft)] text-[var(--text-secondary)]",
                        )}
                      >
                        <Icone className={cn("h-4 w-4", ativo && "text-[var(--warning)]")} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
