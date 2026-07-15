import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formataData, formataMoeda } from "@/lib/utils";
import type { UseRecebimentosModuleReturn } from "../types";

function badgeStatus(status: "PAGO" | "PENDENTE" | "ATRASADO") {
  return {
    PAGO: "border-[color-mix(in_srgb,var(--success)_18%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]",
    PENDENTE: "border-[color-mix(in_srgb,var(--info)_18%,transparent)] bg-[color-mix(in_srgb,var(--info)_12%,transparent)] text-[var(--info)]",
    ATRASADO: "border-[color-mix(in_srgb,var(--danger)_18%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]",
  }[status];
}

type RecebimentosMobileListProps = {
  vm: UseRecebimentosModuleReturn;
};

export function RecebimentosMobileList({ vm }: RecebimentosMobileListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {vm.recebimentos.map((item) => (
        <article key={item.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{item.lead.nome}</p>
              <p className="text-xs text-[var(--text-secondary)]">{item.lead.telefone}</p>
            </div>
            <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-medium", badgeStatus(item.status))}>
              {item.status === "PAGO" ? "Recebido" : item.status === "ATRASADO" ? "Atrasado" : "A vencer"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Parcela</p>
              <p className="font-medium text-[var(--text-primary)]">{item.numero_parcela}/{item.quantidade_total}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Valor</p>
              <p className="font-semibold text-[var(--text-primary)]">{formataMoeda(item.valor)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Vencimento</p>
              <p className="text-[var(--text-secondary)]">{formataData(item.data_vencimento)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Pagamento</p>
              <p className="text-[var(--text-secondary)]">{item.data_pagamento ? formataData(item.data_pagamento) : "-"}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Clock3 className="h-4 w-4" />
              {item.status === "ATRASADO" ? `${item.dias_em_atraso} dias em atraso` : item.pdv?.nome ?? item.responsavel.nome}
            </div>
            <Button asChild variant="ghost" size="sm" className="text-[var(--info)]">
              <Link href={`/kanban?lead=${item.lead.id}`}>
                <ArrowUpRight className="mr-1 h-4 w-4" />
                Abrir
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
