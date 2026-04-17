import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type InlineStatusAlertProps = {
  variant: "error" | "success" | "warning" | "info";
  message?: string | null;
  icon?: ReactNode;
  className?: string;
};

const variantStyles = {
  error: "border-[var(--danger)]/30 bg-[var(--danger)]/8 text-[var(--danger)]",
  success: "border-[var(--success)]/30 bg-[var(--success)]/8 text-[var(--success)]",
  warning: "border-[var(--warning)]/30 bg-[var(--warning)]/8 text-[var(--warning)]",
  info: "border-[var(--info)]/30 bg-[var(--info)]/8 text-[var(--info)]",
};

const iconStyles = {
  error: "bg-[var(--danger)]/15 text-[var(--danger)]",
  success: "bg-[var(--success)]/15 text-[var(--success)]",
  warning: "bg-[var(--warning)]/15 text-[var(--warning)]",
  info: "bg-[var(--info)]/15 text-[var(--info)]",
};

function variantIcon(variant: InlineStatusAlertProps["variant"]) {
  switch (variant) {
    case "error":
      return <AlertCircle className="h-4 w-4" />;
    case "success":
      return <CheckCircle2 className="h-4 w-4" />;
    case "warning":
      return <TriangleAlert className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

export function InlineStatusAlert({ variant, message, icon, className }: InlineStatusAlertProps) {
  if (!message) return null;

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm", variantStyles[variant], className)}>
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconStyles[variant])}>
        {icon ?? variantIcon(variant)}
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
