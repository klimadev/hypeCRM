"use client";

import { AlertCircle, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { aplicaMascaraMoedaBr, aplicaMascaraTelefoneBr, converteMoedaBrParaNumero } from "@/lib/utils";
import type { Estagio, Funcionario, Lead, PendenciaDinamica } from "../types";
import { ActionButton } from "./action-button";
import { validarTelefoneLead } from "../utils/validacoes";

type LeadDetailsTabContentProps = {
  leadSelecionado: Lead;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  estagios: Estagio[];
  funcionarios: Funcionario[];
  pendenciasLead: PendenciaDinamica[];
  salvando: boolean;
  erroDetalhesLead: string | null;
  setErroDetalhesLead: (erro: string | null) => void;
  onMudarLead: (leadAtualizado: Lead) => void;
  onSalvar: () => Promise<void>;
  onExcluir: () => void;
  temAlteracoes: boolean;
  setTemAlteracoes: (value: boolean) => void;
};

export function LeadDetailsTabContent(props: LeadDetailsTabContentProps) {
  const {
    leadSelecionado,
    perfil,
    estagios,
    funcionarios,
    pendenciasLead,
    salvando,
    erroDetalhesLead,
    setErroDetalhesLead,
    onMudarLead,
    onSalvar,
    onExcluir,
    temAlteracoes,
  } = props;

  const estagioAtual = estagios.find((estagio) => estagio.id === leadSelecionado.id_estagio) ?? null;
  const mensagemTelefoneInvalido = validarTelefoneLead(leadSelecionado.telefone);

  const statusLead = { 
    rotulo: "Em andamento", 
    descricao: "Siga preenchendo os dados e conduzindo o lead no funil.", 
    classe: "border-slate-300 bg-slate-50 text-slate-700" 
  };

  return (
    <div className="space-y-4 p-4">
      <div className={`rounded-xl border p-4 ${statusLead.classe}`}>
        <p className="text-sm font-semibold">Status atual: {statusLead.rotulo}</p>
        <p className="mt-1 text-xs">{statusLead.descricao}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-800">Dados editáveis</p>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Phone className="h-4 w-4 text-emerald-600" />
            Telefone
          </label>
          <Input
            className="h-11 rounded-xl border-slate-200"
            value={leadSelecionado.telefone}
            onChange={(e) => onMudarLead({ ...leadSelecionado, telefone: aplicaMascaraTelefoneBr(e.target.value) })}
          />
          {mensagemTelefoneInvalido ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{mensagemTelefoneInvalido}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-3 space-y-2">
          <label className="text-sm font-medium text-slate-700">Valor da Oportunidade</label>
          <Input
            className="h-11 rounded-xl border-slate-200"
            inputMode="numeric"
            value={aplicaMascaraMoedaBr(String(Math.round(leadSelecionado.valor_oportunidade * 100)))}
            onChange={(e) => onMudarLead({ ...leadSelecionado, valor_oportunidade: converteMoedaBrParaNumero(e.target.value) })}
          />
        </div>

        <div className="mt-3 space-y-2">
          <label className="text-sm font-medium text-slate-700">Observações</label>
          <Textarea
            className="min-h-[100px] rounded-xl border-slate-200"
            value={leadSelecionado.observacoes ?? ""}
            onChange={(e) => onMudarLead({ ...leadSelecionado, observacoes: e.target.value })}
          />
        </div>

        {perfil !== "COLABORADOR" ? (
          <div className="mt-3 space-y-2">
            <label className="text-sm font-medium text-slate-700">Responsavel</label>
            <Select value={leadSelecionado.id_funcionario} onValueChange={(id_funcionario) => onMudarLead({ ...leadSelecionado, id_funcionario })}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200">
                <SelectValue placeholder="Selecione o responsavel" />
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

        {erroDetalhesLead ? (
          <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-600">
            <span className="inline-flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {erroDetalhesLead}
            </span>
          </p>
        ) : null}

        {temAlteracoes ? (
          <ActionButton className="w-full rounded-xl bg-emerald-600 text-sm font-medium hover:bg-emerald-700" onClick={() => void onSalvar()} disabled={salvando} loading={salvando} loadingText="Salvando alteracoes...">
            Salvar Alteracoes
          </ActionButton>
        ) : null}

        <div className="border-t pt-4 mt-4">
          <Button variant="destructive" className="w-full rounded-xl text-sm font-medium" onClick={onExcluir} title="Abrir confirmacao de exclusao">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Lead
          </Button>
        </div>
      </div>
    </div>
  );
}
