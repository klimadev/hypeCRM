"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { FeedbackForm } from "@/modules/feedback";
import { Tooltip } from "@/components/ui/tooltip";

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
      <Tooltip content={`Feedback (${pagina})`} side="top">
        <button
          type="button"
          onClick={() => {
            setTipoPadrao("BUG");
            setOpen(true);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[13px] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] transition-[border-color,background-color,color,transform] duration-200 hover:-translate-y-px hover:border-[var(--brand)] hover:bg-[color:var(--brand-soft)] hover:text-[var(--text-primary)]"
          aria-label="Abrir feedback"
          title={`Feedback (${pagina})`}
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </Tooltip>
    </>
  );
}
