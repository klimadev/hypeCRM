"use client";

import Link from "next/link";
import { ArrowUpRight, Link2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function LeadsTable({ linhas, resumoTotal, idsSelecionados, todosDaPaginaSelecionados, onAlternarSelecao, onAlternarSelecaoPagina, onEditar, onVincular, onRemover }: LeadsTableProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Leads ({linhas.length})</p>
        <p className="text-xs text-[var(--text-secondary)]">{resumoTotal}</p>
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <Table className="min-w-[900px] w-full">
          <TableHeader className="sticky top-0 bg-[var(--surface-elevated)]">
            <TableRow className="hover:bg-[color:rgba(255,255,255,0.03)]">
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
              <TableHead>Responsável</TableHead>
              <TableHead>PDV</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="text-right">Negócio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((linha) => (
              <TableRow key={linha.id} className="border-[var(--border-subtle)]">
                <TableCell className="py-4">
                  <input
                    type="checkbox"
                    checked={idsSelecionados.includes(linha.id)}
                    onChange={() => onAlternarSelecao(linha.id)}
                    aria-label={`Selecionar ${linha.nome}`}
                    className="h-4 w-4 rounded border border-[var(--border-strong)] bg-transparent accent-[var(--brand)]"
                  />
                </TableCell>
                <TableCell className="py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--text-primary)]">{linha.nome}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{linha.id}</p>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-[var(--text-secondary)]">{linha.telefone}</TableCell>
                <TableCell className="py-4 text-[var(--text-secondary)]">{linha.etapa}</TableCell>
                <TableCell className="py-4 text-[var(--text-secondary)]">{linha.responsavel}</TableCell>
                <TableCell className="py-4 text-[var(--text-secondary)]">{linha.pdv}</TableCell>
                <TableCell className="py-4 text-[var(--text-secondary)]">{linha.origem}</TableCell>
                <TableCell className="py-4 font-semibold text-[var(--text-primary)]">{linha.valor}</TableCell>
                <TableCell className="py-4 text-[var(--text-secondary)]">{linha.atualizadoEm}</TableCell>
                <TableCell className="py-4 text-right">
                  <div className="flex flex-col items-end gap-2">
                    {linha.idNegocio ? (
                      <div className="max-w-[18rem] text-right">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{linha.negocioResumo.titulo}</p>
                        <p className="truncate text-xs text-[var(--text-secondary)]">{linha.negocioResumo.subtitulo}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--text-tertiary)]">Sem negócio vinculado</span>
                    )}

                    <div className="flex items-center gap-2">
                      {linha.idNegocio ? (
                        <Button asChild variant="ghost" size="sm" className="text-[var(--info)] hover:bg-[color:rgba(56,189,248,0.08)] hover:text-[var(--info-alt)]">
                          <Link href={`/kanban?negocio=${linha.idNegocio}`} title="Abrir negócio vinculado">
                            <ArrowUpRight className="mr-1 h-4 w-4" />
                            Abrir
                          </Link>
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-[var(--radius-control)]"
                        onClick={() => onEditar(linha.lead)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Button>

                      <Button
                        type="button"
                        variant={linha.idNegocio ? "outline" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-8 rounded-[var(--radius-control)]",
                          !linha.idNegocio ? "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]" : "",
                        )}
                        onClick={() => onVincular(linha.lead)}
                      >
                        <Link2 className="mr-1 h-4 w-4" />
                        {linha.idNegocio ? "Trocar vínculo" : "Vincular"}
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-8 rounded-[var(--radius-control)]"
                        onClick={() => onRemover(linha.lead)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
