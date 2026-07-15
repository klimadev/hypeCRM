"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Estagio, Funcionario, Lead, PendenciaNegocioInfo } from "../types";
import { EmptyState } from "./empty-state";
import { KanbanNegocioCardContent } from "./kanban-negocio-card-content";
import { obterSinalVisualNegocioKanban, obterTintColunaKanban, obterClasseIndicadorEtapaKanban } from "./kanban-board.utils";

type KanbanBoardMobileProps = {
  estagios: Estagio[];
  negociosFiltradosPorEstagio: Record<string, Lead[]>;
  pendenciasPorNegocio: Record<string, PendenciaNegocioInfo>;
  onNegocioClick: (negocio: Lead) => void;
  stageIdAtivo: string;
  setStageIdAtivo: (stageId: string) => void;
  modoFocoPendencias?: boolean;
  funcionarios?: Funcionario[];
  agoraMs: number;
};

export function KanbanBoardMobile({
  estagios,
  negociosFiltradosPorEstagio,
  pendenciasPorNegocio,
  onNegocioClick,
  stageIdAtivo,
  setStageIdAtivo,
  modoFocoPendencias = false,
  funcionarios = [],
  agoraMs,
}: KanbanBoardMobileProps) {
  const stageAtual = estagios.find((estagio) => estagio.id === stageIdAtivo) ?? estagios[0] ?? null;

  return (
    <div className="lg:hidden">
      <Tabs value={stageIdAtivo} onValueChange={setStageIdAtivo} className="flex flex-col gap-3">
        <div className="sticky top-0 z-10 -mx-3 border-b border-[var(--border-subtle)] bg-[var(--canvas)] px-3 pb-2 pt-2">
          <TabsList className="flex h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-none border-0 bg-transparent p-0 shadow-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {estagios.map((estagio) => {
              const negocios = negociosFiltradosPorEstagio[estagio.id] ?? [];
              return (
                <TabsTrigger
                  key={estagio.id}
                  value={estagio.id}
                  className="min-h-9 shrink-0 rounded-full border border-[var(--border-subtle)] px-3 text-[12px] font-medium text-[var(--text-secondary)] transition-colors duration-150 data-[state=active]:border-[color-mix(in_srgb,var(--brand)_42%,transparent)] data-[state=active]:bg-[var(--brand-soft)] data-[state=active]:text-[var(--text-primary)]"
                >
                  <span className="flex items-center gap-1.5">
                    {estagio.nome}
                    <span className="tabular-nums text-[var(--text-tertiary)]">{negocios.length}</span>
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
                    "rounded-xl border border-[var(--border-subtle)] p-3",
                    obterTintColunaKanban(estagio),
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", obterClasseIndicadorEtapaKanban(estagio))} />
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">{estagio.nome}</p>
                    </div>
                    <span className="text-[11px] tabular-nums text-[var(--text-tertiary)]">{negocios.length}</span>
                  </div>

                  <div className="space-y-2">
                    {negocios.length === 0 ? (
                      <EmptyState
                        titulo={modoFocoPendencias ? "Sem pendências" : "Nenhum negócio"}
                        descricao={modoFocoPendencias ? "Esta etapa está limpa" : "Deslize para trocar de estágio"}
                        variant="leads"
                        className="py-10"
                      />
                    ) : (
                      negocios.map((negocio) => (
                        <button
                          key={negocio.id}
                          type="button"
                          className={cn(
                            "min-h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-left transition-colors duration-150",
                            obterSinalVisualNegocioKanban(estagio).border,
                          )}
                          onClick={() => onNegocioClick(negocio)}
                        >
                          <KanbanNegocioCardContent
                            negocio={negocio}
                            estagio={estagio}
                            pendencias={pendenciasPorNegocio[negocio.id]}
                            funcionarios={funcionarios}
                            agoraMs={agoraMs}
                            visualCue={obterSinalVisualNegocioKanban(estagio)}
                            compact
                          />
                        </button>
                      ))
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
