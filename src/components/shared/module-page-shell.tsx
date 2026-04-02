import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ModulePageShellProps = {
  children: ReactNode;
  spacing?: "md" | "lg";
  className?: string;
  fillHeight?: boolean;
};

export function ModulePageShell({ children, spacing = "md", className, fillHeight = false }: ModulePageShellProps) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-x-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.94))] p-2.5 shadow-[var(--shadow-sm)] md:p-4 xl:p-5",
        fillHeight && "flex h-full min-h-0 flex-col",
        spacing === "md"
          ? "space-y-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:space-y-4 md:pb-5"
          : "space-y-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:space-y-5 md:pb-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
