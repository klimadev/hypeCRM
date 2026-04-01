"use client";

import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Pdv, WhatsappInstancia } from "../types";

type EquipeLojaDrawerWhatsappCardProps = {
  loja: Pdv;
  instancias: WhatsappInstancia[];
  erro: string | null;
  trocando: boolean;
  instanciaSelecionada: string;
  salvando: boolean;
  valorSemInstancia: string;
  onIniciarTroca: () => void;
  onCancelarTroca: () => void;
  onSelecionarInstancia: (valor: string) => void;
  onSalvar: () => void;
};

export function EquipeLojaDrawerWhatsappCard({
  loja,
  instancias,
  erro,
  trocando,
  instanciaSelecionada,
  salvando,
  valorSemInstancia,
  onIniciarTroca,
  onCancelarTroca,
  onSelecionarInstancia,
  onSalvar,
}: EquipeLojaDrawerWhatsappCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">WhatsApp da equipe</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{loja.whatsapp_instancia?.nome ?? "Nenhuma instancia vinculada"}</p>
        </div>
        {!trocando ? (
          <Button type="button" size="sm" variant="outline" className="h-9 rounded-lg text-[var(--text-secondary)]" onClick={onIniciarTroca}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {loja.id_whatsapp_instancia ? "Trocar" : "Vincular"}
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" className="h-9 rounded-lg" onClick={onCancelarTroca} disabled={salvando}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {trocando ? (
        <div className="space-y-3">
          <Select value={instanciaSelecionada || valorSemInstancia} onValueChange={(valor) => onSelecionarInstancia(valor === valorSemInstancia ? "" : valor)}>
            <SelectTrigger className="h-10 rounded-lg bg-[var(--surface-elevated)] border-[var(--border-subtle)]">
              <SelectValue placeholder="Selecione a instancia WhatsApp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={valorSemInstancia}>Nenhuma</SelectItem>
              {instancias.map((instancia) => (
                <SelectItem key={instancia.id} value={instancia.id}>
                  {instancia.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {erro ? <div className="rounded-lg border border-[color:rgba(244,63,94,0.2)] bg-[color:rgba(244,63,94,0.08)] px-3 py-2 text-xs text-[var(--danger)]">{erro}</div> : null}

          {instancias.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Nenhuma instancia disponivel no momento. Voce ainda pode remover o vinculo atual selecionando a opcao Nenhuma.
            </p>
          ) : null}

          <Button type="button" className="h-10 w-full rounded-lg bg-[var(--brand)] font-medium text-white hover:bg-[var(--brand-strong)]" disabled={salvando} onClick={onSalvar}>
            {salvando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar WhatsApp"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
