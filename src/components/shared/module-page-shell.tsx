import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ModulePageShellProps = {
  children: ReactNode;
  spacing?: "md" | "lg";
  className?: string;
};

export function ModulePageShell({ children, spacing = "md", className }: ModulePageShellProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.94))] p-3 shadow-[var(--shadow-md)] md:p-6 overflow-x-hidden",
        spacing === "md"
          ? "space-y-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:space-y-5 md:pb-6"
          : "space-y-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:space-y-6 md:pb-6",
        className,
      )}
    >
      {children}
    </section>
  );
}
