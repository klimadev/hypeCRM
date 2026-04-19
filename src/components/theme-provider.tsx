"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  startThemeViewTransition,
  type ThemeTransitionOrigin,
} from "@/components/theme-transition";

const THEME_STORAGE_KEY = "hypecrm:theme";

type Theme = "dark" | "light" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme, origin?: ThemeTransitionOrigin) => void;
  toggleTheme: (origin?: ThemeTransitionOrigin) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: "dark" | "light") {
  document.documentElement.dataset.theme = theme;
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "dark" | "light" {
  return theme === "system" ? getSystemTheme() : theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? "system");
  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        applyTheme(getSystemTheme());
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback(
    (nextTheme: Theme, origin?: ThemeTransitionOrigin) => {
      const nextResolved = resolveTheme(nextTheme);
      const currentResolved = resolveTheme(theme);
      const commitTheme = () => {
        setThemeState(nextTheme);
        applyTheme(nextResolved);
      };

      if (nextResolved !== currentResolved) {
        void startThemeViewTransition({
          commit: commitTheme,
          origin:
            origin ?? {
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
            },
        });
      } else {
        commitTheme();
      }

      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {}
    },
    [theme]
  );

  const toggleTheme = useCallback(
    (origin?: ThemeTransitionOrigin) => {
      const next = resolvedTheme === "dark" ? "light" : "dark";
      setTheme(next, origin);
    },
    [resolvedTheme, setTheme]
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
