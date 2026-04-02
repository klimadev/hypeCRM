"use client";

import type { NavigationSection } from "./navigation-types";
import { SidebarNavItem } from "./sidebar-nav-item";

type Props = {
  section: NavigationSection;
  expanded: boolean;
  pathname: string;
  onNavigate: () => void;
  resumo?: { total: number; porGravidade: Record<string, number> } | null;
};

export function SidebarNavSection({ section, expanded, pathname, onNavigate, resumo }: Props) {
  return (
    <div className="space-y-2">
      {expanded ? <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{section.titulo}</p> : null}
      <div className="space-y-1">
        {section.itens.map((item) => {
          const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return <SidebarNavItem key={item.href} item={item} ativo={ativo} expanded={expanded} onNavigate={onNavigate} resumo={resumo} />;
        })}
      </div>
    </div>
  );
}
