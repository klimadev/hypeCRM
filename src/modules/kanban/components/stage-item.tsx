"use client";

import { Pencil, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { StageTypeBadge } from "./stage-type-badge";
import type { Estagio } from "../types";

interface StageItemProps {
  estagio: Estagio;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function StageItem({
  estagio,
  index,
  onEdit,
  onDelete,
  isFirst,
  isLast,
}: StageItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--border-strong)]",
        "group"
      )}
    >
      <div className="flex flex-col gap-1 text-[var(--text-tertiary)]">
        <button
          type="button"
          disabled={isFirst}
          className={cn(
            "cursor-pointer p-0.5 rounded transition-colors hover:bg-[var(--surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50",
            isFirst && "opacity-50"
          )}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
            {estagio.nome}
          </span>
          <StageTypeBadge tipo={estagio.tipo} />
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span>Ordem: {Number(estagio.ordem)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-rose-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}