import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formataData, formataMoeda } from "@/lib/utils";
import type { Parcela } from "@/lib/api/parcelas";
import { cn } from "@/lib/utils";

type InstallmentCardProps = {
  parcela: Parcela;
  pagando: boolean;
  onPagar: (idParcela: string, dataPagamento?: string) => void;
};

function StatusBadgeParcela({ status }: { status: Parcela["status"] }) {
  const statusUi = {
    PAGO: "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-[var(--success)]",
    ATRASADO: "bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-[var(--danger)]",
    PENDENTE: "bg-[color-mix(in_srgb,var(--warning)_16%,transparent)] text-[var(--warning)]",
  }[status];

  const label = {
    PAGO: "Pago",
    ATRASADO: "Atrasado",
    PENDENTE: "Pendente",
  }[status];

  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusUi)}>{label}</span>;
}

export function InstallmentCard({ parcela, pagando, onPagar }: InstallmentCardProps) {
  const [aberto, setAberto] = useState(false);
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Parcela {parcela.numero_parcela}/{parcela.quantidade_total}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">Vencimento: {formataData(parcela.data_vencimento)}</p>
        </div>

        <p className="text-sm font-bold text-[var(--text-primary)]">{formataMoeda(parcela.valor)}</p>
        <StatusBadgeParcela status={parcela.status} />
      </div>

      {parcela.status !== "PAGO" ? (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {aberto ? (
            <div className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 sm:w-auto">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Data do pagamento</label>
              <Input
                type="date"
                value={dataPagamento}
                onChange={(event) => setDataPagamento(event.target.value)}
                className="mt-1 h-9 rounded-lg border-[var(--border-subtle)]"
              />
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="bg-[var(--success)] text-[var(--primary-foreground)] hover:brightness-110"
                  onClick={() => {
                    onPagar(parcela.id, dataPagamento);
                    setAberto(false);
                  }}
                  disabled={pagando}
                >
                  {pagando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setAberto(false)} disabled={pagando}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-[var(--success)] hover:bg-[color-mix(in_srgb,var(--success)_12%,transparent)] hover:text-[var(--success)]"
              onClick={() => setAberto(true)}
              disabled={pagando}
            >
              {pagando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
              Marcar como Pago
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
