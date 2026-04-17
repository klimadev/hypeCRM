import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-productive)]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--text-primary)]",
          "placeholder:text-[var(--text-tertiary)]",
          "hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)]",
          "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--focus-ring)]",
          "disabled:cursor-not-allowed disabled:border-[var(--border-subtle)] disabled:bg-[var(--surface-soft)] disabled:text-[var(--text-disabled)] disabled:shadow-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
