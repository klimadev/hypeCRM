"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggleIcon({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={isLight ? "Ativar tema escuro" : "Ativar tema claro"}
      aria-label={isLight ? "Ativar tema escuro" : "Ativar tema claro"}
      className={cn("h-9 w-9 rounded-[13px] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]", className)}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}

export function ThemeToggleRow({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2.5", className)}>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Aparencia</p>
        <p className="truncate text-sm text-[var(--text-secondary)]">Tema {isLight ? "claro" : "escuro"}</p>
      </div>
      <div className="flex items-center gap-2">
        <Moon className="h-4 w-4 text-[var(--text-tertiary)]" />
        <Switch checked={isLight} onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")} aria-label="Alternar tema" />
        <Sun className="h-4 w-4 text-[var(--text-tertiary)]" />
      </div>
    </div>
  );
}
