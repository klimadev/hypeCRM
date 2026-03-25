"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UseEquipeModuleReturn } from "../../types";

type NovoFuncionarioDialogProps = {
  vm: UseEquipeModuleReturn;
};

export function NovoFuncionarioDialog({ vm }: NovoFuncionarioDialogProps) {
  // GERENTE só pode adicionar COLABORADOR no próprio PDV
  const isGerente = vm.podeAdicionarFuncionario && !vm.podeGerenciarEmpresa;
  const cargosDisponiveis = isGerente
    ? [{ value: "COLABORADOR", label: "Colaborador" }]
    : [
        { value: "COLABORADOR", label: "Colaborador" },
        { value: "GERENTE", label: "Gerente" },
        { value: "ADMINISTRADOR", label: "Administrador" },
      ];

  return (
    <Dialog
      open={vm.dialogNovoFuncionarioAberto}
      onOpenChange={(aberto) => {
        vm.setDialogNovoFuncionarioAberto(aberto);
        if (!aberto) {
          vm.setErroLista(null);
        }
      }}
    >
      <DialogContent className="rounded-[var(--radius-card)]">
        <DialogHeader>
          <DialogTitle>Novo colaborador</DialogTitle>
        </DialogHeader>

        <form className="space-y-3" onSubmit={vm.adicionarFuncionario}>
          <Input
            className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]"
            name="nome"
            placeholder="Nome completo"
            required
          />
          <Input
            className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]"
            name="email"
            type="email"
            placeholder="E-mail"
            required
          />
          <Input
            className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]"
            name="senha"
            type="password"
            placeholder="Senha temporaria"
            required
          />

          <Select
            name="cargo"
            value={vm.cargoSelecionado}
            onValueChange={vm.setCargoSelecionado}
          >
            <SelectTrigger className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              {cargosDisponiveis.map((cargo) => (
                <SelectItem key={cargo.value} value={cargo.value}>
                  {cargo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isGerente ? (
            <input type="hidden" name="id_pdv" value={vm.pdvSelecionado} />
          ) : (
            <Select
              name="id_pdv"
              value={vm.pdvSelecionado}
              onValueChange={vm.setPdvSelecionado}
            >
              <SelectTrigger className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
                <SelectValue placeholder="PDV" />
              </SelectTrigger>
              <SelectContent>
                {vm.pdvs.map((pdv) => (
                  <SelectItem key={pdv.id} value={pdv.id}>
                    {pdv.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {vm.erroCadastro ? <p className="text-sm font-medium text-[var(--danger)]">{vm.erroCadastro}</p> : null}

          <Button className="w-full rounded-[var(--radius-control)] font-medium" type="submit" disabled={vm.carregandoCadastro}>
            {vm.carregandoCadastro ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Cadastrando...
              </span>
            ) : (
              "Cadastrar"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
