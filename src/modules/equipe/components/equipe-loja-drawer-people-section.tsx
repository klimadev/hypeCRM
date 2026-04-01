"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, Loader2, Pencil, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "./shared/avatar";
import { cn } from "@/lib/utils";
import type { Funcionario } from "../types";
import { nomeCargoEquipe, type DirecaoOrdenacaoLoja, type FuncionarioLojaItem, type OrdenacaoLoja } from "./equipe-loja-drawer.utils";

type EquipeLojaDrawerPeopleSectionProps = {
  busca: string;
  ordenacao: OrdenacaoLoja;
  direcao: DirecaoOrdenacaoLoja;
  carregandoLista: boolean;
  alertaConfiguracao: boolean;
  quantidadePessoas: number;
  pessoas: FuncionarioLojaItem[];
  podeGerenciarEmpresa: boolean;
  onBuscaChange: (valor: string) => void;
  onOrdenar: (campo: OrdenacaoLoja) => void;
  onEditar: (pessoa: FuncionarioLojaItem) => void;
  onInativar: (pessoaId: string) => void;
  getFuncionarioOriginal: (pessoaId: string) => Funcionario | undefined;
};

function iconeOrdenacao(ordenacao: OrdenacaoLoja, direcao: DirecaoOrdenacaoLoja, campo: OrdenacaoLoja) {
  if (ordenacao !== campo) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />;
  }

  return direcao === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-[var(--text-primary)]" /> : <ArrowDown className="h-3.5 w-3.5 text-[var(--text-primary)]" />;
}

function StatusBadge({ ativo }: { ativo: boolean }) {
  if (ativo) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[color:rgba(16,185,129,0.2)] bg-[color:rgba(16,185,129,0.1)] px-2 py-0.5 text-xs font-medium text-[var(--success)]">
        <CheckCircle2 className="h-3 w-3" />
        Ativo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[color:rgba(245,158,11,0.2)] bg-[color:rgba(245,158,11,0.1)] px-2 py-0.5 text-xs font-medium text-[var(--warning)]">
      <X className="h-3 w-3" />
      Inativo
    </span>
  );
}

export function EquipeLojaDrawerPeopleSection({
  busca,
  ordenacao,
  direcao,
  carregandoLista,
  alertaConfiguracao,
  quantidadePessoas,
  pessoas,
  podeGerenciarEmpresa,
  onBuscaChange,
  onOrdenar,
  onEditar,
  onInativar,
  getFuncionarioOriginal,
}: EquipeLojaDrawerPeopleSectionProps) {
  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <Input value={busca} onChange={(event) => onBuscaChange(event.target.value)} placeholder="Buscar por nome ou e-mail..." className="h-10 pl-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]" />
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-1.5">
        <Button type="button" size="sm" variant={ordenacao === "nome" ? "secondary" : "ghost"} className="h-8 rounded-md text-xs" onClick={() => onOrdenar("nome")}>
          Nome {iconeOrdenacao(ordenacao, direcao, "nome")}
        </Button>
        <Button type="button" size="sm" variant={ordenacao === "email" ? "secondary" : "ghost"} className="h-8 rounded-md text-xs" onClick={() => onOrdenar("email")}>
          E-mail {iconeOrdenacao(ordenacao, direcao, "email")}
        </Button>
        <Button type="button" size="sm" variant={ordenacao === "cargo" ? "secondary" : "ghost"} className="h-8 rounded-md text-xs" onClick={() => onOrdenar("cargo")}>
          Funcao {iconeOrdenacao(ordenacao, direcao, "cargo")}
        </Button>
        <Button type="button" size="sm" variant={ordenacao === "status" ? "secondary" : "ghost"} className="h-8 rounded-md text-xs" onClick={() => onOrdenar("status")}>
          Status {iconeOrdenacao(ordenacao, direcao, "status")}
        </Button>
      </div>

      <div className="px-6 pb-6 space-y-3">
        {carregandoLista ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)] mt-3">Carregando pessoas...</p>
          </div>
        ) : pessoas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[color:rgba(255,255,255,0.05)]">
              <Search className="h-6 w-6 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{busca ? "Nenhuma pessoa encontrada" : "Nenhuma pessoa nesta loja"}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{busca ? "Tente buscar por outro termo" : "Adicione sua primeira pessoa"}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {pessoas.map((pessoa) => (
              <li key={pessoa.id} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar nome={pessoa.nome} tamanho="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{pessoa.nome}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{pessoa.email}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{nomeCargoEquipe(pessoa.cargo)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge ativo={pessoa.ativo} />

                  {podeGerenciarEmpresa ? (
                    <div className="flex items-center gap-1">
                      <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg text-[var(--text-secondary)]" onClick={() => onEditar(pessoa)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {pessoa.ativo ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={cn("h-8 rounded-lg text-[var(--danger)] hover:bg-[color:rgba(244,63,94,0.08)]", alertaConfiguracao && quantidadePessoas === 0 ? "" : "")}
                          onClick={() => {
                            const alvo = getFuncionarioOriginal(pessoa.id);
                            if (alvo) {
                              onInativar(alvo.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
