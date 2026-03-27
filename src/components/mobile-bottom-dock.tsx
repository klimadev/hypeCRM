"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, LayoutGrid, MessageCircle, Settings2, Target, WalletCards, Zap, Users, MoreHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { SessaoToken } from "@/lib/tipos";

type DockItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type MobileBottomDockProps = {
  perfil: SessaoToken["perfil"];
};

function obterItensDock(perfil: SessaoToken["perfil"]): DockItem[] {
  return [
    { href: "/resumo", label: "Resumo", icon: BarChart3 },
    { href: "/kanban", label: "Leads", icon: LayoutGrid },
    ...(perfil === "EMPRESA" ? [{ href: "/recebimentos", label: "Caixa", icon: WalletCards }] : []),
    ...(perfil !== "COLABORADOR" ? [{ href: "/equipe", label: "Equipe", icon: Users }] : [{ href: "/minhas-metas", label: "Metas", icon: Target }]),
    ...(perfil === "EMPRESA" || perfil === "GERENTE" ? [{ href: "/whatsapp", label: "WhatsApp", icon: MessageCircle }] : []),
    ...(perfil === "EMPRESA" || perfil === "GERENTE" ? [{ href: "/automacoes", label: "Aut.", icon: Zap }] : []),
    ...(perfil === "EMPRESA" ? [{ href: "/configs", label: "Ajustes", icon: Settings2 }] : []),
  ];
}

const itensAgrupados: DockItem[] = [
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/automacoes", label: "Automações", icon: Zap },
  { href: "/configs", label: "Ajustes", icon: Settings2 },
];

export function MobileBottomDock({ perfil }: MobileBottomDockProps) {
  const pathname = usePathname();
  const shouldReduce = useReducedMotion();
  const itens = obterItensDock(perfil);
  const itensMais = itensAgrupados.filter((item) => {
    if (item.href === "/whatsapp" || item.href === "/automacoes") return perfil === "EMPRESA" || perfil === "GERENTE";
    if (item.href === "/configs") return perfil === "EMPRESA";
    return true;
  });

  return (
    <nav className="pointer-events-auto lg:hidden" aria-label="Navegação principal móvel">
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-50 w-[min(94vw,30rem)] -translate-x-1/2">
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={shouldReduce ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[color:rgba(9,9,11,0.72)] px-2 py-2 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.16),transparent_44%)] opacity-70" />
          <div className="relative flex items-center justify-between gap-1">
            {itens.slice(0, 4).map((item) => {
              const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icone = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex min-h-11 min-w-11 flex-1 items-center justify-center rounded-full border border-transparent px-2.5 text-[11px] font-medium text-[var(--text-secondary)] transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)] active:scale-[0.98]",
                    ativo
                      ? "border-[color:rgba(124,58,237,0.28)] bg-[color:rgba(124,58,237,0.16)] text-[var(--text-primary)] shadow-[0_12px_30px_-20px_rgba(124,58,237,0.8)]"
                      : "bg-transparent",
                  )}
                >
                  {ativo ? (
                    <motion.span
                      layoutId="mobile-dock-ativo"
                      className="absolute inset-0 rounded-full bg-[var(--brand-soft)]"
                      transition={shouldReduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative flex flex-col items-center gap-1">
                    <Icone className={cn("h-4 w-4", ativo && "text-[var(--brand)]")} />
                    <span className="leading-none">{item.label}</span>
                  </span>
                </Link>
              );
            })}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "relative flex min-h-11 min-w-11 flex-1 items-center justify-center rounded-full border border-transparent px-2.5 text-[11px] font-medium text-[var(--text-secondary)] transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)] active:scale-[0.98]",
                    itensMais.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
                      ? "border-[color:rgba(124,58,237,0.28)] bg-[color:rgba(124,58,237,0.16)] text-[var(--text-primary)]"
                      : "bg-transparent",
                  )}
                >
                  <span className="relative flex flex-col items-center gap-1">
                    <MoreHorizontal className={cn("h-4 w-4", itensMais.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) && "text-[var(--brand)]")} />
                    <span className="leading-none">Mais</span>
                  </span>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm rounded-l-[24px] border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                <SheetHeader>
                  <SheetTitle>Acessos rápidos</SheetTitle>
                </SheetHeader>
                <div className="mt-4 grid grid-cols-1 gap-2">
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
                            ? "border-[color:rgba(124,58,237,0.28)] bg-[color:rgba(124,58,237,0.16)] text-[var(--text-primary)]"
                            : "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-secondary)]",
                        )}
                      >
                        <Icone className={cn("h-4 w-4", ativo && "text-[var(--brand)]")} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </motion.div>
      </div>
    </nav>
  );
}
