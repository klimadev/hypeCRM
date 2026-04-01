"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { OptimisticSync } from "@/components/ui/optimistic-sync";
import { cn } from "@/lib/utils";
import type { Estagio, Funcionario, Lead, PendenciaNegocioInfo } from "../types";
import { EmptyState } from "./empty-state";
import { getClasseBordaGravidade } from "./pendencia-badge";
import { AlcaArrasteKanban, KanbanNegocioCardContent } from "./kanban-negocio-card-content";
import {
  obterClasseIndicadorEtapaKanban,
  obterSinalVisualNegocioKanban,
  obterTintColunaKanban,
} from "./kanban-board.utils";
import { obterDescricaoEtapaKanban, obterResumoOperacionalColuna } from "../utils/apresentacao";

type KanbanBoardColumnProps = {
  estagio: Estagio;
  negocios: Lead[];
  pendenciasPorNegocio: Record<string, PendenciaNegocioInfo>;
  onNegocioClick: (negocio: Lead) => void;
  modoFocoPendencias?: boolean;
  funcionarios?: Funcionario[];
  agoraMs: number;
};

export function KanbanBoardColumn({
  estagio,
  negocios,
  pendenciasPorNegocio,
  onNegocioClick,
  modoFocoPendencias = false,
  funcionarios = [],
  agoraMs,
}: KanbanBoardColumnProps) {
  const visualCue = obterSinalVisualNegocioKanban(estagio);

  return (
    <Droppable droppableId={estagio.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "min-w-[280px] max-w-[320px] shrink-0 rounded-[var(--radius-card)] border border-[var(--border-subtle)] p-4 shadow-[var(--shadow-sm)] transition-all duration-300 h-full flex flex-col",
            obterTintColunaKanban(estagio),
            snapshot.isDraggingOver
              ? "border-[color:rgba(56,189,248,0.28)] bg-[color:rgba(56,189,248,0.08)] shadow-[0_20px_40px_-28px_rgba(56,189,248,0.5)]"
              : "hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]",
          )}
        >
          <div className="mb-3 border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", obterClasseIndicadorEtapaKanban(estagio))} />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {estagio.nome} <span className="font-normal text-[var(--text-tertiary)]">({negocios.length})</span>
              </p>
            </div>
            <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">{obterDescricaoEtapaKanban(estagio)}</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{obterResumoOperacionalColuna({ estagio, negocios, pendenciasPorNegocio, agoraMs })}</p>
          </div>

          <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
            {negocios.length === 0 ? (
              <EmptyState
                titulo={modoFocoPendencias ? "Sem pendências" : "Nenhum negócio"}
                descricao={modoFocoPendencias ? "Esta coluna não tem pendências" : "Arraste negócios para cá ou adicione novos"}
                variant="leads"
                className="py-8"
              />
            ) : (
              negocios.map((negocio, index) => (
                <Draggable
                  key={negocio.id}
                  draggableId={negocio.id}
                  index={index}
                  isDragDisabled={negocio.id.startsWith("temp-")}
                >
                  {(draggableProvided, draggableSnapshot) => (
                    <OptimisticSync active={negocio.id.startsWith("temp-")} className="cursor-wait">
                      <Card
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        {...draggableProvided.dragHandleProps}
                        className={cn(
                          negocio.id.startsWith("temp-")
                            ? "bg-transparent"
                            : "cursor-pointer rounded-[var(--radius-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]",
                          visualCue.border,
                          getClasseBordaGravidade(pendenciasPorNegocio[negocio.id]?.gravidadeMaxima),
                          draggableSnapshot.isDragging && "shadow-2xl scale-[1.02] rotate-1 opacity-90",
                        )}
                        onClick={() => {
                          if (negocio.id.startsWith("temp-")) return;
                          onNegocioClick(negocio);
                        }}
                      >
                        <CardContent className="p-4">
                          <KanbanNegocioCardContent
                            negocio={negocio}
                            estagio={estagio}
                            pendencias={pendenciasPorNegocio[negocio.id]}
                            funcionarios={funcionarios}
                            agoraMs={agoraMs}
                            visualCue={visualCue}
                            compact={false}
                            dragHandle={!negocio.id.startsWith("temp-") ? <AlcaArrasteKanban /> : null}
                          />
                        </CardContent>
                      </Card>
                    </OptimisticSync>
                  )}
                </Draggable>
              ))
            )}

            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}
