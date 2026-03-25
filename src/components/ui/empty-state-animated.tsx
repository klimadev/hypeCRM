"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Inbox, Users, MessageSquare, Target, Package, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/animations/springs";

// === ICON MAP ===
const iconMap = {
  inbox: Inbox,
  users: Users,
  message: MessageSquare,
  target: Target,
  package: Package,
  zap: Zap,
  chart: BarChart3,
} as const;

type EmptyStateVariant = keyof typeof iconMap;

type EmptyStateAnimatedProps = {
  variant?: EmptyStateVariant;
  customIcon?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  className?: string;
};

export function EmptyStateAnimated({
  variant = "inbox",
  customIcon,
  titulo,
  descricao,
  acao,
  className,
}: EmptyStateAnimatedProps) {
  const shouldReduce = useReducedMotion();
  const IconComponent = iconMap[variant];

  return (
    <motion.div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-5 rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)] px-6 py-16 text-center",
        className,
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: springs.gentle }}
    >
      {/* Floating icon */}
      <motion.div
        className="relative"
        animate={
          shouldReduce
            ? {}
            : {
                y: [0, -8, 0], // Float up 8px and back
              }
        }
        transition={
          shouldReduce
            ? {}
            : {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      >
        {customIcon ?? (
          <div className="relative">
            {/* Glow behind icon */}
            <div className="absolute inset-0 blur-xl opacity-20 bg-[var(--brand)] rounded-full scale-150" />
            <IconComponent className="relative h-16 w-16 text-[color:rgba(255,255,255,0.16)]" strokeWidth={1.5} />
          </div>
        )}
      </motion.div>

      {/* Text */}
      <div>
        <motion.p
          className="text-base font-semibold text-[var(--text-primary)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {titulo}
        </motion.p>
        {descricao ? (
          <motion.p
            className="mt-1.5 text-sm text-[var(--text-secondary)] max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {descricao}
          </motion.p>
        ) : null}
      </div>

      {/* CTA */}
      {acao ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...springs.smooth }}
        >
          {acao}
        </motion.div>
      ) : null}
    </motion.div>
  );
}