"use client";

import type { FormEvent } from "react";
import { Loader2, Plus, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ErrosCadastroLoja } from "./equipe-loja-drawer.utils";

type EquipeLojaDrawerNewPersonFormProps = {
  aberto: boolean;
  erroCadastroApi: string | null;
  errosCadastro: ErrosCadastroLoja;
  carregandoCadastro: boolean;
  cargoNovo: string;
  onAbrir: () => void;
  onFechar: () => void;
  onCargoChange: (valor: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function EquipeLojaDrawerNewPersonForm({
  aberto,
  erroCadastroApi,
  errosCadastro,
  carregandoCadastro,
  cargoNovo,
  onAbrir,
  onFechar,
  onCargoChange,
  onSubmit,
}: EquipeLojaDrawerNewPersonFormProps) {
  if (!aberto) {
    return (
      <Button className="h-11 w-full rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] font-medium" onClick={onAbrir}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar pessoa nesta loja
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Adicionar nova pessoa</p>
        <Button type="button" variant="ghost" size="sm" className="h-8 text-[var(--text-secondary)]" onClick={onFechar}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Nome</label>
            <Input name="nome" placeholder="Nome completo" required className={cn("h-10 rounded-lg bg-[var(--surface-elevated)] border-[var(--border-subtle)]", errosCadastro.nome ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : "")} />
            {errosCadastro.nome ? <p className="mt-1 text-xs text-[var(--danger)]">{errosCadastro.nome}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Funcao</label>
            <Select value={cargoNovo} onValueChange={onCargoChange}>
              <SelectTrigger className="h-10 rounded-lg bg-[var(--surface-elevated)] border-[var(--border-subtle)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COLABORADOR">Vendedor</SelectItem>
                <SelectItem value="GERENTE">Gerente</SelectItem>
                <SelectItem value="ADMINISTRADOR">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">E-mail</label>
          <Input name="email" type="email" placeholder="email@exemplo.com" required className={cn("h-10 rounded-lg bg-[var(--surface-elevated)] border-[var(--border-subtle)]", errosCadastro.email ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : "")} />
          {errosCadastro.email ? <p className="mt-1 text-xs text-[var(--danger)]">{errosCadastro.email}</p> : null}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Senha temporaria</label>
          <Input name="senha" type="password" placeholder="Minimo 4 caracteres" required className={cn("h-10 rounded-lg bg-[var(--surface-elevated)] border-[var(--border-subtle)]", errosCadastro.senha ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : "")} />
          {errosCadastro.senha ? <p className="mt-1 text-xs text-[var(--danger)]">{errosCadastro.senha}</p> : null}
        </div>

        {erroCadastroApi ? (
          <div className="flex items-center gap-2 rounded-lg bg-[color:rgba(244,63,94,0.08)] border border-[color:rgba(244,63,94,0.2)] px-3 py-2">
            <p className="text-sm text-[var(--danger)]">{erroCadastroApi}</p>
          </div>
        ) : null}

        <Button type="submit" className="h-10 w-full rounded-lg bg-[var(--success)] text-white hover:bg-[var(--success)]/90 font-medium" disabled={carregandoCadastro}>
          {carregandoCadastro ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cadastrando...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar pessoa
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
