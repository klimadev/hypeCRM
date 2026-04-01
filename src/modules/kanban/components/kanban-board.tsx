"use client";

import { useEffect, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type { Estagio, Funcionario, Lead, PendenciaNegocioInfo } from "../types";
import { KanbanBoardMobile } from "./kanban-board-mobile";
import { KanbanBoardColumn } from "./kanban-board-column";

type KanbanBoardProps = {
  estagios: Estagio[];
  negociosPorEstagio: Record<string, Lead[]>;
  negociosFiltradosPorEstagio: Record<string, Lead[]>;
  pendenciasPorNegocio: Record<string, PendenciaNegocioInfo>;
  onDragEnd: (resultado: DropResult) => Promise<void>;
  onNegocioClick: (negocio: Lead) => void;
  stageIdAtivo: string;
  setStageIdAtivo: (stageId: string) => void;
  modoFocoPendencias?: boolean;
  funcionarios?: Funcionario[];
  temFiltrosAtivos?: boolean;
};

export function KanbanBoard({
  estagios,
  negociosFiltradosPorEstagio,
  pendenciasPorNegocio,
  onDragEnd,
  onNegocioClick,
  stageIdAtivo,
  setStageIdAtivo,
  modoFocoPendencias = false,
  funcionarios = [],
}: KanbanBoardProps) {
  const [agoraMs, setAgoraMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const intervalo = window.setInterval(() => setAgoraMs(Date.now()), 60000);
    return () => window.clearInterval(intervalo);
  }, []);

  return (
    <>
      <KanbanBoardMobile
        estagios={estagios}
        negociosFiltradosPorEstagio={negociosFiltradosPorEstagio}
        pendenciasPorNegocio={pendenciasPorNegocio}
        onNegocioClick={onNegocioClick}
        stageIdAtivo={stageIdAtivo}
        setStageIdAtivo={setStageIdAtivo}
        modoFocoPendencias={modoFocoPendencias}
        funcionarios={funcionarios}
        agoraMs={agoraMs}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="hidden w-full max-w-full lg:flex lg:flex-nowrap lg:gap-4 lg:overflow-x-auto lg:overflow-y-hidden lg:pb-2">
          {estagios.map((estagio) => (
            <KanbanBoardColumn
              key={estagio.id}
              estagio={estagio}
              negocios={negociosFiltradosPorEstagio[estagio.id] ?? []}
              pendenciasPorNegocio={pendenciasPorNegocio}
              onNegocioClick={onNegocioClick}
              modoFocoPendencias={modoFocoPendencias}
              funcionarios={funcionarios}
              agoraMs={agoraMs}
            />
          ))}
        </div>
      </DragDropContext>
    </>
  );
}
