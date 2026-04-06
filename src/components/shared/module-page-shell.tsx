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
        "min-w-0",
        fillHeight && "flex h-full min-h-0 flex-col",
        spacing === "md" ? "space-y-4" : "space-y-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
