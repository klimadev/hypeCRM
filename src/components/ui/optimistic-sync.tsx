"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/animations/springs";

const optimisticSyncVariants = cva(
  "rounded-[var(--radius-control)] border border-dashed p-2 opacity-80 shadow-[var(--shadow-sm)]",
  {
  variants: {
    variant: {
      warning: "border-[color:rgba(245,158,11,0.32)] bg-[color:rgba(245,158,11,0.12)]",
      info: "border-[color:rgba(56,189,248,0.32)] bg-[color:rgba(56,189,248,0.12)]",
      success: "border-[color:rgba(16,185,129,0.32)] bg-[color:rgba(16,185,129,0.12)]",
    },
  },
  defaultVariants: {
    variant: "warning",
  },
});

const optimisticSyncLabelVariants = cva("mt-1 text-xs font-medium tracking-[0.01em] animate-pulse-subtle", {
  variants: {
    variant: {
      warning: "text-[var(--warning)]",
      info: "text-[var(--info)]",
      success: "text-[var(--success)]",
    },
  },
  defaultVariants: {
    variant: "warning",
  },
});

type OptimisticSyncProps = {
  active: boolean;
  children: ReactNode;
  className?: string;
  label?: string;
} & VariantProps<typeof optimisticSyncVariants>;

export function OptimisticSync({
  active,
  children,
  className,
  label = "Sincronizando...",
  variant,
}: OptimisticSyncProps) {
  return (
    <AnimatePresence mode="wait">
      {active ? (
        <motion.div
          key="optimistic"
          className={cn(optimisticSyncVariants({ variant }), className)}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1, transition: springs.snappy }}
          exit={{ opacity: 0, scale: 0.98, transition: springs.stiff }}
        >
          {children}
          <p className={optimisticSyncLabelVariants({ variant })}>
            {label}
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="confirmed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: springs.smooth }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}