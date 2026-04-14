"use client";

import { Briefcase, AlertTriangle, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApiEstagioLead } from "../types";
import type { ApiFuncionarioContato, ApiLeadContato } from "@/lib/api/leads";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalLeads: number;
  leadsPreview: Array<{ id: string; nome: string }>;
  estagios: ApiEstagioLead[];
  funcionarios: ApiFuncionarioContato[];
  formulario: {
    idEstagio: string;
    idFuncionario: string;
    usarResponsavelAutomatico: boolean;
  };
  erro: string | null;
  convertendo: boolean;
  onCampoChange: <Campo extends "idEstagio" | "idFuncionario" | "usarResponsavelAutomatico">(campo: Campo, valor: string | boolean) => void;
  onConfirmar: () => void;
  // Conflito props
  leadsComNegocio: ApiLeadContato[];
  leadsSemNegocio: ApiLeadContato[];
  dialogConflitoAberto: boolean;
  acaoConflito: "substituir" | "ignorar" | "criar_novo" | null;
  onAcaoConflitoChange: (acao: "substituir" | "ignorar" | "criar_novo" | null) => void;
  onConfirmarConflito: () => void;
};

function StepForm({
  totalLeads,
  leadsPreview,
  estagios,
  funcionarios,
  formulario,
  erro,
  convertendo,
  onCampoChange,
  onConfirmar,
}: {
  totalLeads: number;
  leadsPreview: Array<{ id: string; nome: string }>;
  estagios: ApiEstagioLead[];
  funcionarios: ApiFuncionarioContato[];
  formulario: { idEstagio: string; idFuncionario: string; usarResponsavelAutomatico: boolean };
  erro: string | null;
  convertendo: boolean;
  onCampoChange: <Campo extends "idEstagio" | "idFuncionario" | "usarResponsavelAutomatico">(campo: Campo, valor: string | boolean) => void;
  onConfirmar: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[var(--success)]" />
          Converter {totalLeads} lead{totalLeads !== 1 ? "s" : ""} em negócio{totalLeads !== 1 ? "s" : ""}
        </DialogTitle>
        <DialogDescription>Cada lead será convertido em um novo negócio com valor R$ 0,00.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4">
        {/* Campos do formulário */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="estagio-negocio" className="text-sm font-medium text-[var(--text-primary)]">Estágio</label>
            <Select value={formulario.idEstagio} onValueChange={(value) => onCampoChange("idEstagio", value)}>
              <SelectTrigger id="estagio-negocio">
                <SelectValue placeholder="Selecionar estágio" />
              </SelectTrigger>
              <SelectContent>
                {estagios.map((estagio) => (
                  <SelectItem key={estagio.id} value={estagio.id}>
                    {estagio.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="responsavel-negocio" className="text-sm font-medium text-[var(--text-primary)]">Responsável</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={formulario.idFuncionario}
                  onValueChange={(value) => onCampoChange("idFuncionario", value)}
                  disabled={formulario.usarResponsavelAutomatico}
                >
                  <SelectTrigger id="responsavel-negocio" className="w-full">
                    <SelectValue placeholder="Selecionar responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.map((func: ApiFuncionarioContato) => (
                      <SelectItem key={func.id} value={func.id}>
                        {func.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant={formulario.usarResponsavelAutomatico ? "default" : "outline"}
                size="sm"
                className={formulario.usarResponsavelAutomatico ? "bg-[var(--success)] hover:bg-[var(--success-hover)]" : ""}
                onClick={() => onCampoChange("usarResponsavelAutomatico", !formulario.usarResponsavelAutomatico)}
                title="Atribuir automaticamente (round-robin)"
              >
                Auto
              </Button>
            </div>
          </div>
        </div>

        {/* Preview dos leads que serão convertidos */}
        {leadsPreview.length > 0 && (
          <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] p-3">
            <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">
              Pré-visualização ({leadsPreview.length} de {totalLeads})
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {leadsPreview.slice(0, 10).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>{lead.nome}</span>
                  <span className="text-[var(--text-tertiary)]">→ {lead.nome} (R$ 0,00)</span>
                </div>
              ))}
              {leadsPreview.length > 10 && (
                <p className="text-xs text-[var(--text-tertiary)]">...e mais {leadsPreview.length - 10} lead{leadsPreview.length - 10 !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
        )}

        {erro ? <p className="text-sm text-[var(--danger)]">{erro}</p> : null}
      </div>

      <DialogFooter>
        <Button variant="outline" disabled={convertendo}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirmar}
          disabled={convertendo || !formulario.idEstagio}
          className="bg-[var(--success)] text-white hover:bg-[var(--success-hover)]"
        >
          {convertendo ? "Convertendo..." : `Converter ${totalLeads} lead${totalLeads !== 1 ? "s" : ""}`}
        </Button>
      </DialogFooter>
    </>
  );
}

function StepConflito({
  leadsComNegocio,
  leadsSemNegocio,
  acaoConflito,
  convertendo,
  onAcaoConflitoChange,
  onConfirmarConflito,
}: {
  leadsComNegocio: ApiLeadContato[];
  leadsSemNegocio: ApiLeadContato[];
  acaoConflito: "substituir" | "ignorar" | "criar_novo" | null;
  convertendo: boolean;
  onAcaoConflitoChange: (acao: "substituir" | "ignorar" | "criar_novo" | null) => void;
  onConfirmarConflito: () => void;
}) {
  const temConflito = leadsComNegocio.length > 0;

  if (!temConflito) {
    return null;
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />
          Conflito detectado
        </DialogTitle>
        <DialogDescription>
          {leadsComNegocio.length} lead{leadsComNegocio.length !== 1 ? "s" : ""} selecionado{leadsComNegocio.length !== 1 ? "s" : ""} já {leadsComNegocio.length === 1 ? "possui" : "possuem"} negócio vinculado.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4">
        {/* Lista de leads com conflito */}
        <div className="rounded-[var(--radius-control)] border border-[var(--warning)]/30 bg-[var(--warning)]/5 p-3">
          <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Leads com negócio existente:</p>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {leadsComNegocio.slice(0, 8).map((lead) => (
              <div key={lead.id} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <X className="h-3 w-3 text-[var(--warning)]" />
                <span>{lead.nome}</span>
              </div>
            ))}
            {leadsComNegocio.length > 8 && (
              <p className="text-xs text-[var(--text-tertiary)]">...e mais {leadsComNegocio.length - 8}</p>
            )}
          </div>
        </div>

        {/* Leads sem conflito */}
        {leadsSemNegocio.length > 0 && (
          <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] p-3">
            <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Novos leads ({leadsSemNegocio.length}):</p>
            <p className="text-xs text-[var(--text-tertiary)]">Esses leads serão convertidos normalmente.</p>
          </div>
        )}

        {/* Opções de ação */}
        <div className="grid gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">O que deseja fazer?</p>
          <div className="grid grid-cols-1 gap-2">
            <Button
              type="button"
              variant={acaoConflito === "ignorar" ? "default" : "outline"}
              className="justify-start gap-2"
              onClick={() => onAcaoConflitoChange("ignorar")}
            >
              <ArrowRight className="h-4 w-4" />
              Ignorar conflitos ({leadsComNegocio.length})
            </Button>
            <Button
              type="button"
              variant={acaoConflito === "criar_novo" ? "default" : "outline"}
              className="justify-start gap-2"
              onClick={() => onAcaoConflitoChange("criar_novo")}
            >
              <ArrowRight className="h-4 w-4" />
              Criar novo negócio (ignorar vínculo anterior)
            </Button>
            <Button
              type="button"
              variant={acaoConflito === "substituir" ? "default" : "outline"}
              className="justify-start gap-2"
              onClick={() => onAcaoConflitoChange("substituir")}
            >
              <ArrowRight className="h-4 w-4" />
              Substituir negócio existente
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" disabled={convertendo}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirmarConflito}
          disabled={convertendo || !acaoConflito}
          className="bg-[var(--success)] text-white hover:bg-[var(--success-hover)]"
        >
          {convertendo ? "Processando..." : "Confirmar"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function LeadConversaoDialog({
  open,
  onOpenChange,
  totalLeads,
  leadsPreview,
  estagios,
  funcionarios,
  formulario,
  erro,
  convertendo,
  onCampoChange,
  onConfirmar,
  leadsComNegocio,
  leadsSemNegocio,
  dialogConflitoAberto,
  acaoConflito,
  onAcaoConflitoChange,
  onConfirmarConflito,
}: Props) {
  // Se está no dialog de conflito, montrer só o conflito
  const showConflito = dialogConflitoAberto;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        {showConflito ? (
          <StepConflito
            leadsComNegocio={leadsComNegocio}
            leadsSemNegocio={leadsSemNegocio}
            acaoConflito={acaoConflito}
            convertendo={convertendo}
            onAcaoConflitoChange={onAcaoConflitoChange}
            onConfirmarConflito={onConfirmarConflito}
          />
        ) : (
          <StepForm
            totalLeads={totalLeads}
            leadsPreview={leadsPreview}
            estagios={estagios}
            funcionarios={funcionarios}
            formulario={formulario}
            erro={erro}
            convertendo={convertendo}
            onCampoChange={onCampoChange}
            onConfirmar={onConfirmar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
