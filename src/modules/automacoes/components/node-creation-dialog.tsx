"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WORKFLOW_KIND_META } from "../lib/workflow-builder-seeds";
import type { WorkflowNodeTemplate } from "../types";

type NodeCreationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  contextLabel?: string;
  options: WorkflowNodeTemplate[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (option: WorkflowNodeTemplate) => void;
};

export function NodeCreationDialog(props: NodeCreationDialogProps) {
  const { open, title, description, confirmLabel, contextLabel, options, onOpenChange, onConfirm } = props;
  const [selectedId, setSelectedId] = useState<string>(() => options[0]?.id ?? "");

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  const selectedOption = options.find((option) => option.id === selectedId) ?? options[0] ?? null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 bg-[var(--surface-overlay)] backdrop-blur-md"
        style={{ animation: "fadeIn var(--duration-overlay) var(--ease-productive)" }}
        onClick={() => onOpenChange(false)}
      />

      <div
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(9,9,11,1))] shadow-[0_32px_90px_-42px_rgba(0,0,0,0.96)]"
        style={{ animation: "slideUp 220ms var(--ease-productive), scaleIn 260ms var(--ease-snappy)" }}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-[calc(var(--radius-control)-2px)] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[color:rgba(255,255,255,0.06)] hover:text-[var(--text-primary)]"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-[var(--border-subtle)] px-6 pb-5 pt-6">
          <div className="pr-10">
            <h2 className="text-lg font-semibold leading-tight tracking-tight text-[var(--text-primary)]">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
            {contextLabel ? <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{contextLabel}</p> : null}
          </div>
        </div>

        <div className="grid gap-3 px-6 py-5">
          {options.map((option, index) => {
            const meta = WORKFLOW_KIND_META[option.kind];
            const active = option.id === selectedId;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedId(option.id)}
                className="rounded-[16px] border px-4 py-4 text-left transition-all duration-150"
                style={{
                  borderColor: active ? meta.color : "rgba(255,255,255,0.08)",
                  background: active ? `linear-gradient(180deg, ${meta.soft}, rgba(255,255,255,0.015))` : "rgba(255,255,255,0.018)",
                  boxShadow: active ? `0 16px 40px -36px ${meta.soft}` : "none",
                  animation: `slideUp 200ms var(--ease-productive) ${Math.min(index * 35, 210)}ms both`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: meta.color }}>
                      {meta.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{option.label}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{option.description}</p>
                  </div>
                  <span
                    className="mt-1 h-4 w-4 rounded-full border"
                    style={{
                      borderColor: active ? meta.color : "rgba(255,255,255,0.14)",
                      backgroundColor: active ? meta.color : "transparent",
                      boxShadow: active ? `0 0 0 4px ${meta.soft}` : "none",
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-subtle)] px-6 py-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => selectedOption && onConfirm(selectedOption)} disabled={!selectedOption}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
