"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Link2, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Lead } from "../types";
import type { ApiLeadContato } from "@/lib/api/leads";

type NegocioVinculosTabProps = {
  negocioSelecionado: Lead;
  leadsDisponiveis: ApiLeadContato[];
  carregandoLeadsDisponiveis: boolean;
  salvandoVinculos: boolean;
  erroVinculos: string | null;
  setErroVinculos: (erro: string | null) => void;
  onSalvarVinculos: (leadIds: string[]) => Promise<void>;
};

export function NegocioVinculosTab({
  negocioSelecionado,
  leadsDisponiveis,
  carregandoLeadsDisponiveis,
  salvandoVinculos,
  erroVinculos,
  setErroVinculos,
  onSalvarVinculos,
}: NegocioVinculosTabProps) {
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>(
    () => (negocioSelecionado.leads_vinculados ?? []).map((lead) => lead.id),
  );

  const leadsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return leadsDisponiveis;

    return leadsDisponiveis.filter((lead) => {
      const negocioAtual = lead.id_negocio ?? "";
      return [lead.nome, lead.telefone, lead.id, negocioAtual].join(" ").toLowerCase().includes(termo);
    });
  }, [busca, leadsDisponiveis]);

  const contatosAtuais = negocioSelecionado.leads_vinculados ?? [];
  const leadPrincipal = negocioSelecionado.lead_principal ?? contatosAtuais[0] ?? null;

  const alternarLead = (leadId: string) => {
    setSelecionados((atual) => (
      atual.includes(leadId)
        ? atual.filter((id) => id !== leadId)
        : [...atual, leadId]
    ));
  };

  const salvar = async () => {
    setErroVinculos(null);
    await onSalvarVinculos(selecionados);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[var(--brand)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Vínculos do negócio</p>
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Selecione os leads que pertencem a este negócio. Vínculos existentes serão transferidos se o lead estiver em outro negócio.
            </p>
          </div>
          <span className="rounded-full border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
            {selecionados.length} selecionado{selecionados.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {leadPrincipal ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(139,92,246,0.28)] bg-[var(--brand-soft)] px-3 py-1 text-xs text-[var(--text-primary)]">
              <Users className="h-3.5 w-3.5" />
              Principal: {leadPrincipal.nome}
            </span>
          ) : null}

          {contatosAtuais.length > 1 ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-3 py-1 text-xs text-[var(--text-secondary)]">
              <Users className="h-3.5 w-3.5" />
              {contatosAtuais.length} leads atualmente vinculados
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Buscar lead</label>
        <Input
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Nome, telefone ou ID"
          className="h-10 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Leads disponíveis</p>
          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
            {leadsFiltrados.length.toLocaleString("pt-BR")}
          </span>
        </div>

        {carregandoLeadsDisponiveis ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--text-secondary)]" />
          </div>
        ) : leadsFiltrados.length === 0 ? (
          <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-4 text-sm text-[var(--text-secondary)]">
            Nenhum lead encontrado com esse filtro.
          </div>
        ) : (
          <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
            {leadsFiltrados.map((lead) => {
              const selecionado = selecionados.includes(lead.id);
              const idNegocioAtual = lead.id_negocio ?? null;
              const vinculadoEmOutroNegocio = Boolean(idNegocioAtual && idNegocioAtual !== negocioSelecionado.id);

              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => alternarLead(lead.id)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-3 text-left transition-colors",
                    selecionado
                      ? "border-[color:rgba(139,92,246,0.36)] bg-[color:rgba(139,92,246,0.12)] text-[var(--text-primary)]"
                      : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{lead.nome}</p>
                    <p className="truncate text-xs text-[var(--text-tertiary)]">{lead.telefone}</p>
                    <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">ID {lead.id}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1 text-[11px]">
                    {vinculadoEmOutroNegocio ? (
                      <span className="rounded-full border border-[color:rgba(245,158,11,0.28)] bg-[color:rgba(245,158,11,0.12)] px-2 py-0.5 text-[color:#fde68a]">
                        Em outro negócio
                      </span>
                    ) : lead.id_negocio === negocioSelecionado.id ? (
                      <span className="rounded-full border border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.12)] px-2 py-0.5 text-[color:#a7f3d0]">
                        Vinculado aqui
                      </span>
                    ) : null}

                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5",
                        selecionado
                          ? "bg-[var(--brand-soft)] text-[var(--text-primary)]"
                          : "bg-[color:rgba(255,255,255,0.04)] text-[var(--text-tertiary)]",
                      )}
                    >
                      {selecionado ? "Selecionado" : "Adicionar"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {erroVinculos ? (
        <div className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] p-3 text-sm text-[color:#fecdd3]">
          <p className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            {erroVinculos}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setSelecionados((negocioSelecionado.leads_vinculados ?? []).map((lead) => lead.id))} disabled={salvandoVinculos}>
          Restaurar
        </Button>
        <Button
          type="button"
          onClick={() => void salvar()}
          disabled={salvandoVinculos}
          className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
        >
          {salvandoVinculos ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando vínculos...
            </span>
          ) : (
            "Salvar vínculos"
          )}
        </Button>
      </div>
    </div>
  );
}
