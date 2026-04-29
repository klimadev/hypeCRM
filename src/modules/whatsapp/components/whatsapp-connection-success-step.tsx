"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

type WhatsappConnectionSuccessStepProps = {
  instanciaNome: string | null;
  instanciaPhone: string | null;
  onReiniciarFluxo: () => void;
};

export function WhatsappConnectionSuccessStep(props: WhatsappConnectionSuccessStepProps) {
  const { instanciaNome, instanciaPhone, onReiniciarFluxo } = props;

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--success)]/45 bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--success)_22%,transparent)] text-[var(--success)]">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold text-[var(--text-primary)]">WhatsApp conectado com sucesso</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {instanciaNome ?? "Instancia pronta"}
            {instanciaPhone ? ` - ${instanciaPhone}` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button asChild variant="success">
          <Link href="/chat">Abrir chat</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/automacoes">Ir para automacoes</Link>
        </Button>
        <Button type="button" variant="outline" onClick={onReiniciarFluxo}>
          Conectar outra
        </Button>
      </div>
    </div>
  );
}
