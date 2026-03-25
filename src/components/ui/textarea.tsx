import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-[background-color,border-color,color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-productive)] placeholder:text-[var(--text-tertiary)] hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:border-[var(--border-subtle)] disabled:bg-[color:rgba(255,255,255,0.03)] disabled:text-[var(--text-disabled)] disabled:shadow-none",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
