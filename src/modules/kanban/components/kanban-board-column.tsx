"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { OptimisticSync } from "@/components/ui/optimistic-sync";
import { cn } from "@/lib/utils";
import type { Estagio, Funcionario, Lead, PendenciaNegocioInfo } from "../types";
import { EmptyState } from "./empty-state";
import { getClasseBordaGravidade } from "./pendencia-badge";
import { AlcaArrasteKanban, KanbanNegocioCardContent } from "./kanban-negocio-card-content";
import { obterClasseIndicadorEtapaKanban, obterEstilosColunaKanban, obterEstilosTextoColuna, obterSinalVisualNegocioKanban, obterTintColunaKanban } from "./kanban-board.utils";

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
  const estilosColuna = obterEstilosColunaKanban(estagio);
  const estilosTexto = obterEstilosTextoColuna(estagio);

  const inlineStyles: Record<string, string> = {};
  if (estilosColuna.backgroundColor) inlineStyles.backgroundColor = estilosColuna.backgroundColor;
  if (estilosColuna.borderColor) inlineStyles.borderColor = estilosColuna.borderColor;
  if (estilosColuna.borderRadius) inlineStyles.borderRadius = estilosColuna.borderRadius;

  const textoEstilos: Record<string, string> = {};
  if (estilosTexto.color) textoEstilos.color = estilosTexto.color;
  if (estilosTexto.fontSize) textoEstilos.fontSize = estilosTexto.fontSize;
  if (estilosTexto.fontWeight) textoEstilos.fontWeight = estilosTexto.fontWeight;

  return (
    <Droppable droppableId={estagio.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "min-w-[280px] max-w-[320px] shrink-0 rounded-xl border p-3 transition-colors duration-150 h-full flex flex-col",
            obterTintColunaKanban(estagio),
            snapshot.isDraggingOver
              ? "border-[color:rgba(139,92,246,0.3)] bg-[color:rgba(139,92,246,0.04)]"
              : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]",
          )}
          style={Object.keys(inlineStyles).length > 0 ? inlineStyles : undefined}
        >
          <div className="mb-3 flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", obterClasseIndicadorEtapaKanban(estagio))} />
              <p
                className="text-[13px] font-semibold text-[var(--text-primary)]"
                style={Object.keys(textoEstilos).length > 0 ? textoEstilos : undefined}
              >
                {estagio.nome}
              </p>
            </div>
            <span className="text-[11px] font-medium tabular-nums text-[var(--text-tertiary)]">
              {negocios.length}
            </span>
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
                            : "cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[color:rgba(255,255,255,0.03)] active:scale-[0.99]",
                          visualCue.border,
                          getClasseBordaGravidade(pendenciasPorNegocio[negocio.id]?.gravidadeMaxima),
                          draggableSnapshot.isDragging && "shadow-lg opacity-80",
                        )}
                        onClick={() => {
                          if (negocio.id.startsWith("temp-")) return;
                          onNegocioClick(negocio);
                        }}
                      >
                        <CardContent className="px-3 py-2.5">
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
