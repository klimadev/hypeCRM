"use client";

import { Play, Plus, Settings, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Pipeline } from "../types";

type KanbanPipelineCatalogProps = {
  pipelines: Pipeline[];
  onOpenPipeline: (pipelineId: string) => void;
  onCreatePipeline?: () => void;
  onEditPipeline?: (pipeline: Pipeline) => void;
  selecionadaId?: string;
  perfil?: "EMPRESA" | "GERENTE" | "COLABORADOR";
};

export function KanbanPipelineCatalog({
  pipelines,
  onOpenPipeline,
  onCreatePipeline,
  onEditPipeline,
  selecionadaId,
  perfil,
}: KanbanPipelineCatalogProps) {
  const podeGerenciar = perfil === "EMPRESA" || perfil === "GERENTE";

  if (pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-soft)]">
          <FolderOpen className="h-10 w-10 text-[var(--text-tertiary)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Nenhum funil encontrado
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Crie seu primeiro funil em 10 segundos
          </p>
        </div>
        {podeGerenciar && onCreatePipeline && (
          <Button onClick={onCreatePipeline} className="rounded-xl bg-[var(--brand)]">
            <Plus className="mr-2 h-4 w-4" />
            Criar primeiro funil
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Seus funis
        </h2>
        {podeGerenciar && onCreatePipeline && (
          <Button
            onClick={onCreatePipeline}
            size="sm"
            className="rounded-xl bg-[var(--brand)]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Novo funil
          </Button>
        )}
      </div>

      {/* Lista vertical */}
      <div className="space-y-2">
        {pipelines.map((pipeline) => {
          const estaSelecionada = pipeline.id === selecionadaId;

          return (
            <Card
              key={pipeline.id}
              className={
                estaSelecionada
                  ? "border-[color-mix(in_srgb,var(--brand)_50%,transparent)] bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]"
                  : "bg-[var(--surface)]"
              }
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {pipeline.nome}
                    </span>
                    {pipeline.padrao && (
                      <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--brand)_45%,transparent)] bg-[color-mix(in_srgb,var(--brand)_20%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--brand)]">
                        Padrão
                      </span>
                    )}
                  </div>
                  {pipeline.descricao && (
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      {pipeline.descricao}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {podeGerenciar && onEditPipeline && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditPipeline(pipeline)}
                      className="h-8 w-8 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-elevated)]"
                      title="Editar funil"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="rounded-xl bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
                    onClick={() => onOpenPipeline(pipeline.id)}
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                    Abrir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
