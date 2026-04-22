"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { BugPlay, Lightbulb, MessageCircle } from "lucide-react";
import { FeedbackForm } from "@/modules/feedback";

type FeedbackTriggerProps = {
  isLoggedIn: boolean;
};

export function FeedbackTrigger({ isLoggedIn }: FeedbackTriggerProps) {
  const [open, setOpen] = useState(false);
  const [tipoPadrao, setTipoPadrao] = useState<"BUG" | "SUGESTAO">("BUG");
  const pathname = usePathname();

  const pagina = useMemo(() => {
    if (pathname === "/") return "login";
    return pathname.replace(/^\//, "") || "dashboard";
  }, [pathname]);

  if (!isLoggedIn) return null;

  return (
    <>
      <FeedbackForm open={open} onClose={() => setOpen(false)} initialTipo={tipoPadrao} />
      <div className="grid gap-1.5">
        <button
          type="button"
          onClick={() => {
            setTipoPadrao("BUG");
            setOpen(true);
          }}
          className="group inline-flex w-full items-center justify-start gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)] transition-[transform,border-color,bg-color,color] duration-200 hover:border-[var(--danger)] hover:bg-[color:rgba(244,63,94,0.10)] hover:text-[var(--danger)]"
        >
          <BugPlay className="h-4 w-4" />
          Reportar bug
        </button>
        <button
          type="button"
          onClick={() => {
            setTipoPadrao("SUGESTAO");
            setOpen(true);
          }}
          className="group inline-flex w-full items-center justify-start gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)] transition-[transform,border-color,bg-color,color] duration-200 hover:border-[var(--success)] hover:bg-[color:rgba(16,185,129,0.10)] hover:text-[var(--success)]"
        >
          <Lightbulb className="h-4 w-4" />
          Sugerir melhora
        </button>

        <div
          className="mx-auto inline-flex w-full items-center justify-center rounded-[999px] border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-soft)_82%,transparent)] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]"
        >
          <MessageCircle className="mr-1 h-3.5 w-3.5" />
          {pagina}
        </div>
      </div>
    </>
  );
}
