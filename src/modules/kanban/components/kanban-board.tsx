"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { OptimisticSync } from "@/components/ui/optimistic-sync";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formataMoeda } from "@/lib/utils";
import type { Estagio, Lead, PendenciaNegocioInfo, Funcionario } from "../types";
import { getClasseBordaGravidade } from "./pendencia-badge";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, Users, GripVertical, Megaphone, MessageCircle, PenLine } from "lucide-react";
import { EmptyState } from "./empty-state";

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

type NegocioVisualCue = {
  circle: string | null;
  border: string | null;
  emoji: string | null;
};

function MobilePaneKanban({
  estagios,
  negociosFiltradosPorEstagio,
  pendenciasPorNegocio,
  onNegocioClick,
  stageIdAtivo,
  setStageIdAtivo,
  modoFocoPendencias = false,
  funcionarios = [],
}: Pick<KanbanBoardProps, "estagios" | "negociosFiltradosPorEstagio" | "pendenciasPorNegocio" | "onNegocioClick" | "modoFocoPendencias" | "funcionarios" | "stageIdAtivo" | "setStageIdAtivo">) {
  const stageAtual = estagios.find((estagio) => estagio.id === stageIdAtivo) ?? estagios[0] ?? null;

  return (
    <div className="lg:hidden">
      <Tabs value={stageIdAtivo} onValueChange={setStageIdAtivo} className="flex flex-col gap-3">
        <div className="sticky top-0 z-10 -mx-3 border-b border-[var(--border-subtle)] bg-[color:rgba(9,9,11,0.96)] px-3 pb-3 pt-2">
          <TabsList className="flex h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-0 bg-transparent p-0 shadow-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {estagios.map((estagio) => {
              const negocios = negociosFiltradosPorEstagio[estagio.id] ?? [];
              return (
                <TabsTrigger
                  key={estagio.id}
                  value={estagio.id}
                  className={cn(
                    "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium text-[var(--text-secondary)] data-[state=active]:border-[color:rgba(124,58,237,0.32)] data-[state=active]:bg-[color:rgba(124,58,237,0.16)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[0_14px_30px_-22px_rgba(124,58,237,0.75)]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {estagio.nome}
                    <span className="font-semibold text-[var(--text-tertiary)] data-[state=active]:text-[color:#ddd6fe]">{negocios.length}</span>
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {estagios.map((estagio) => {
          const negocios = negociosFiltradosPorEstagio[estagio.id] ?? [];
          const ativo = stageAtual?.id === estagio.id;
          return (
            <TabsContent key={estagio.id} value={estagio.id} className="mt-0 focus-visible:outline-none">
              {ativo ? (
                <div
                  className={cn(
                    "animate-fade-in rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.96))] p-3 shadow-[var(--shadow-sm)]",
                    getColumnTint(estagio),
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{estagio.nome}</p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{negocios.length} negócios</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {negocios.length === 0 ? (
                      <EmptyState
                        titulo={modoFocoPendencias ? "Sem pendências" : "Nenhum negócio"}
                        descricao={modoFocoPendencias ? "Esta etapa está limpa" : "Deslize para trocar de estágio"}
                        variant="leads"
                        className="py-10"
                      />
                    ) : (
                      negocios.map((negocio) => {
                        const pendencias = pendenciasPorNegocio[negocio.id];
                        const visualCue = getNegocioVisualCue(negocio, estagio);
                        const diasParados = Math.floor((Date.now() - new Date(negocio.atualizado_em).getTime()) / (1000 * 60 * 60 * 24));

                        return (
                          <button
                            key={negocio.id}
                            type="button"
                            className={cn(
                              "min-h-11 w-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 text-left shadow-[var(--shadow-sm)] active:scale-[0.99]",
                              visualCue.border,
                              getClasseBordaGravidade(pendenciasPorNegocio[negocio.id]?.gravidadeMaxima),
                            )}
                            onClick={() => onNegocioClick(negocio)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{negocio.nome}</p>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">{negocio.telefone}</p>
                                <p className="mt-3 text-lg font-semibold text-[var(--success)]">{formataMoeda(negocio.valor_oportunidade)}</p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  {negocio.origem ? (
                                    <span className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-full border border-[var(--border-subtle)] px-3 text-[11px] text-[var(--text-secondary)]">
                                      {negocio.origem === "ANUNCIO_CTWA" ? <Megaphone className="h-3.5 w-3.5" /> : negocio.origem === "SINCRONIZACAO_WHATSAPP" ? <MessageCircle className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
                                      {negocio.origem === "ANUNCIO_CTWA" ? "Anúncio" : negocio.origem === "SINCRONIZACAO_WHATSAPP" ? "WhatsApp" : "Manual"}
                                    </span>
                                  ) : null}
                                  {diasParados > 3 && estagio.tipo !== "GANHO" && estagio.tipo !== "PERDIDO" ? (
                                    <span className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-full border border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.12)] px-3 text-[11px] text-[color:#fde68a]">
                                      <Clock className="h-3.5 w-3.5" /> {diasParados}d parado
                                    </span>
                                  ) : null}
                                  {pendencias?.naoResolvidas ? (
                                    <span className={cn(
                                      "inline-flex min-h-11 min-w-11 items-center gap-1 rounded-full border px-3 text-[11px]",
                                      pendencias.gravidadeMaxima === "critica" && "border-[color:rgba(244,63,94,0.28)] bg-[color:rgba(244,63,94,0.12)] text-[color:#fecdd3]",
                                      pendencias.gravidadeMaxima === "alerta" && "border-[color:rgba(245,158,11,0.28)] bg-[color:rgba(245,158,11,0.12)] text-[color:#fde68a]",
                                      pendencias.gravidadeMaxima === "info" && "border-[color:rgba(56,189,248,0.28)] bg-[color:rgba(56,189,248,0.12)] text-[color:#bae6fd]",
                                    )}>
                                      <AlertTriangle className="h-3.5 w-3.5" /> {pendencias.naoResolvidas}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                {visualCue.circle ? <span className={visualCue.circle} /> : null}
                                {funcionarios.length > 0 && negocio.id_funcionario ? (
                                  <span className="max-w-[7rem] truncate text-[11px] text-[var(--text-tertiary)]">
                                    {funcionarios.find((f) => f.id === negocio.id_funcionario)?.nome || "Responsável"}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function getColumnTint(estagio: Estagio): string {
  if (estagio.tipo === "GANHO") {
    return "bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(12,12,14,0.92))]";
  }
  if (estagio.tipo === "PERDIDO") {
    return "bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(12,12,14,0.92))]";
  }
  if (estagio.nome === "Pré Aprovação") {
    return "bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(12,12,14,0.92))]";
  }
  return "bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(12,12,14,0.94))]";
}

function getNegocioVisualCue(_negocio: Lead, estagio: Estagio): NegocioVisualCue {
  // Visual cue simplificado - apenas pendências de estágio parado
  if (estagio.tipo === "GANHO") {
    return {
      circle: "h-2.5 w-2.5 rounded-full bg-emerald-500",
      border: "border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.08)]",
      emoji: null,
    };
  }

  if (estagio.tipo === "PERDIDO") {
    return {
      circle: "h-2 w-2 rounded-full bg-slate-400",
      border: "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.04)]",
      emoji: null,
    };
  }

  return {
    circle: null,
    border: null,
    emoji: null,
  };
}

function formatarTempoRelativo(atualizadoEm: string, agoraMs: number): string {
  const atualizadoMs = new Date(atualizadoEm).getTime();
  if (Number.isNaN(atualizadoMs)) return "";

  const diff = agoraMs - atualizadoMs;
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (dias <= 0) return "Hoje";
  if (dias === 1) return "Ontem";
  if (dias < 7) return `${dias}d atras`;
  if (dias < 30) return `${Math.floor(dias / 7)} sem atras`;
  return `${Math.floor(dias / 30)}m atras`;
}

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
  const [agoraMs, setAgoraMs] = useState<number | null>(() => typeof window === "undefined" ? null : Date.now());

  useEffect(() => {
    const intervalo = window.setInterval(() => setAgoraMs(Date.now()), 60000);
    return () => window.clearInterval(intervalo);
  }, []);

  return (
    <>
        <MobilePaneKanban
          estagios={estagios}
          negociosFiltradosPorEstagio={negociosFiltradosPorEstagio}
          pendenciasPorNegocio={pendenciasPorNegocio}
          onNegocioClick={onNegocioClick}
          stageIdAtivo={stageIdAtivo}
          setStageIdAtivo={setStageIdAtivo}
          modoFocoPendencias={modoFocoPendencias}
          funcionarios={funcionarios}
        />
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="hidden lg:flex lg:flex-nowrap lg:gap-4 lg:overflow-x-auto lg:overflow-y-hidden lg:pb-2 w-full max-w-full">
        {estagios.map((estagio) => {
          const negocios = negociosFiltradosPorEstagio[estagio.id] ?? [];
          
          return (
            <Droppable key={estagio.id} droppableId={estagio.id}>
              {(provided, snapshot) => (
                <div
                  className={cn(
                    "min-w-[280px] max-w-[320px] shrink-0 rounded-[var(--radius-card)] border border-[var(--border-subtle)] p-4 shadow-[var(--shadow-sm)] transition-all duration-300 h-full flex flex-col",
                    getColumnTint(estagio),
                    snapshot.isDraggingOver 
                      ? "border-[color:rgba(56,189,248,0.28)] bg-[color:rgba(56,189,248,0.08)] shadow-[0_20px_40px_-28px_rgba(56,189,248,0.5)]" 
                      : "hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
                  )}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          estagio.tipo === "GANHO" && "bg-emerald-500",
                          estagio.tipo === "PERDIDO" && "bg-slate-500",
                          estagio.tipo === "ABERTO" && estagio.nome === "Pré Aprovação" && "bg-amber-400",
                          estagio.tipo === "ABERTO" && estagio.nome !== "Pré Aprovação" && "bg-blue-400",
                        )}
                      />
                       <p className="text-sm font-semibold text-[var(--text-primary)]">
                         {estagio.nome} <span className="font-normal text-[var(--text-tertiary)]">({negocios.length})</span>
                      </p>
                    </div>
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
                            (() => {
                              const pendencias = pendenciasPorNegocio[negocio.id];
                              const visualCue = getNegocioVisualCue(negocio, estagio);
                              const diasParados = agoraMs 
                                ? Math.floor((agoraMs - new Date(negocio.atualizado_em).getTime()) / (1000 * 60 * 60 * 24))
                                : 0;
                              
                              return (
                            <OptimisticSync active={negocio.id.startsWith("temp-")} className="cursor-wait">
                              <Card
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                                {...draggableProvided.dragHandleProps}
                                className={cn(
                                  negocio.id.startsWith("temp-") ? "bg-transparent" : "cursor-pointer rounded-[var(--radius-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]",
                                  visualCue.border,
                                  getClasseBordaGravidade(pendenciasPorNegocio[negocio.id]?.gravidadeMaxima),
                                  draggableSnapshot.isDragging && "shadow-2xl scale-[1.02] rotate-1 opacity-90"
                                )}
                                onClick={() => {
                                  if (negocio.id.startsWith("temp-")) return;
                                  onNegocioClick(negocio);
                                }}
                              >
                                <CardContent className="p-4">
                                  {/* Nome em destaque */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <h3 className="flex items-center gap-1.5 truncate text-base font-semibold text-[var(--text-primary)]">
                                        {!negocio.id.startsWith("temp-") && draggableProvided.dragHandleProps && (
                                            <GripVertical className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-tertiary)]" />
                                        )}
                                        {negocio.nome}
                                      </h3>
                                      
                                      {/* Telefone */}
                                       <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{negocio.telefone}</p>
                                      
                                      {/* Valor em destaque */}
                                       <p className="mt-2 text-lg font-semibold text-[var(--success)]">
                                        {formataMoeda(negocio.valor_oportunidade)}
                                      </p>
                                      
                                      {/* Badges de indicadores */}
                                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {/* Badge de origem */}
                                        {negocio.origem && (
                                          <span className={cn(
                                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                                            negocio.origem === "ANUNCIO_CTWA" && "border-[color:rgba(139,92,246,0.28)] bg-[color:rgba(139,92,246,0.12)] text-[color:#ddd6fe]",
                                            negocio.origem === "SINCRONIZACAO_WHATSAPP" && "border-[color:rgba(16,185,129,0.28)] bg-[color:rgba(16,185,129,0.12)] text-[color:#bbf7d0]",
                                            negocio.origem === "MANUAL" && "border-[color:rgba(56,189,248,0.28)] bg-[color:rgba(56,189,248,0.12)] text-[color:#c8f3ff]"
                                          )}>
                                            {negocio.origem === "ANUNCIO_CTWA" && <Megaphone className="w-3 h-3" />}
                                            {negocio.origem === "SINCRONIZACAO_WHATSAPP" && <MessageCircle className="w-3 h-3" />}
                                            {negocio.origem === "MANUAL" && <PenLine className="w-3 h-3" />}
                                            {negocio.origem === "ANUNCIO_CTWA" ? "Anúncio" : negocio.origem === "SINCRONIZACAO_WHATSAPP" ? "WhatsApp" : "Manual"}
                                          </span>
                                        )}
                                        {diasParados > 3 && estagio.tipo !== "GANHO" && estagio.tipo !== "PERDIDO" ? (
                                           <span className="inline-flex items-center gap-1 rounded-full border border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.12)] px-2 py-0.5 text-xs font-medium text-[color:#fcd34d]">
                                            <Clock className="w-3 h-3" /> {diasParados}d parado
                                          </span>
                                        ) : null}
                                        {pendencias?.naoResolvidas && pendencias.naoResolvidas > 0 && !estagio.nome.includes("Pré Aprovação") ? (
                                          <span className={cn(
                                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                                             pendencias.gravidadeMaxima === "critica" && "border-[color:rgba(244,63,94,0.28)] bg-[color:rgba(244,63,94,0.12)] text-[color:#fecdd3]",
                                             pendencias.gravidadeMaxima === "alerta" && "border-[color:rgba(245,158,11,0.28)] bg-[color:rgba(245,158,11,0.12)] text-[color:#fde68a]",
                                             pendencias.gravidadeMaxima === "info" && "border-[color:rgba(56,189,248,0.28)] bg-[color:rgba(56,189,248,0.12)] text-[color:#bae6fd]"
                                          )}>
                                            <AlertTriangle className="w-3 h-3" /> {pendencias.naoResolvidas} pendência{pendencias.naoResolvidas > 1 ? 's' : ''}
                                          </span>
                                        ) : null}
                                      </div>
                                      
                                      {/* Responsável e tempo */}
                                       <div className="mt-2.5 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                                        {funcionarios.length > 0 && negocio.id_funcionario ? (
                                          <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {funcionarios.find(f => f.id === negocio.id_funcionario)?.nome || "Responsável"}
                                          </span>
                                        ) : null}
                                        {agoraMs !== null && (
                                          <span className="flex items-center gap-1">
                                            {agoraMs === null ? "" : formatarTempoRelativo(negocio.atualizado_em, agoraMs)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Indicador visual lateral */}
                                    <div className="flex flex-col items-end gap-1.5">
                                      {visualCue.circle ? <span className={visualCue.circle} /> : null}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </OptimisticSync>
                              );
                            })()
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
        })}
        </div>
      </DragDropContext>
    </>
  );
}
