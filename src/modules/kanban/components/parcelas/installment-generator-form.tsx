import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type InstallmentGeneratorFormProps = {
  valorTotal: string;
  onValorTotalChange: (valor: string) => void;
  quantidadeParcelas: string;
  onQuantidadeParcelasChange: (valor: string) => void;
  dataPrimeiroVencimento: string;
  onDataPrimeiroVencimentoChange: (valor: string) => void;
  gerando: boolean;
  onGerarPlano: () => void;
};

export function InstallmentGeneratorForm({
  valorTotal,
  onValorTotalChange,
  quantidadeParcelas,
  onQuantidadeParcelasChange,
  dataPrimeiroVencimento,
  onDataPrimeiroVencimentoChange,
  gerando,
  onGerarPlano,
}: InstallmentGeneratorFormProps) {
  const valorNumero = Number(valorTotal.replace(/\D/g, "")) / 100;
  const qtdParcelas = Number(quantidadeParcelas) || 0;
  const valorPorParcela = qtdParcelas > 0 && valorNumero > 0 ? valorNumero / qtdParcelas : 0;

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)]">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Gerar Plano de Pagamento</h3>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">Defina o valor total e quantidade de parcelas.</p>

      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Valor Total</label>
          <Input
            value={valorTotal}
            onChange={(event) => onValorTotalChange(event.target.value)}
            placeholder="0,00"
            inputMode="numeric"
            className="h-10 rounded-xl border-[var(--border-subtle)]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Quantidade de Parcelas</label>
          <Input
            type="number"
            min={1}
            max={360}
            value={quantidadeParcelas}
            onChange={(event) => onQuantidadeParcelasChange(event.target.value)}
            placeholder="Ex.: 60"
            className="h-10 rounded-xl border-[var(--border-subtle)]"
          />
        </div>

        {valorPorParcela > 0 && qtdParcelas > 0 && (
          <div className="rounded-xl bg-[color-mix(in_srgb,var(--success)_12%,transparent)] p-3 text-center">
            <p className="text-xs text-[var(--success)]">Valor de cada parcela</p>
            <p className="text-lg font-bold text-[var(--success)]">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorPorParcela)}
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Data do 1o Vencimento</label>
          <Input
            type="date"
            value={dataPrimeiroVencimento}
            onChange={(event) => onDataPrimeiroVencimentoChange(event.target.value)}
            className="h-10 rounded-xl border-[var(--border-subtle)]"
          />
        </div>

        <Button
          type="button"
          onClick={onGerarPlano}
          disabled={gerando || !valorTotal || !quantidadeParcelas}
          className="w-full rounded-xl bg-[var(--success)] text-[var(--primary-foreground)] hover:brightness-110"
        >
          {gerando ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando plano...
            </span>
          ) : (
            "Gerar Plano de Pagamento"
          )}
        </Button>
      </div>
    </div>
  );
}
