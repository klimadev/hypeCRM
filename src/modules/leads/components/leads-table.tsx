"use client";

import Link from "next/link";
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
    <section className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Leads ({linhas.length})</p>
        <p className="text-xs text-[var(--text-secondary)]">{resumoTotal}</p>
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <Table className="min-w-[600px] w-full">
          <TableHeader className="sticky top-0 z-10 bg-[var(--surface-elevated)]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={todosDaPaginaSelecionados}
                  onChange={() => onAlternarSelecaoPagina()}
                  aria-label="Selecionar página"
                  className="h-4 w-4 rounded border border-[var(--border-strong)] bg-transparent accent-[var(--brand)]"
                />
              </TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead className="hidden md:table-cell">Responsável</TableHead>
              <TableHead className="hidden lg:table-cell">PDV</TableHead>
              <TableHead className="hidden xl:table-cell">Origem</TableHead>
              <TableHead className="hidden xl:table-cell">Valor</TableHead>
              <TableHead className="hidden lg:table-cell">Atualizado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((linha) => {
              const selecionado = idsSelecionados.includes(linha.id);
              return (
                <TableRow
                  key={linha.id}
                  className={cn(
                    "cursor-pointer border-[var(--border-subtle)] transition-colors",
                    selecionado && "bg-[var(--brand)]/5 shadow-[inset_3px_0_0_var(--brand)]",
                  )}
                  onClick={(e) => {
                    // Ignore clicks on interactive elements
                    const target = e.target as HTMLElement;
                    if (target.tagName === "BUTTON" || target.tagName === "A" || target.tagName === "INPUT" || target.closest("button, a, [role=button], input")) return;
                    onAlternarSelecao(linha.id);
                  }}
                >
                  <TableCell className="py-3">
                    <input
                      type="checkbox"
                      checked={selecionado}
                      onChange={() => onAlternarSelecao(linha.id)}
                      aria-label={`Selecionar ${linha.nome}`}
                      className="h-4 w-4 rounded border border-[var(--border-strong)] bg-transparent accent-[var(--brand)]"
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--text-primary)]">{linha.nome}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{linha.id}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-[var(--text-secondary)]">{linha.telefone}</TableCell>
                  <TableCell className="py-3 text-[var(--text-secondary)]">{linha.etapa}</TableCell>
                  <TableCell className="hidden py-3 text-[var(--text-secondary)] md:table-cell">{linha.responsavel}</TableCell>
                  <TableCell className="hidden py-3 text-[var(--text-secondary)] lg:table-cell">{linha.pdv}</TableCell>
                  <TableCell className="hidden py-3 text-[var(--text-secondary)] xl:table-cell">{linha.origem}</TableCell>
                  <TableCell className="hidden py-3 font-semibold text-[var(--text-primary)] xl:table-cell">{linha.valor}</TableCell>
                  <TableCell className="hidden py-3 text-[var(--text-secondary)] lg:table-cell">{linha.atualizadoEm}</TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {linha.idNegocio ? (
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--info)]">
                          <Link href={`/kanban?negocio=${linha.idNegocio}`} title="Abrir negócio">
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEditar(linha.lead)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Mais ações">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" sideOffset={4} className="w-48 p-1">
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => onVincular(linha.lead)}
                              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)]"
                            >
                              <Link2 className="h-4 w-4 text-[var(--text-secondary)]" />
                              {linha.idNegocio ? "Trocar vínculo" : "Vincular negócio"}
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemover(linha.lead)}
                              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)]/10"
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
