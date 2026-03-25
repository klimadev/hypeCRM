import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] transition-[background-color,border-color,color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-productive)]",
  {
    variants: {
      variant: {
        default:
          "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] shadow-[var(--shadow-sm)]",
        success:
          "border-[color:rgba(16,185,129,0.22)] bg-[color:rgba(16,185,129,0.14)] text-[var(--success)]",
        warning:
          "border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.14)] text-[var(--warning)]",
        error:
          "border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.14)] text-[var(--danger)]",
        info:
          "border-[color:rgba(56,189,248,0.24)] bg-[color:rgba(56,189,248,0.14)] text-[var(--info)]",
        secondary:
          "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-tertiary)]",
      },
      size: {
        default: "px-3 py-1.5",
        sm: "px-2.5 py-1 text-[10px]",
        lg: "px-4 py-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-[var(--success)]",
            variant === "warning" && "bg-[var(--warning)]",
            variant === "error" && "bg-[var(--danger)]",
            variant === "info" && "bg-[var(--info)]",
            (variant === "default" || variant === "secondary" || !variant) && "bg-[var(--text-tertiary)]",
          )}
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
