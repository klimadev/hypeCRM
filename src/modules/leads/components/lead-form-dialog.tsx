"use client";

import { AlertCircle, Pencil, Plus, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { aplicaMascaraTelefoneBr } from "@/lib/utils";
import type { ApiFuncionarioContato, ApiLeadContato } from "@/lib/api/leads";
import type { FormularioNovoLead } from "../types";

type LeadFormDialogProps = {
  open: boolean;
  funcionarios: ApiFuncionarioContato[];
  formulario: FormularioNovoLead;
  leadEmEdicao: ApiLeadContato | null;
  criandoLead: boolean;
  erro: string | null;
  onOpenChange: (aberto: boolean) => void;
  onCampoChange: <Campo extends keyof FormularioNovoLead>(campo: Campo, valor: FormularioNovoLead[Campo]) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
};

export function LeadFormDialog({
  open,
  funcionarios,
  formulario,
  leadEmEdicao,
  criandoLead,
  erro,
  onOpenChange,
  onCampoChange,
  onSubmit,
}: LeadFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {leadEmEdicao ? <Pencil className="h-4 w-4 text-[var(--brand)]" /> : <Users className="h-4 w-4 text-[var(--brand)]" />}
            <DialogTitle>{leadEmEdicao ? "Editar lead" : "Cadastrar lead manual"}</DialogTitle>
          </div>
          <DialogDescription>
            {leadEmEdicao
              ? "Atualize os dados principais do contato sem perder o histórico comercial já existente."
              : "Adicione um contato diretamente no CRM para começar o atendimento ou vincular a um negócio depois."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Nome do lead</label>
              <Input
                value={formulario.nome}
                onChange={(event) => onCampoChange("nome", event.target.value)}
                placeholder="Ex: Maria Oliveira"
                className="h-10"
                disabled={criandoLead}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Telefone</label>
              <Input
                value={formulario.telefone}
                onChange={(event) => onCampoChange("telefone", aplicaMascaraTelefoneBr(event.target.value))}
                placeholder="(11) 99999-9999"
                className="h-10"
                disabled={criandoLead}
                inputMode="tel"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">E-mail</label>
              <Input
                value={formulario.email}
                onChange={(event) => onCampoChange("email", event.target.value)}
                placeholder="cliente@exemplo.com"
                className="h-10"
                disabled={criandoLead}
                type="email"
              />
            </div>

            {funcionarios.length > 1 ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Responsável</label>
                <Select value={formulario.idFuncionario} onValueChange={(valor) => onCampoChange("idFuncionario", valor)} disabled={criandoLead}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.map((funcionario) => (
                      <SelectItem key={funcionario.id} value={funcionario.id}>
                        {funcionario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Fonte</label>
              <Input
                value={formulario.fonte}
                onChange={(event) => onCampoChange("fonte", event.target.value)}
                placeholder="Indicação, site, evento..."
                className="h-10"
                disabled={criandoLead}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Empresa de origem</label>
              <Input
                value={formulario.empresaOrigem}
                onChange={(event) => onCampoChange("empresaOrigem", event.target.value)}
                placeholder="Empresa, parceiro ou campanha de origem"
                className="h-10"
                disabled={criandoLead}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Observações</label>
              <Textarea
                value={formulario.observacoes}
                onChange={(event) => onCampoChange("observacoes", event.target.value)}
                placeholder="Contexto inicial, produto de interesse, urgência ou próximos passos"
                disabled={criandoLead}
                className="min-h-28"
              />
            </div>
          </div>

          {erro ? (
            <div className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] p-3 text-sm font-medium text-[color:#fecdd3]">
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {erro}
              </span>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={criandoLead}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criandoLead} className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]">
              {criandoLead ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {leadEmEdicao ? "Salvando..." : "Cadastrando..."}
                </span>
              ) : (
                <>
                  {leadEmEdicao ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {leadEmEdicao ? "Salvar alterações" : "Salvar lead"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
