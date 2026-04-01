"use client";

import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { DadosEdicao, ErrosEdicao, StatusSalvamento } from "../types";

type EquipeLojaDrawerEditViewProps = {
  dados: DadosEdicao;
  erros: ErrosEdicao;
  statusSalvamento: StatusSalvamento;
  editandoPessoaId: string;
  onCancelar: () => void;
  onSalvar: () => void;
  onChange: <Campo extends keyof DadosEdicao>(campo: Campo, valor: DadosEdicao[Campo]) => void;
};

export function EquipeLojaDrawerEditView({
  dados,
  erros,
  statusSalvamento,
  editandoPessoaId,
  onCancelar,
  onSalvar,
  onChange,
}: EquipeLojaDrawerEditViewProps) {
  const salvando = statusSalvamento.id === editandoPessoaId && statusSalvamento.estado === "saving";
  const erro = statusSalvamento.id === editandoPessoaId && statusSalvamento.estado === "error" ? statusSalvamento.mensagem : null;

  return (
    <>
      <SheetHeader className="border-b border-[var(--border-subtle)] px-6 py-4">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="h-9 w-9 rounded-lg p-0" onClick={onCancelar}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <SheetTitle className="text-lg text-[var(--text-primary)]">Editar Pessoa</SheetTitle>
            <SheetDescription className="text-sm text-[var(--text-secondary)]">Altere os dados de {dados.nome}</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="space-y-4 px-6 py-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">Nome</label>
          <Input value={dados.nome} onChange={(event) => onChange("nome", event.target.value)} placeholder="Nome completo" className={erros.nome ? "border-[var(--danger)]" : ""} />
          {erros.nome ? <p className="text-xs text-[var(--danger)]">{erros.nome}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">E-mail</label>
          <Input type="email" value={dados.email} onChange={(event) => onChange("email", event.target.value)} placeholder="email@exemplo.com" className={erros.email ? "border-[var(--danger)]" : ""} />
          {erros.email ? <p className="text-xs text-[var(--danger)]">{erros.email}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">Funcao</label>
          <Select value={dados.cargo} onValueChange={(valor) => onChange("cargo", valor)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COLABORADOR">Vendedor</SelectItem>
              <SelectItem value="GERENTE">Gerente</SelectItem>
              <SelectItem value="ADMINISTRADOR">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {erro ? <div className="rounded-lg bg-[color:rgba(244,63,94,0.08)] p-3 text-sm text-[var(--danger)]">{erro}</div> : null}
      </div>

      <SheetFooter className="flex-col gap-2 px-6 pb-6">
        <Button className="h-11 w-full rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)]" onClick={onSalvar} disabled={salvando}>
          {salvando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              Salvar Alteracoes
            </>
          )}
        </Button>
        <Button variant="outline" className="h-11 w-full rounded-xl" onClick={onCancelar}>
          Cancelar
        </Button>
      </SheetFooter>
    </>
  );
}
