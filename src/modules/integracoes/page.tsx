"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarClock, PlugZap, ShieldCheck, Sparkles } from "lucide-react";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIntegracoesModule } from "./hooks/use-integracoes-module";

export function ModuloIntegracoes() {
  const vm = useIntegracoesModule();

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title="Integrações"
        subtitle="Conecte ferramentas operacionais ao CRM e concentre a configuracao dos provedores em um ponto unico de gestao."
        icon={<PlugZap className="h-5 w-5" />}
        iconTone="blue"
        badges={[
          <Badge key="tenant" variant="secondary">Multi-tenant</Badge>,
          <Badge key="calcom" variant="info" dot>Cal.com ativo</Badge>,
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-4 md:grid-cols-2">
          {vm.integracoes.map((integracao) => (
            <Card
              key={integracao.slug}
              className="overflow-hidden border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.94))] shadow-[var(--shadow-sm)]"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <Badge variant="info" size="sm">{integracao.categoria}</Badge>
                    <div>
                      <CardTitle className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{integracao.nome}</CardTitle>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{integracao.descricao}</p>
                    </div>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[color:rgba(56,189,248,0.24)] bg-[color:rgba(56,189,248,0.12)] text-[var(--info)] shadow-[0_18px_40px_-28px_rgba(56,189,248,0.65)]">
                    <CalendarClock className="h-5 w-5" />
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success" dot>{integracao.statusLabel}</Badge>
                  <Badge variant="secondary">EMPRESA e GERENTE</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-[var(--radius-card)] border border-[color:rgba(139,92,246,0.18)] bg-[color:rgba(139,92,246,0.08)] p-4">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{integracao.destaque}</p>
                </div>

                <div className="space-y-2">
                  {integracao.recursos.map((recurso) => (
                    <div key={recurso} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" />
                      <span>{recurso}</span>
                    </div>
                  ))}
                </div>

                <Button asChild className="w-full justify-between">
                  <Link href={integracao.href}>
                    Abrir configuracao
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-[var(--text-primary)]">
              <ShieldCheck className="h-4.5 w-4.5 text-[var(--success)]" />
              Governanca da conexao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
            <p>As integracoes ficam isoladas por empresa e respeitam a permissao operacional de administradores e gerentes.</p>
            <p>Para o Cal.com, a configuracao segue a infraestrutura atual de API key, testes de conexao e leitura dos compromissos comerciais.</p>
          </CardContent>
        </Card>
      </div>
    </ModulePageShell>
  );
}
