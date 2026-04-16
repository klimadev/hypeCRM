"use client";

import { StageItem } from "./stage-item";
import type { Estagio, Pipeline } from "../types";

interface StageListProps {
  pipeline: Pipeline;
  estagios: Estagio[];
  onEdit: (estagio: Estagio) => void;
  onDelete: (estagioId: string) => void;
  onReorder: (estagios: Estagio[]) => void;
}

export function StageList({
  pipeline,
  estagios,
  onEdit,
  onDelete,
  onReorder,
}: StageListProps) {
  return (
    <div className="space-y-2">
      {estagios.map((estagio, index) => (
        <StageItem
          key={estagio.id}
          estagio={estagio}
          index={index}
          onEdit={() => onEdit(estagio)}
          onDelete={() => onDelete(estagio.id)}
          isFirst={index === 0}
          isLast={index === estagios.length - 1}
        />
      ))}
    </div>
  );
}