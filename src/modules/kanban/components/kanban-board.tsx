"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { ChevronRight } from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [podeScrollDireita, setPodeScrollDireita] = useState(false);

  useEffect(() => {
    const intervalo = window.setInterval(() => setAgoraMs(Date.now()), 60000);
    return () => window.clearInterval(intervalo);
  }, []);

  const verificarScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setPodeScrollDireita(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    verificarScroll();
    el.addEventListener("scroll", verificarScroll);
    window.addEventListener("resize", verificarScroll);
    return () => {
      el.removeEventListener("scroll", verificarScroll);
      window.removeEventListener("resize", verificarScroll);
    };
  }, [verificarScroll, estagios.length]);

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
        <div className="hidden lg:block relative">
          {/* Fade + seta indicadora de scroll */}
          {podeScrollDireita && (
            <>
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[var(--surface)] to-transparent z-10 rounded-r-xl" />
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 z-20 animate-pulse">
                <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
              </div>
            </>
          )}

          <div
            ref={scrollRef}
            className="w-full max-w-full flex flex-nowrap gap-4 overflow-x-auto overflow-y-hidden pb-2 scroll-smooth"
          >
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
        </div>
      </DragDropContext>
    </>
  );
}
