import { cn } from "@/lib/utils";
import { formataMoeda } from "@/lib/utils";
import { Trophy, Flame, Target, Zap, Frown } from "lucide-react";

type ProgressBarSimplesProps = {
  percentual: number;
  realizado: number;
  meta: number;
  tipoMeta: "VALOR" | "VOLUME";
  faltante?: number;
  diasRestantes?: number;
  className?: string;
};

// Status visual based on percentage
function getStatusInfo(percentual: number) {
  if (percentual >= 100) {
    return {
      label: "Meta batida! 🎉",
      emoji: Trophy,
      color: "bg-[var(--success)]",
      textColor: "text-[var(--success)]",
      bgColor: "bg-[color:rgba(16,185,129,0.08)]",
    };
  }
  if (percentual >= 80) {
    return {
      label: "Quase lá! 🔥",
      emoji: Flame,
      color: "bg-[var(--warning)]",
      textColor: "text-[var(--warning)]",
      bgColor: "bg-[color:rgba(245,158,11,0.08)]",
    };
  }
  if (percentual >= 50) {
    return {
      label: "No caminho! 🎯",
      emoji: Target,
      color: "bg-[var(--info)]",
      textColor: "text-[var(--info)]",
      bgColor: "bg-[color:rgba(56,189,248,0.08)]",
    };
  }
  if (percentual >= 25) {
    return {
      label: "Começando bem! ⚡",
      emoji: Zap,
      color: "bg-[color:rgba(255,255,255,0.28)]",
      textColor: "text-[var(--text-secondary)]",
      bgColor: "bg-[color:rgba(255,255,255,0.04)]",
    };
  }
  return {
    label: "Bora começar! 💪",
    emoji: Frown,
    color: "bg-[color:rgba(255,255,255,0.2)]",
    textColor: "text-[var(--text-tertiary)]",
    bgColor: "bg-[color:rgba(255,255,255,0.04)]",
  };
}

// Format value based on type
function formatValor(valor: number, tipo: "VALOR" | "VOLUME") {
  if (tipo === "VALOR") {
    return formataMoeda(valor);
  }
  return `${valor} contratos`;
}

export function ProgressBarSimples({
  percentual,
  realizado,
  meta,
  tipoMeta,
  faltante,
  diasRestantes,
  className,
}: ProgressBarSimplesProps) {
  const valorLimitado = Math.max(0, Math.min(percentual, 100));
  const status = getStatusInfo(percentual);
  const StatusIcon = status.emoji;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Status Badge */}
      <div className={cn("flex items-center gap-2 rounded-[var(--radius-control)] px-3 py-2", status.bgColor)}>
        <StatusIcon className={cn("h-4 w-4", status.textColor)} />
        <span className={cn("text-sm font-medium", status.textColor)}>{status.label}</span>
        {diasRestantes !== undefined && diasRestantes > 0 && (
          <span className="ml-auto text-xs text-[var(--text-secondary)]">{diasRestantes} dias restantes</span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-6 overflow-hidden rounded-full bg-[color:rgba(255,255,255,0.06)]">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500", status.color)}
          style={{ width: `${valorLimitado}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
            {percentual.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-[var(--text-secondary)]">Realizado: </span>
          <span className="font-semibold text-[var(--text-primary)]">{formatValor(realizado, tipoMeta)}</span>
        </div>
        <div>
          <span className="text-[var(--text-secondary)]">Meta: </span>
          <span className="font-semibold text-[var(--text-primary)]">{formatValor(meta, tipoMeta)}</span>
        </div>
      </div>

      {/* Missing amount (if applicable) */}
      {faltante !== undefined && faltante > 0 && percentual < 100 && (
        <div className="rounded-lg border border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.08)] px-3 py-2 text-sm text-[var(--warning)]">
          <span className="font-medium">Falta {formatValor(faltante, tipoMeta)}</span>
          <span className="text-[var(--warning)]"> para atingir a meta!</span>
        </div>
      )}

      {/* Celebration when goal is reached */}
      {percentual >= 100 && (
        <div className="rounded-lg border border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.08)] px-3 py-2 text-sm text-[var(--success)]">
          <span className="font-medium">Parabéns! 🎉</span>
          <span className="text-[var(--success)]"> Meta atingida com sucesso!</span>
        </div>
      )}
    </div>
  );
}
