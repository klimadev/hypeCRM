"use client";

import type { FormEvent, ReactNode, RefObject } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aplicaMascaraMoedaBr } from "@/lib/utils";
import type { Funcionario } from "../types";
import { ActionButton } from "./action-button";
import { ContatoPickerNegocio } from "./contato-picker-negocio";
import type { ContatoDisponivelNegocio } from "./kanban-header.utils";

type NovoNegocioDialogProps = {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  onSubmit: (evento: FormEvent<HTMLFormElement>) => Promise<void>;
  trigger: ReactNode;
  inputNomeRef: RefObject<HTMLInputElement | null>;
  criandoNegocio: boolean;
  valorNovoNegocio: string;
  setValorNovoNegocio: (valor: string) => void;
  estagioNovoNegocio: string;
  estagioAberto: string;
  setEstagioNovoNegocio: (estagio: string) => void;
  cargoNovoNegocio: { id_funcionario: string } | null;
  setCargoNovoNegocio: (cargo: { id_funcionario: string } | null) => void;
  contatosDisponiveis: ContatoDisponivelNegocio[];
  carregandoContatosDisponiveis: boolean;
  contatosSelecionados: string[];
  setContatosSelecionados: (ids: string[]) => void;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  funcionarios: Funcionario[];
  estagios: Array<{ id: string; nome: string }>;
  erroNovoNegocio: string | null;
  buttonClassName?: string;
};

export function NovoNegocioDialog({
  open,
  onOpenChange,
  onSubmit,
  trigger,
  inputNomeRef,
  criandoNegocio,
  valorNovoNegocio,
  setValorNovoNegocio,
  estagioNovoNegocio,
  estagioAberto,
  setEstagioNovoNegocio,
  cargoNovoNegocio,
  setCargoNovoNegocio,
  contatosDisponiveis,
  carregandoContatosDisponiveis,
  contatosSelecionados,
  setContatosSelecionados,
  perfil,
  funcionarios,
  estagios,
  erroNovoNegocio,
  buttonClassName,
}: NovoNegocioDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar negócio</DialogTitle>
        </DialogHeader>

        <form className="space-y-3" onSubmit={onSubmit}>
          <Input
            ref={inputNomeRef}
            className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:bg-[var(--surface-elevated)] focus:ring-[var(--focus-ring)]"
            name="titulo"
            placeholder="Título do negócio"
            disabled={criandoNegocio}
            required
          />
          <Input
            className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:bg-[var(--surface-elevated)] focus:ring-[var(--focus-ring)]"
            name="valor"
            placeholder="Valor"
            inputMode="numeric"
            value={valorNovoNegocio}
            onChange={(e) => setValorNovoNegocio(aplicaMascaraMoedaBr(e.target.value))}
            disabled={criandoNegocio}
            required
          />

          <input type="hidden" name="id_estagio" value={estagioNovoNegocio || estagioAberto} />
          <input type="hidden" name="id_funcionario" value={cargoNovoNegocio?.id_funcionario ?? ""} />
          <input type="hidden" name="lead_ids_json" value={JSON.stringify(contatosSelecionados)} />

          <Select disabled={criandoNegocio} value={estagioNovoNegocio || estagioAberto} onValueChange={setEstagioNovoNegocio}>
            <SelectTrigger className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
              <SelectValue placeholder="Estágio" />
            </SelectTrigger>
            <SelectContent>
              {estagios.map((estagio) => (
                <SelectItem key={estagio.id} value={estagio.id}>
                  {estagio.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ContatoPickerNegocio
            contatos={contatosDisponiveis}
            carregando={carregandoContatosDisponiveis}
            selecionados={contatosSelecionados}
            setSelecionados={setContatosSelecionados}
          />

          {perfil !== "COLABORADOR" ? (
            <Select
              disabled={criandoNegocio}
              value={cargoNovoNegocio?.id_funcionario ?? undefined}
              onValueChange={(valor) => setCargoNovoNegocio({ id_funcionario: valor })}
            >
              <SelectTrigger className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
                <SelectValue placeholder="Funcionário" />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((funcionario) => (
                  <SelectItem key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {erroNovoNegocio ? <p className="text-sm font-medium text-[var(--danger)]">{erroNovoNegocio}</p> : null}

          <ActionButton
            className={buttonClassName ?? "w-full rounded-xl bg-[var(--brand)] font-medium text-white hover:bg-[var(--brand-strong)]"}
            type="submit"
            loading={criandoNegocio}
            loadingText="Criando negócio..."
          >
            Criar negócio
          </ActionButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
