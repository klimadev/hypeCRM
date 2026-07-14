"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Pencil, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { aplicaMascaraTelefoneBr } from "@/lib/utils";
import { formatarDataLead, rotuloOrigemLead } from "../utils";
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
  const [mostrarOpcoes, setMostrarOpcoes] = useState(!!leadEmEdicao);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {leadEmEdicao ? "Editar lead" : "Cadastrar lead"}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          {/* Contexto do lead — apenas na edição */}
          {leadEmEdicao && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Informações do lead
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Origem</p>
                  <p className="truncate text-sm text-[var(--text-primary)]">{rotuloOrigemLead(leadEmEdicao.origem)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Atualizado em</p>
                  <p className="truncate text-sm text-[var(--text-primary)]">{formatarDataLead(leadEmEdicao.atualizado_em)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">E-mail</p>
                  <p className="truncate text-sm text-[var(--text-secondary)]">
                    {leadEmEdicao.email ?? "—"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Vinculado a negócio</p>
                  <p className="truncate text-sm">
                    {leadEmEdicao.id_negocio ? (
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]">Sim</span>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">Não</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nome — sempre visível, obrigatório */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Nome <span className="text-[var(--danger)]">*</span>
            </label>
            <Input
              value={formulario.nome}
              onChange={(e) => onCampoChange("nome", e.target.value)}
              placeholder="Ex: Maria Oliveira"
              disabled={criandoLead}
              required
              maxLength={120}
              autoFocus
              className={`h-12 rounded-xl border bg-[var(--surface)] text-base ${
                erro && !formulario.nome.trim()
                  ? "border-[var(--danger)]"
                  : "border-[var(--border-subtle)]"
              }`}
            />
          </div>

          {/* Telefone — sempre visível, obrigatório */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Telefone <span className="text-[var(--danger)]">*</span>
            </label>
            <Input
              value={formulario.telefone}
              onChange={(e) => onCampoChange("telefone", aplicaMascaraTelefoneBr(e.target.value))}
              placeholder="(11) 99999-9999"
              disabled={criandoLead}
              required
              inputMode="tel"
              maxLength={20}
              className={`h-12 rounded-xl border bg-[var(--surface)] text-base ${
                erro && !formulario.telefone.trim()
                  ? "border-[var(--danger)]"
                  : "border-[var(--border-subtle)]"
              }`}
            />
          </div>

          {/* Responsável — visível sempre que há opções */}
          {funcionarios.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">Responsável</label>
              <Select
                value={formulario.idFuncionario}
                onValueChange={(v) => onCampoChange("idFuncionario", v)}
                disabled={criandoLead}
              >
                <SelectTrigger className="h-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-base">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Campos opcionais — toggle expansível */}
          <div>
            <button
              type="button"
              onClick={() => setMostrarOpcoes(!mostrarOpcoes)}
              className="flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              {mostrarOpcoes ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              {mostrarOpcoes ? "Menos opções" : "Mais informações (opcional)"}
            </button>

            {mostrarOpcoes && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">E-mail</label>
                  <Input
                    value={formulario.email}
                    onChange={(e) => onCampoChange("email", e.target.value)}
                    placeholder="cliente@exemplo.com"
                    className="h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-sm"
                    disabled={criandoLead}
                    type="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Fonte</label>
                  <Input
                    value={formulario.fonte}
                    onChange={(e) => onCampoChange("fonte", e.target.value)}
                    placeholder="Indicação, site, evento..."
                    className="h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-sm"
                    disabled={criandoLead}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Empresa de origem</label>
                  <Input
                    value={formulario.empresaOrigem}
                    onChange={(e) => onCampoChange("empresaOrigem", e.target.value)}
                    placeholder="Empresa, parceiro ou campanha de origem"
                    className="h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-sm"
                    disabled={criandoLead}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Observações</label>
                  <Textarea
                    value={formulario.observacoes}
                    onChange={(e) => onCampoChange("observacoes", e.target.value)}
                    placeholder="Contexto inicial, produto de interesse, urgência ou próximos passos"
                    disabled={criandoLead}
                    className="min-h-24 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Erro inline */}
          {erro && (
            <div className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_24%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] p-3 text-sm text-[var(--danger)]">
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {erro}
              </span>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={criandoLead}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={criandoLead || !formulario.nome.trim() || !formulario.telefone.trim()}
              className="rounded-xl bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
            >
              {criandoLead ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </span>
              ) : (
                <>
                  {leadEmEdicao ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {leadEmEdicao ? "Salvar" : "Cadastrar"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
