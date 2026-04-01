"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Estagio, Funcionario, Lead, PendenciaNegocioInfo } from "../types";
import { EmptyState } from "./empty-state";
import { KanbanNegocioCardContent } from "./kanban-negocio-card-content";
import { obterSinalVisualNegocioKanban, obterTintColunaKanban } from "./kanban-board.utils";
import { obterDescricaoEtapaKanban, obterResumoOperacionalColuna } from "../utils/apresentacao";

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
        <div className="sticky top-0 z-10 -mx-3 border-b border-[var(--border-subtle)] bg-[color:rgba(9,9,11,0.96)] px-3 pb-3 pt-2">
          <TabsList className="flex h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-0 bg-transparent p-0 shadow-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {estagios.map((estagio) => {
              const negocios = negociosFiltradosPorEstagio[estagio.id] ?? [];
              return (
                <TabsTrigger
                  key={estagio.id}
                  value={estagio.id}
                  className="min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium text-[var(--text-secondary)] data-[state=active]:border-[color:rgba(124,58,237,0.32)] data-[state=active]:bg-[color:rgba(124,58,237,0.16)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[0_14px_30px_-22px_rgba(124,58,237,0.75)]"
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
                    "animate-fade-in rounded-[var(--radius-card)] border border-[var(--border-subtle)] p-3 shadow-[var(--shadow-sm)]",
                    obterTintColunaKanban(estagio),
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{estagio.nome}</p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{obterDescricaoEtapaKanban(estagio)}</p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">{obterResumoOperacionalColuna({ estagio, negocios, pendenciasPorNegocio, agoraMs })}</p>
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
                      negocios.map((negocio) => (
                        <button
                          key={negocio.id}
                          type="button"
                          className={cn(
                            "min-h-11 w-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 text-left shadow-[var(--shadow-sm)] active:scale-[0.99]",
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
