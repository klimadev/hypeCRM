import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type AccessDeniedCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function AccessDeniedCard({ eyebrow = "Acesso restrito", title, description }: AccessDeniedCardProps) {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))] p-8 shadow-[var(--shadow-md)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_30%)]" />
      <div className="relative flex items-start gap-4">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-[color:rgba(245,158,11,0.22)] bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(255,255,255,0.03))] text-[var(--warning)] shadow-[var(--shadow-sm)]")}>
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>
        </div>
      </div>
      <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
    </section>
  );
}
