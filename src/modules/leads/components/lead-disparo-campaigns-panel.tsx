"use client";

import { Button } from "@/components/ui/button";
import type { CampanhaDetalheApi, CampanhaResumoApi } from "@/lib/api/leads";

type Props = {
  campanhas: CampanhaResumoApi[];
  carregando: boolean;
  detalheIdAberta: string | null;
  detalhe: CampanhaDetalheApi | null;
  carregandoDetalhe: boolean;
  erro: string | null;
  onAbrirDetalhe: (id: string) => void;
  onFecharDetalhe: () => void;
  onCancelar: (id: string) => void;
};

export function LeadDisparoCampaignsPanel({
  campanhas,
  carregando,
  detalheIdAberta,
  detalhe,
  carregandoDetalhe,
  erro,
  onAbrirDetalhe,
  onFecharDetalhe,
  onCancelar,
}: Props) {
  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Campanhas de disparo</h3>
        <span className="text-xs text-[var(--text-secondary)]">{campanhas.length} registradas</span>
      </div>

      {erro ? <p className="mb-3 text-xs text-[var(--danger)]">{erro}</p> : null}
      {carregando ? <p className="text-sm text-[var(--text-secondary)]">Carregando campanhas...</p> : null}
      {!carregando && campanhas.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">Nenhuma campanha criada ainda.</p> : null}

      <div className="grid gap-2">
        {campanhas.map((campanha) => (
          <div key={campanha.id} className="rounded-xl border border-[var(--border-subtle)] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">{campanha.nome}</p>
              <span className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">{campanha.status}</span>
              <span className="text-xs text-[var(--text-secondary)]">
                {campanha.resumoStatus.enviados}/{campanha.resumoStatus.total} enviados
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => (detalheIdAberta === campanha.id ? onFecharDetalhe() : onAbrirDetalhe(campanha.id))}>
                  {detalheIdAberta === campanha.id ? "Ocultar" : "Detalhes"}
                </Button>
                {(campanha.status === "AGENDADA" || campanha.status === "EM_ANDAMENTO") ? (
                  <Button type="button" size="sm" variant="destructive" className="h-8" onClick={() => onCancelar(campanha.id)}>
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {detalheIdAberta && detalhe ? (
        <div className="mt-4 rounded-xl border border-[var(--border-subtle)] p-3">
          {carregandoDetalhe ? <p className="text-sm text-[var(--text-secondary)]">Carregando detalhes...</p> : null}
          <p className="text-sm font-medium text-[var(--text-primary)]">{detalhe.nome}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Pendentes {detalhe.resumoStatus.pendentes} | Processando {detalhe.resumoStatus.processando} | Enviados {detalhe.resumoStatus.enviados} | Falhas {detalhe.resumoStatus.falhas}
          </p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Inelegíveis: {detalhe.inelegiveis.length}</p>
        </div>
      ) : null}
    </section>
  );
}
