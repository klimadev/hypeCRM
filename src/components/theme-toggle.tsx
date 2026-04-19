"use client";

import { Moon, Sun } from "lucide-react";
import { motion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

const spring: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 20,
};

const liquidTransition = {
  type: "spring" as const,
  stiffness: 180,
  damping: 22,
  mass: 0.8,
};

export function ThemeToggleIcon({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const handleToggle = (e: React.MouseEvent) => {
    toggleTheme({ x: e.clientX, y: e.clientY });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "group relative flex h-9 w-9 items-center justify-center rounded-[13px] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)]",
        "hover:border-[var(--brand-ring)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]",
        "active:scale-[0.94]",
        className,
      )}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      <span className="relative flex h-4 w-4">
        <motion.span
          initial={false}
          animate={{
            rotate: isDark ? 0 : -90,
            scale: isDark ? 1 : 0,
            opacity: isDark ? 1 : 0,
          }}
          transition={spring}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon className="h-4 w-4" />
        </motion.span>
        <motion.span
          initial={false}
          animate={{
            rotate: isDark ? 90 : 0,
            scale: isDark ? 0 : 1,
            opacity: isDark ? 0 : 1,
          }}
          transition={spring}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun className="h-4 w-4" />
        </motion.span>
      </span>
    </button>
  );
}

export function ThemeToggleRow({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const isSystem = theme === "system";

  const cycleTheme = (e: React.MouseEvent | React.KeyboardEvent) => {
    let origin: { x: number; y: number };

    if ("clientX" in e) {
      origin = { x: e.clientX, y: e.clientY };
    } else {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      origin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    if (isSystem) {
      setTheme(isDark ? "light" : "dark", origin);
    } else if (isDark) {
      setTheme("light", origin);
    } else {
      setTheme("system", origin);
    }
  };

  const getLabel = () => {
    if (isSystem) return "Auto";
    return isDark ? "Escuro" : "Claro";
  };

  return (
    <div
      className={cn(
        "group flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2.5",
        "transition-all duration-[200ms] ease-[var(--ease-productive)]",
        "hover:border-[var(--brand-ring)]",
        className,
      )}
      onClick={cycleTheme}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cycleTheme(e);
        }
      }}
      aria-label={`Tema atual: ${getLabel()}. Clique para alterar`}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--brand)]">
          Aparência
        </p>
        <p className="truncate text-sm font-medium text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">
          {getLabel()}
        </p>
      </div>

      <div className="relative flex h-8 items-center">
        <div className="flex h-6 items-center gap-1.5 px-1">
          <motion.div
            initial={false}
            animate={{
              color: isDark ? "var(--text-tertiary)" : "var(--warning)",
            }}
            transition={liquidTransition}
          >
            <Sun className="h-3.5 w-3.5" />
          </motion.div>
          <motion.div
            initial={false}
            animate={{
              color: isDark ? "var(--info)" : "var(--text-tertiary)",
            }}
            transition={liquidTransition}
          >
            <Moon className="h-3.5 w-3.5" />
          </motion.div>
        </div>

        <motion.div
          initial={false}
          animate={{
            x: isDark ? "calc(100% + 4px)" : 0,
            backgroundColor: isDark ? "var(--info)" : "var(--warning)",
          }}
          transition={spring}
          className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full shadow-[0_2px_8px_-2px_rgba(0,0,0,0.4)]"
        />
      </div>
    </div>
  );
}