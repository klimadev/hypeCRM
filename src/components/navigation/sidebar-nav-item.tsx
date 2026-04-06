"use client";

import Link from "next/link";
import { Tooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "./navigation-types";

type Props = {
  item: NavigationItem;
  ativo: boolean;
  expanded: boolean;
  onNavigate: () => void;
  resumo?: { total: number; porGravidade: Record<string, number> } | null;
};

export function SidebarNavItem({ item, ativo, expanded, onNavigate, resumo }: Props) {
  const Icone = item.icon;
  const badge = item.href === "/kanban" && resumo?.total ? resumo.total : null;

  const link = (
    <Link href={item.href} onClick={onNavigate} data-tour={item.tourTarget} aria-label={`${item.label}: ${item.descricao}`} className={cn("group relative flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] border border-transparent px-3 text-sm font-medium text-[var(--text-secondary)] transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-[var(--ease-productive)] hover:-translate-y-[1px] hover:border-[var(--border-subtle)] hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)] active:scale-[0.98]", !expanded && "justify-center gap-0 px-0", ativo && "border-[color:rgba(139,92,246,0.24)] bg-[var(--brand-soft)] text-[var(--text-primary)] shadow-[0_12px_30px_-22px_rgba(139,92,246,0.65)]") }>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[calc(var(--radius-control)-2px)] border border-transparent bg-[color:rgba(255,255,255,0.03)]", ativo && "border-[color:rgba(139,92,246,0.16)] bg-[color:rgba(139,92,246,0.14)]") }>
        <Icone className={cn("h-[18px] w-[18px]", ativo && "text-[var(--brand)]")} />
      </span>
      {expanded ? (
        <span className="min-w-0 flex-1">
          <span className="block truncate">{item.label}</span>
          <span className="mt-0.5 block truncate text-[11px] font-normal leading-4 text-[var(--text-tertiary)]">{item.descricao}</span>
        </span>
      ) : null}
      {badge ? <Badge variant={ativo ? "info" : "warning"} size="sm" className={cn("ml-auto", !expanded && "absolute right-0 top-0 h-5 min-w-5 px-1")}>{badge > 9 ? "9+" : badge}</Badge> : null}
    </Link>
  );

  if (!expanded) {
    return (
      <Tooltip content={<><span className="block text-[11px] font-semibold text-[var(--text-primary)]">{item.label}</span><span className="block text-[10px] leading-4 text-[var(--text-secondary)]">{item.descricao}</span></>}>
        {link}
      </Tooltip>
    );
  }

  return link;
}
