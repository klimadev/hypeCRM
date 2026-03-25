"use client";

import { useEffect, Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  };
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  useEffect(() => {
    if (error) {
      console.error("ErrorBoundary caught an error:", error);
    }
  }, [error]);

  return (
    <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))] p-8 text-center shadow-[var(--shadow-md)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.08),transparent_28%)]" />
      <div className="relative rounded-[20px] border border-[color:rgba(244,63,94,0.22)] bg-[linear-gradient(135deg,rgba(244,63,94,0.16),rgba(255,255,255,0.03))] p-4 text-[var(--danger)] shadow-[var(--shadow-sm)]">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="relative mt-4 max-w-md space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Algo deu errado</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Ocorreu um erro inesperado. Por favor, tente novamente.
        </p>
        {process.env.NODE_ENV === "development" && error && (
          <pre className="mt-4 overflow-auto rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 text-left font-mono text-xs text-[var(--text-secondary)]">
            {error.message}
          </pre>
        )}
      </div>
      <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Recarregar Página
        </Button>
        <Button onClick={reset}>Tentar Novamente</Button>
      </div>
    </div>
  );
}

export { ErrorBoundary };
