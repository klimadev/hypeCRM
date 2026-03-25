import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MetaModuleItem, TetoMetaModuleResumo } from "@/modules/equipe/types/metas";
import { ProgressRing } from "./progress-ring";
import { descreverIndicadorMeta, formatarIndicadorMeta, formatarPeriodoMeta } from "./utils";

type MetaPdvCardProps = {
  meta: MetaModuleItem;
  teto?: TetoMetaModuleResumo;
  podeEditar: boolean;
  desativando: boolean;
  onEditar: (meta: MetaModuleItem) => void;
  onDesativar: (id: string) => void;
};

export function MetaPdvCard({ meta, teto, podeEditar, desativando, onEditar, onDesativar }: MetaPdvCardProps) {
  return (
    <article className="rounded-[var(--radius-shell)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Meta de PDV</p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{meta.pdv?.nome ?? "PDV nao encontrado"}</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{descreverIndicadorMeta(meta)} • {formatarPeriodoMeta(meta)}</p>
        </div>

        <ProgressRing percentual={meta.progresso?.percentual ?? 0} size={96} strokeWidth={10} legenda="atingido" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Alvo</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{formatarIndicadorMeta(meta, meta.alvo)}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Realizado</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{formatarIndicadorMeta(meta, meta.progresso?.realizado ?? 0)}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Livre para equipe</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{formatarIndicadorMeta(meta, teto?.disponivel ?? meta.alvo)}</p>
        </div>
      </div>

      {podeEditar ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => onEditar(meta)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button type="button" variant="destructive" className="rounded-xl" disabled={desativando} onClick={() => onDesativar(meta.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {desativando ? "Desativando..." : "Desativar"}
          </Button>
        </div>
      ) : null}
    </article>
  );
}
