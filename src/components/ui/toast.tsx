"use client";

import * as React from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />,
    error: <AlertCircle className="h-5 w-5 text-[var(--danger)]" />,
    warning: <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />,
    info: <Info className="h-5 w-5 text-[var(--info)]" />,
  };

  const backgrounds = {
    success:
      "border-[color:rgba(16,185,129,0.24)] bg-[linear-gradient(135deg,rgba(12,12,14,0.96),rgba(16,185,129,0.12))]",
    error:
      "border-[color:rgba(244,63,94,0.24)] bg-[linear-gradient(135deg,rgba(12,12,14,0.96),rgba(244,63,94,0.12))]",
    warning:
      "border-[color:rgba(245,158,11,0.24)] bg-[linear-gradient(135deg,rgba(12,12,14,0.96),rgba(245,158,11,0.12))]",
    info:
      "border-[color:rgba(56,189,248,0.24)] bg-[linear-gradient(135deg,rgba(12,12,14,0.96),rgba(56,189,248,0.12))]",
  };

  const iconsBg = {
    success: "bg-[color:rgba(16,185,129,0.14)] border border-[color:rgba(16,185,129,0.18)]",
    error: "bg-[color:rgba(244,63,94,0.14)] border border-[color:rgba(244,63,94,0.18)]",
    warning: "bg-[color:rgba(245,158,11,0.14)] border border-[color:rgba(245,158,11,0.18)]",
    info: "bg-[color:rgba(56,189,248,0.14)] border border-[color:rgba(56,189,248,0.18)]",
  };

  return (
    <div
      className={cn(
        "animate-slide-in-right rounded-[var(--radius-card)] border p-4 text-[var(--text-primary)] shadow-[var(--shadow-overlay)] backdrop-blur-md transition-[transform,opacity,box-shadow] duration-[var(--duration-overlay)] ease-[var(--ease-productive)]",
        backgrounds[toast.type],
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            iconsBg[toast.type],
          )}
        >
          {icons[toast.type]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-[var(--radius-control)] p-1 text-[var(--text-tertiary)] transition-[background-color,color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-productive)] hover:bg-white/8 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--focus-ring)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
