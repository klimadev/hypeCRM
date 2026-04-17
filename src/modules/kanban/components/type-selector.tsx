"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TipoEstagio } from "../types";
import { CORES_ESTAGIO } from "../types";

interface TypeSelectorProps {
  value: TipoEstagio;
  onChange: (value: TipoEstagio) => void;
  disabled?: boolean;
}

const TIPOS: TipoEstagio[] = ["ABERTO", "PROGRESSO", "SUCCESS", "FALHA"];

const CORES_DEFAULT = {
  bg: "bg-[var(--surface-soft)]",
  text: "text-[var(--text-secondary)]",
  border: "border-[var(--border-strong)]",
  label: "Indefinido",
};

export function TypeSelector({ value, onChange, disabled }: TypeSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as TipoEstagio)}
      disabled={disabled}
    >
      <SelectTrigger className={`w-full ${CORES_ESTAGIO[value]?.bg ?? CORES_DEFAULT.bg} ${CORES_ESTAGIO[value]?.border ?? CORES_DEFAULT.border}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TIPOS.map((tipo) => (
          <SelectItem key={tipo} value={tipo}>
            <span className={cn(CORES_ESTAGIO[tipo]?.text ?? CORES_DEFAULT.text, "flex items-center gap-2")}>
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  tipo === "ABERTO" && "bg-[var(--text-tertiary)]",
                  tipo === "PROGRESSO" && "bg-[var(--info)]",
                  tipo === "SUCCESS" && "bg-[var(--success)]",
                  tipo === "FALHA" && "bg-[var(--danger)]"
                )}
              />
              {CORES_ESTAGIO[tipo]?.label ?? CORES_DEFAULT.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
