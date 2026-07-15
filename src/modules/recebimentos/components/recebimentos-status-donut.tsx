"use client";

import { AlertTriangle, ArrowDownCircle, Clock } from "lucide-react";
import { cn, formataMoeda } from "@/lib/utils";

type ItemStatus = {
  status: "PAGO" | "PENDENTE" | "ATRASADO";
  quantidade: number;
  valor: number;
};

type RecebimentosStatusDonutProps = {
  dados: ItemStatus[];
};

const cards = {
  PAGO: {
    label: "Recebido",
    icon: ArrowDownCircle,
    border: "border-[color-mix(in_srgb,var(--success)_18%,transparent)]",
    bg: "bg-[color-mix(in_srgb,var(--success)_8%,transparent)]",
    text: "text-[var(--success)]",
  },
  PENDENTE: {
    label: "A vencer",
    icon: Clock,
    border: "border-[color-mix(in_srgb,var(--brand)_18%,transparent)]",
    bg: "bg-[color-mix(in_srgb,var(--brand)_8%,transparent)]",
    text: "text-[var(--brand)]",
  },
  ATRASADO: {
    label: "Atrasado",
    icon: AlertTriangle,
    border: "border-[color-mix(in_srgb,var(--danger)_18%,transparent)]",
    bg: "bg-[color-mix(in_srgb,var(--danger)_8%,transparent)]",
    text: "text-[var(--danger)]",
  },
};

export function RecebimentosStatusDonut({ dados }: RecebimentosStatusDonutProps) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {dados.map((item) => {
        const config = cards[item.status];
        const Icone = config.icon;
        return (
          <div key={item.status} className={cn("rounded-xl border p-4", config.border, config.bg)}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icone className={cn("h-5 w-5", config.text)} />
                <p className="text-sm font-medium text-[var(--text-primary)]">{config.label}</p>
              </div>
              <span className={cn("text-sm font-semibold", config.text)}>{item.quantidade}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">{formataMoeda(item.valor)}</p>
          </div>
        );
      })}
    </section>
  );
}
