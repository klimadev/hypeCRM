import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-[var(--radius-control)] border border-transparent text-sm font-medium text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] transition-all duration-150 ease-out focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--focus-ring)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[var(--border-subtle)] disabled:bg-[color:rgba(255,255,255,0.04)] disabled:text-[var(--text-disabled)] disabled:shadow-none disabled:translate-y-0 disabled:scale-100",
  {
    variants: {
      variant: {
        default:
          "border-[color:var(--brand-strong)] bg-[var(--brand)] text-[var(--primary-foreground)] shadow-[var(--shadow-glow)] hover:bg-[var(--brand-strong)] hover:translate-y-[-1px] hover:scale-[1.02] active:scale-[0.98] active:translate-y-0",
        secondary:
          "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[color:rgba(255,255,255,0.08)] hover:translate-y-[-1px]",
        outline:
          "border-[var(--border-strong)] bg-[color:rgba(12,12,14,0.72)] text-[var(--text-secondary)] shadow-none hover:border-[var(--border-focus)] hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)] hover:translate-y-[-1px]",
        ghost:
          "bg-transparent text-[var(--text-secondary)] shadow-none hover:bg-[color:rgba(255,255,255,0.05)] hover:text-[var(--text-primary)] hover:translate-y-[-1px]",
        destructive:
          "border-[color:rgba(244,63,94,0.4)] bg-[color:rgba(244,63,94,0.16)] text-[color:#ffe4ea] shadow-none hover:border-[color:rgba(244,63,94,0.58)] hover:bg-[color:rgba(244,63,94,0.24)] hover:translate-y-[-1px]",
        success:
          "border-[color:rgba(16,185,129,0.34)] bg-[var(--success)] text-[color:#04130f] shadow-[0_16px_40px_-24px_rgba(16,185,129,0.7)] hover:bg-[color:#34d399] hover:translate-y-[-1px]",
        link: "h-auto rounded-none border-0 bg-transparent px-0 py-0 text-[var(--brand)] underline-offset-4 shadow-none hover:text-[color:#a78bfa] hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "min-h-11 rounded-[calc(var(--radius-control)-2px)] px-3 text-xs",
        lg: "min-h-12 rounded-[calc(var(--radius-control)+2px)] px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Carregando...</span>
          </span>
        ) : children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
