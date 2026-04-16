"use client";

import { FolderOpen, Play, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)]">
        <CardHeader>
          <CardTitle className="text-base">Nenhum funil encontrado</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Ainda não há funis cadastrados para esta empresa.
            </p>
            {podeGerenciar && onCreatePipeline && (
              <Button
                onClick={onCreatePipeline}
                className="w-full rounded-xl bg-[var(--brand)]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Pipeline
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.94))] p-4 shadow-[var(--shadow-sm)] md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Kanban</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Escolha um funil para abrir</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Cada funil possui seu próprio conjunto de estágios e negócios.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {podeGerenciar && onCreatePipeline && (
              <Button
                onClick={onCreatePipeline}
                size="sm"
                className="rounded-xl bg-[var(--brand)]"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Novo</span>
              </Button>
            )}
            <div className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] p-2 text-[var(--text-secondary)]">
              <FolderOpen className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pipelines.map((pipeline) => {
          const estaSelecionada = pipeline.id === selecionadaId;

          return (
            <Card
              key={pipeline.id}
              className={
                estaSelecionada
                  ? "border-[color:rgba(139,92,246,0.5)] bg-[color:rgba(139,92,246,0.08)]"
                  : "bg-[var(--surface)]"
              }
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{pipeline.nome}</CardTitle>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {pipeline.descricao ?? "Funil comercial"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {pipeline.padrao ? (
                      <span className="inline-flex rounded-full border border-[color:rgba(139,92,246,0.4)] bg-[color:rgba(139,92,246,0.18)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[color:#ddd6fe]">
                        Padrão
                      </span>
                    ) : null}
                    {podeGerenciar && onEditPipeline && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditPipeline(pipeline)}
                        className="h-8 w-8 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-elevated)]"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="mb-4 text-xs text-[var(--text-tertiary)]">
                  {pipeline.slug}
                </p>

                <Button
                  size="sm"
                  className="w-full rounded-xl bg-[var(--surface-elevated)] text-sm font-medium"
                  onClick={() => onOpenPipeline(pipeline.id)}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Abrir quadro
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}