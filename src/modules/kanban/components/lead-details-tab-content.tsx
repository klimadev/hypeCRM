"use client";

import { AlertCircle, Link2, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { aplicaMascaraMoedaBr, converteMoedaBrParaNumero } from "@/lib/utils";
import type { Estagio, Funcionario, Lead, PendenciaDinamica } from "../types";
import { ActionButton } from "./action-button";

type NegocioDetailsTabContentProps = {
  negocioSelecionado: Lead;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  estagios: Estagio[];
  funcionarios: Funcionario[];
  pendenciasNegocio: PendenciaDinamica[];
  salvando: boolean;
  erroDetalhesNegocio: string | null;
  setErroDetalhesNegocio: (erro: string | null) => void;
  onMudarNegocio: (negocioAtualizado: Lead) => void;
  onSalvar: () => Promise<void>;
  temAlteracoes: boolean;
  setTemAlteracoes: (value: boolean) => void;
};

export function NegocioDetailsTabContent(props: NegocioDetailsTabContentProps) {
  const {
    negocioSelecionado,
    perfil,
    estagios,
    funcionarios,
    salvando,
    erroDetalhesNegocio,
    onMudarNegocio,
    onSalvar,
    temAlteracoes,
  } = props;

  void estagios;
  const contatoPrincipal = negocioSelecionado.lead_principal ?? null;
  const contatosVinculados = negocioSelecionado.leads_vinculados ?? [];

  const statusNegocio = { 
    rotulo: "Em andamento", 
    descricao: "Siga preenchendo os dados e conduzindo o negócio no funil.", 
    classe: "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-secondary)]" 
  };

  return (
    <div className="space-y-4 p-4">
      <div className={`rounded-[var(--radius-card)] border p-4 ${statusNegocio.classe}`}>
        <p className="text-sm font-semibold">Status atual: {statusNegocio.rotulo}</p>
        <p className="mt-1 text-xs">{statusNegocio.descricao}</p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)]">
        <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Contato principal</p>
        {contatoPrincipal ? (
          <div className="space-y-1 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">{contatoPrincipal.nome}</p>
            <p>{contatoPrincipal.telefone}</p>
            {contatoPrincipal.origem ? <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{contatoPrincipal.origem}</p> : null}
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-[var(--radius-control)] border border-dashed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            <Link2 className="mt-0.5 h-4 w-4 text-[var(--text-tertiary)]" />
            <span>Este negócio ainda não tem um contato principal vinculado.</span>
          </div>
        )}

        {contatosVinculados.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Contatos vinculados</p>
            <div className="flex flex-wrap gap-2">
              {contatosVinculados.map((contato) => (
                <span
                  key={contato.id}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-3 py-1 text-xs text-[var(--text-secondary)]"
                >
                  <Phone className="h-3 w-3" />
                  {contato.nome}
                </span>
              ))}
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">Para adicionar ou remover leads, use a aba Vínculos.</p>
          </div>
        ) : null}
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)]">
        <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Dados editáveis</p>

        <div className="mt-3 space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Valor estimado</label>
          <Input
            className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-primary)]"
            inputMode="numeric"
            value={aplicaMascaraMoedaBr(String(Math.round(negocioSelecionado.valor_oportunidade * 100)))}
            onChange={(e) => onMudarNegocio({ ...negocioSelecionado, valor_oportunidade: converteMoedaBrParaNumero(e.target.value) })}
          />
        </div>

        <div className="mt-3 space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Observações comerciais</label>
          <Textarea
            className="min-h-[100px] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-primary)]"
            value={negocioSelecionado.observacoes ?? ""}
            onChange={(e) => onMudarNegocio({ ...negocioSelecionado, observacoes: e.target.value })}
          />
        </div>

        {perfil !== "COLABORADOR" ? (
          <div className="mt-3 space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Responsável comercial</label>
            <Select value={negocioSelecionado.id_funcionario} onValueChange={(id_funcionario) => onMudarNegocio({ ...negocioSelecionado, id_funcionario })}>
              <SelectTrigger className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-secondary)]">
                <SelectValue placeholder="Selecione o responsável" />
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

        {erroDetalhesNegocio ? (
          <p className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] p-3 text-sm font-medium text-[color:#fecdd3]">
            <span className="inline-flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {erroDetalhesNegocio}
            </span>
          </p>
        ) : null}

        {temAlteracoes ? (
          <ActionButton className="w-full rounded-xl bg-emerald-600 text-sm font-medium hover:bg-emerald-700" onClick={() => void onSalvar()} disabled={salvando} loading={salvando} loadingText="Salvando alterações...">
            Salvar alterações
          </ActionButton>
        ) : null}

      </div>
    </div>
  );
}
