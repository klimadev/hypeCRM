"use client";

import { AlertCircle, Building2, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { ApiLeadContato } from "@/lib/api/leads";
import type { ApiNegocioResumo } from "@/lib/api/negocios";

type VinculoNegocioDialogProps = {
  open: boolean;
  lead: ApiLeadContato | null;
  negocios: ApiNegocioResumo[];
  negocioSelecionadoId: string;
  buscaNegocio: string;
  vinculando: boolean;
  erro: string | null;
  onOpenChange: (aberto: boolean) => void;
  onBuscaNegocioChange: (valor: string) => void;
  onSelecionarNegocio: (valor: string) => void;
  onConfirmar: () => void;
};

export function VinculoNegocioDialog({
  open,
  lead,
  negocios,
  negocioSelecionadoId,
  buscaNegocio,
  vinculando,
  erro,
  onOpenChange,
  onBuscaNegocioChange,
  onSelecionarNegocio,
  onConfirmar,
}: VinculoNegocioDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--brand)]" />
            <DialogTitle>Vincular lead a um negócio</DialogTitle>
          </div>
          <DialogDescription>
            Escolha um negócio existente para receber este lead. Se o lead já estiver em outro negócio, ele será transferido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {lead ? (
            <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{lead.nome}</p>
              <p className="text-xs text-[var(--text-secondary)]">{lead.telefone}</p>
              <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                {lead.id_negocio
                  ? "O vínculo atual será substituído se você escolher outro negócio."
                  : "Este lead ainda não possui negócio vinculado."}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Buscar negócio</label>
            <Input
              value={buscaNegocio}
              onChange={(event) => onBuscaNegocioChange(event.target.value)}
              placeholder="Título, lead, funil, estágio ou responsável"
              className="h-10 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Negócios disponíveis</p>
              <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                {negocios.length.toLocaleString("pt-BR")}
              </span>
            </div>

            <div className="max-h-[42vh] overflow-y-auto pr-1">
              {negocios.length === 0 ? (
                <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-4 text-sm text-[var(--text-secondary)]">
                  Nenhum negócio encontrado com esse filtro.
                </div>
              ) : (
                <div className="space-y-2">
                  {negocios.map((negocio) => {
                    const leadPrincipal = negocio.lead_principal ?? negocio.leads?.[0] ?? null;
                    const estagio = negocio.estagio?.nome ?? "—";
                    const funil = negocio.funil?.nome ?? "Funil";
                    const selecionado = negocio.id === negocioSelecionadoId;

                    return (
                      <button
                        key={negocio.id}
                        type="button"
                        onClick={() => onSelecionarNegocio(negocio.id)}
                        className={cn(
                          "flex w-full items-start justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-3 text-left transition-colors",
                          selecionado
                            ? "border-[color:rgba(139,92,246,0.36)] bg-[color:rgba(139,92,246,0.12)]"
                            : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:border-[var(--border-strong)]",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{negocio.titulo}</p>
                          <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                            {leadPrincipal ? `${leadPrincipal.nome} • ${leadPrincipal.telefone}` : "Sem lead principal"}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                            {funil} • {estagio} • {negocio.funcionario?.nome ?? "Responsável não informado"}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1 text-[11px]">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5",
                              selecionado
                                ? "bg-[var(--brand-soft)] text-[var(--text-primary)]"
                                : "bg-[color:rgba(255,255,255,0.04)] text-[var(--text-tertiary)]",
                            )}
                          >
                            {selecionado ? "Selecionado" : "Selecionar"}
                          </span>
                          <span className="rounded-full border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-2 py-0.5 text-[var(--text-tertiary)]">
                            {negocio.leads?.length ?? 0} lead{(negocio.leads?.length ?? 0) === 1 ? "" : "s"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
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
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={vinculando}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirmar}
            disabled={vinculando || !negocioSelecionadoId || !lead}
            className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
          >
            {vinculando ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Vinculando...
              </span>
            ) : (
              "Vincular lead"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
