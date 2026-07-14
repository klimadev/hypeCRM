"use client";

import Link from "next/link";
import React from "react";
import { ArrowUpRight, Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ApiLeadContato } from "@/lib/api/leads";
import type { LeadLinhaTabela } from "../types";

type LeadsTableProps = {
  linhas: LeadLinhaTabela[];
  resumoTotal: string;
  idsSelecionados: string[];
  todosDaPaginaSelecionados: boolean;
  onAlternarSelecao: (leadId: string) => void;
  onAlternarSelecaoPagina: () => void;
  onEditar: (lead: ApiLeadContato) => void;
  onVincular: (lead: ApiLeadContato) => void;
  onRemover: (lead: ApiLeadContato) => void;
};

/** Mapeia nome da etapa para cor semântica */
function corEtapa(etapa: string): { bg: string; text: string } {
  const nome = etapa.toLowerCase();
  if (nome.includes("novo") || nome.includes("lead")) return { bg: "bg-[color-mix(in_srgb,var(--info)_14%,transparent)]", text: "text-[var(--info)]" };
  if (nome.includes("negocia") || nome.includes("proposta") || nome.includes("orçamento")) return { bg: "bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]", text: "text-[var(--warning)]" };
  if (nome.includes("fechado") || nome.includes("ganho") || nome.includes("convertido")) return { bg: "bg-[color-mix(in_srgb,var(--success)_14%,transparent)]", text: "text-[var(--success)]" };
  return { bg: "bg-[var(--surface-soft)]", text: "text-[var(--text-secondary)]" };
}

export function LeadsTable({
  linhas,
  resumoTotal,
  idsSelecionados,
  todosDaPaginaSelecionados,
  onAlternarSelecao,
  onAlternarSelecaoPagina,
  onEditar,
  onVincular,
  onRemover,
}: LeadsTableProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{linhas.length} lead{linhas.length === 1 ? "" : "s"}</p>
        <p className="text-xs text-[var(--text-tertiary)]">{resumoTotal}</p>
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <Table className="min-w-[480px] w-full">
          <TableHeader className="sticky top-0 z-10 bg-[var(--surface-elevated)]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={todosDaPaginaSelecionados}
                  onChange={() => onAlternarSelecaoPagina()}
                  aria-label="Selecionar página"
                  className="h-4 w-4 rounded border border-[var(--border-strong)] bg-transparent accent-[var(--brand)]"
                />
              </TableHead>
              <TableHead>Lead</TableHead>
              <TableHead className="hidden sm:table-cell">Telefone</TableHead>
              <TableHead className="hidden md:table-cell">Responsável</TableHead>
              <TableHead className="hidden lg:table-cell">Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((linha) => {
              const selecionado = idsSelecionados.includes(linha.id);
              const badge = corEtapa(linha.etapa);
              return (
                <TableRow
                  key={linha.id}
                  className={cn(
                    "border-[var(--border-subtle)] transition-colors",
                    selecionado && "bg-[color-mix(in_srgb,var(--brand)_6%,transparent)] shadow-[inset_3px_0_0_var(--brand)]",
                    !selecionado && "hover:bg-[var(--surface-soft)]",
                  )}
                  onClick={(e?: React.MouseEvent<HTMLTableRowElement>) => {
                    if (!e) return;
                    const target = e.target as HTMLElement;
                    if (target.tagName === "BUTTON" || target.tagName === "A" || target.tagName === "INPUT" || target.closest("button, a, [role=button], input")) return;
                    onAlternarSelecao(linha.id);
                  }}
                >
                  <TableCell className="py-4">
                    <input
                      type="checkbox"
                      checked={selecionado}
                      onChange={() => onAlternarSelecao(linha.id)}
                      aria-label={`Selecionar ${linha.nome}`}
                      className="h-4 w-4 rounded border border-[var(--border-strong)] bg-transparent accent-[var(--brand)]"
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--text-primary)]">{linha.nome}</p>
                        <span className={cn("mt-0.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium", badge.bg, badge.text)}>
                          {linha.etapa}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden py-4 text-[var(--text-secondary)] sm:table-cell">
                    <span className="tabular-nums">{linha.telefone}</span>
                  </TableCell>
                  <TableCell className="hidden py-4 text-[var(--text-secondary)] md:table-cell">{linha.responsavel}</TableCell>
                  <TableCell className="hidden py-4 text-[var(--text-secondary)] lg:table-cell">{linha.origem}</TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {linha.idNegocio ? (
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0 text-[var(--info)]">
                          <Link href={`/kanban?negocio=${linha.idNegocio}`} title="Ver negócio">
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                      <Popover>
                        <PopoverTrigger className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]">
                          <MoreHorizontal className="h-4 w-4" />
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-1">
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => onEditar(linha.lead)}
                              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)]"
                            >
                              <Pencil className="h-4 w-4 text-[var(--text-secondary)]" />
                              Editar lead
                            </button>
                            <button
                              type="button"
                              onClick={() => onVincular(linha.lead)}
                              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)]"
                            >
                              <Link2 className="h-4 w-4 text-[var(--text-secondary)]" />
                              {linha.idNegocio ? "Trocar vínculo" : "Vincular negócio"}
                            </button>
                            <hr className="my-0.5 border-[var(--border-subtle)]" />
                            <button
                              type="button"
                              onClick={() => onRemover(linha.lead)}
                              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remover
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
