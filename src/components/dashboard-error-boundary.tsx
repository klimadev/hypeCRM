"use client";

import { ErrorBoundary as ErrorBoundaryComponent } from "@/components/error-boundary";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
}

const ErrorFallback = () => (
  <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))] p-8 text-center shadow-[var(--shadow-md)]">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.08),transparent_28%)]" />
    <div className="relative rounded-[20px] border border-[color:rgba(56,189,248,0.22)] bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(255,255,255,0.03))] p-4 text-[var(--info)] shadow-[var(--shadow-sm)]">
      <AlertCircle className="h-8 w-8" />
    </div>
    <div className="relative mt-4 max-w-md space-y-1">
      <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Algo deu errado</h2>
      <p className="text-sm text-[var(--text-secondary)]">
        Ocorreu um erro ao carregar esta seção.
      </p>
    </div>
    <Button className="relative mt-6" variant="outline" onClick={() => window.location.reload()}>
      Recarregar Página
    </Button>
  </div>
);

export function DashboardErrorBoundary({ children }: DashboardErrorBoundaryProps) {
  return (
    <ErrorBoundaryComponent fallback={<ErrorFallback />}>
      {children}
    </ErrorBoundaryComponent>
  );
}
