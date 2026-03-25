"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, LayoutGrid, MessageCircle, Settings2, Target, WalletCards, Zap, Users } from "lucide-react";
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

export function MobileBottomDock({ perfil }: MobileBottomDockProps) {
  const pathname = usePathname();
  const shouldReduce = useReducedMotion();
  const itens = obterItensDock(perfil);

  return (
    <nav className="pointer-events-auto lg:hidden" aria-label="Navegação principal móvel">
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2">
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={shouldReduce ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative overflow-hidden rounded-full border border-white/10 bg-black/20 px-2 py-2 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_44%)] opacity-70" />
          <div className="relative flex items-center justify-between gap-1">
            {itens.map((item) => {
              const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icone = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex min-h-12 min-w-12 flex-1 items-center justify-center rounded-full border border-transparent px-3 text-[11px] font-medium text-[var(--text-secondary)] transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)] active:scale-[0.98]",
                    ativo
                      ? "border-white/10 bg-white/10 text-[var(--text-primary)] shadow-[0_12px_30px_-20px_rgba(139,92,246,0.8)]"
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
          </div>
        </motion.div>
      </div>
    </nav>
  );
}
