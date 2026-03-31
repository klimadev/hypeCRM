"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useNegocioParcelas } from "../hooks/use-lead-parcelas";
import { InstallmentCard } from "./parcelas/installment-card";
import { InstallmentGeneratorForm } from "./parcelas/installment-generator-form";

type NegocioParcelasTabProps = {
  negocioId: string;
};

function ParcelasResumo({ parcelas }: { parcelas: { valor: number; status: string }[] }) {
  const total = parcelas.reduce((acc, p) => acc + p.valor, 0);
  const pago = parcelas.filter((p) => p.status === "PAGO").reduce((acc, p) => acc + p.valor, 0);
  const pendente = total - pago;
  const progresso = total > 0 ? (pago / total) * 100 : 0;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">Progresso</span>
        <span className="font-semibold text-[var(--text-primary)]">
          {parcelas.filter((p) => p.status === "PAGO").length}/{parcelas.length} parcelas
        </span>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[color:rgba(255,255,255,0.06)]">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progresso}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-[var(--text-tertiary)]">Total</p>
          <p className="font-semibold text-[var(--text-primary)]">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--success)]">Pago</p>
          <p className="font-semibold text-[var(--success)]">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pago)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--warning)]">Pendente</p>
          <p className="font-semibold text-[var(--warning)]">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pendente)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function NegocioParcelasTab({ negocioId }: NegocioParcelasTabProps) {
  const vm = useNegocioParcelas({ negocioId });

  if (vm.loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!vm.temParcelas ? (
        <InstallmentGeneratorForm
          valorTotal={vm.valorTotal}
          onValorTotalChange={vm.setValorTotal}
          quantidadeParcelas={vm.quantidadeParcelas}
          onQuantidadeParcelasChange={vm.setQuantidadeParcelas}
          dataPrimeiroVencimento={vm.dataPrimeiroVencimento}
          onDataPrimeiroVencimentoChange={vm.setDataPrimeiroVencimento}
          gerando={vm.gerando}
          onGerarPlano={vm.gerarPlano}
        />
      ) : (
        <>
          <ParcelasResumo parcelas={vm.parcelas} />
          <div className="space-y-2">
            {vm.parcelas.map((parcela) => (
              <InstallmentCard
                key={parcela.id}
                parcela={parcela}
                pagando={vm.pagando === parcela.id}
                onPagar={vm.pagarParcela}
              />
            ))}
          </div>
        </>
      )}

      {vm.error ? (
        <div className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] p-3 text-sm text-[color:#fecdd3]">
          <p className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            {vm.error}
          </p>
        </div>
      ) : null}
    </div>
  );
}
