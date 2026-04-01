"use client";

import Link from "next/link";
import { ArrowRight, CalendarRange, LayoutGrid, PlugZap } from "lucide-react";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIntegracoesModule } from "./hooks/use-integracoes-module";

function obterResumoCatalogo(total: number) {
  if (total === 1) {
    return "1 integracao pronta para abrir";
  }

  return `${total} integracoes disponiveis`;
}

export function ModuloIntegracoes() {
  const vm = useIntegracoesModule();
  const totalIntegracoes = vm.integracoes.length;

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title="Integracoes"
        subtitle="Escolha abaixo a ferramenta que voce quer conectar ou gerenciar dentro do CRM."
        icon={<PlugZap className="h-5 w-5" />}
        iconTone="blue"
        className="px-4 py-4 md:px-5 md:py-4"
        badges={[
          <Badge key="total" variant="info" dot>{obterResumoCatalogo(totalIntegracoes)}</Badge>,
          <Badge key="acesso" variant="secondary">Acesso de gestao</Badge>,
        ]}
      />

      <Card className="border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.94))]">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Como funciona</p>
            <p className="text-sm text-[var(--text-primary)]">Primeiro escolha a ferramenta. Depois voce entra na tela dela para conectar, testar e acompanhar.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            <LayoutGrid className="h-3.5 w-3.5 text-[var(--brand)]" />
            Clique no card para abrir a integracao
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vm.integracoes.map((integracao) => (
          <Link key={integracao.slug} href={integracao.href} className="group block focus-visible:outline-none">
            <Card
              className={cn(
                "h-full overflow-hidden border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.94))]",
                "focus-within:border-[var(--border-focus)] focus-within:shadow-[var(--focus-ring)] group-focus-visible:border-[var(--border-focus)] group-focus-visible:shadow-[var(--focus-ring)]",
              )}
            >
              <CardHeader className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <Badge variant="info" size="sm">{integracao.categoria}</Badge>
                    <div className="space-y-1.5">
                      <CardTitle className="text-lg">{integracao.nome}</CardTitle>
                      <p className="text-sm text-[var(--text-primary)]">{integracao.tituloCurto}</p>
                      <p className="text-sm leading-6 text-[var(--text-secondary)]">{integracao.resumoCurto}</p>
                    </div>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[color:rgba(56,189,248,0.24)] bg-[color:rgba(56,189,248,0.12)] text-[var(--info)] shadow-[0_18px_40px_-28px_rgba(56,189,248,0.65)]">
                    <CalendarRange className="h-5 w-5" />
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-5 pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success" dot>{integracao.statusLabel}</Badge>
                  <Badge variant="secondary">EMPRESA e GERENTE</Badge>
                </div>

                <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Voce vai conseguir</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">Conectar a conta, verificar se esta funcionando e acompanhar a agenda sem sair do CRM.</p>
                </div>

                <div className="flex items-center justify-between text-sm font-medium text-[var(--text-primary)]">
                  <span>{integracao.acaoLabel}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-productive)] group-hover:translate-x-0.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </ModulePageShell>
  );
}
