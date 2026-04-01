"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  KeyRound,
  Link2,
  Loader2,
  RefreshCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AgendaWidget } from "./components/agenda-widget";
import { useCalComModule } from "./hooks/use-calcom-module";
import { criarResumoOperacionalCalCom } from "./resumo-operacional";
import type { CalComInstancia, ModuloCalComProps } from "./types";

function formatarDataHora(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Sem verificacao recente";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function obterBadgeStatus(status: CalComInstancia["status"]): { variant: "success" | "warning"; label: string } {
  if (status === "active") {
    return { variant: "success", label: "Funcionando" };
  }

  return { variant: "warning", label: "Precisa verificar" };
}

type KpiCardProps = {
  titulo: string;
  valor: string;
  descricao: string;
  icone: React.ReactNode;
  destaque?: boolean;
};

function KpiCard({ titulo, valor, descricao, icone, destaque = false }: KpiCardProps) {
  return (
    <Card
      className={destaque
        ? "relative overflow-hidden border-[color:rgba(139,92,246,0.24)] bg-[linear-gradient(180deg,rgba(28,20,43,0.95),rgba(12,12,14,0.94))]"
        : "border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.92))]"
      }
    >
      <CardContent className="flex items-center justify-between gap-4 p-4 md:p-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{titulo}</p>
          <p className="text-xl font-semibold tracking-tight text-[var(--text-primary)] md:text-2xl">{valor}</p>
          <p className="text-sm text-[var(--text-secondary)]">{descricao}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[color:rgba(139,92,246,0.24)] bg-[color:rgba(139,92,246,0.12)] text-[var(--brand)]">
          {icone}
        </span>
      </CardContent>
    </Card>
  );
}

export function ModuloCalCom({ perfil }: ModuloCalComProps) {
  const vm = useCalComModule();
  const resumo = useMemo(
    () =>
      criarResumoOperacionalCalCom({
        instancias: vm.instancias,
        bookings: vm.bookings,
        eventTypes: vm.eventTypes,
      }),
    [vm.bookings, vm.eventTypes, vm.instancias],
  );

  const [nomeInstancia, setNomeInstancia] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [feedbackErro, setFeedbackErro] = useState<string | null>(null);
  const [feedbackSucesso, setFeedbackSucesso] = useState<string | null>(null);
  const [instanciaEmTeste, setInstanciaEmTeste] = useState<string | null>(null);
  const [instanciaEmExclusao, setInstanciaEmExclusao] = useState<string | null>(null);

  const podeExcluir = perfil === "EMPRESA";

  async function handleCriarInstancia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nomeInstancia.trim() || !apiKey.trim()) {
      return;
    }

    setFeedbackErro(null);
    setFeedbackSucesso(null);

    const resultado = await vm.criarInstancia(nomeInstancia.trim(), apiKey.trim());

    if (!resultado.sucesso) {
      setFeedbackErro(resultado.erro ?? "Nao foi possivel conectar a conta agora.");
      return;
    }

    setNomeInstancia("");
    setApiKey("");
    setFeedbackSucesso("Conta do Cal.com conectada com sucesso.");
  }

  async function handleTestarConexao(id: string) {
    setInstanciaEmTeste(id);
    setFeedbackErro(null);
    setFeedbackSucesso(null);

    try {
      const resultado = await vm.testarConexao(id);

      if (!resultado.sucesso) {
        setFeedbackErro(resultado.erro ?? "Nao foi possivel confirmar essa conexao agora.");
        return;
      }

      setFeedbackSucesso("Conexao validada com sucesso.");
    } finally {
      setInstanciaEmTeste(null);
    }
  }

  async function handleExcluirInstancia(id: string, nome: string) {
    if (!podeExcluir || !window.confirm(`Remover a conta ${nome}?`)) {
      return;
    }

    setInstanciaEmExclusao(id);
    setFeedbackErro(null);
    setFeedbackSucesso(null);

    try {
      const resultado = await vm.excluirInstancia(id);

      if (!resultado.sucesso) {
        setFeedbackErro(resultado.erro ?? "Nao foi possivel remover essa conta.");
        return;
      }

      setFeedbackSucesso("Conta removida com sucesso.");
    } finally {
      setInstanciaEmExclusao(null);
    }
  }

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title="Cal.com"
        subtitle="Conecte sua agenda do Cal.com para ver reunioes, links de agendamento e contas usadas pela operacao."
        icon={<CalendarRange className="h-5 w-5" />}
        iconTone="blue"
        className="px-4 py-4 md:px-5 md:py-4"
        actions={(
          <Button asChild variant="outline" size="sm">
            <Link href="/integracoes">
              <ArrowLeft className="h-4 w-4" />
              Voltar para integracoes
            </Link>
          </Button>
        )}
        badges={[
          <Badge key="agenda" variant="info">Agenda</Badge>,
          <Badge key="status" variant={resumo.temConexaoAtiva ? "success" : "warning"} dot>{resumo.rotuloStatus}</Badge>,
        ]}
      />

      <InlineStatusAlert variant="error" message={vm.erro ?? feedbackErro} />
      <InlineStatusAlert variant="success" message={feedbackSucesso} icon={<CheckCircle2 className="h-4 w-4" />} />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          titulo="Status"
          valor={resumo.temConexaoAtiva ? "Conectado" : "Aguardando conexao"}
          descricao={resumo.temConexaoAtiva ? "O CRM ja consegue ler a agenda dessa integracao." : "Conecte e teste uma conta para liberar a agenda no CRM."}
          icone={<Link2 className="h-5 w-5" />}
          destaque
        />
        <KpiCard
          titulo="Contas conectadas"
          valor={String(resumo.totalInstancias)}
          descricao={resumo.totalInstancias === 1 ? "1 conta salva neste CRM" : `${resumo.totalInstancias} contas salvas neste CRM`}
          icone={<CalendarDays className="h-5 w-5" />}
        />
        <KpiCard
          titulo="Reunioes"
          valor={String(resumo.totalBookings)}
          descricao="Compromissos puxados das contas que estao ativas"
          icone={<Sparkles className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          <Card className="border-[var(--border-subtle)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle className="text-base">Conectar uma conta do Cal.com</CardTitle>
              <CardDescription>{resumo.mensagemOperacional}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCriarInstancia}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="calcom-nome" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Nome da conta
                    </label>
                    <Input
                      id="calcom-nome"
                      placeholder="Ex: Agenda comercial"
                      value={nomeInstancia}
                      onChange={(event) => setNomeInstancia(event.target.value)}
                      minLength={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="calcom-api-key" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Cole sua chave do Cal.com
                    </label>
                    <Input
                      id="calcom-api-key"
                      placeholder="Cole sua API key do Cal.com"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      minLength={10}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-[var(--text-secondary)]">Depois de salvar, voce pode verificar se a conta esta funcionando e usar os links de agendamento abaixo.</p>
                  <Button className="min-w-44" disabled={!nomeInstancia.trim() || !apiKey.trim()}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Conectar agora
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.94))]">
            <CardHeader>
              <CardTitle className="text-base">Contas conectadas</CardTitle>
              <CardDescription>Veja abaixo as contas ja ligadas ao CRM. Aqui voce pode verificar se estao funcionando ou remover acessos antigos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {vm.carregando ? (
                <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando contas conectadas...
                </div>
              ) : vm.instancias.length === 0 ? (
                <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-5 text-sm text-[var(--text-secondary)]">
                  Nenhuma conta conectada ainda. Cole sua chave do Cal.com acima para comecar.
                </div>
              ) : (
                vm.instancias.map((instancia) => {
                  const badge = obterBadgeStatus(instancia.status);

                  return (
                    <div
                      key={instancia.id}
                      className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{instancia.nome}</p>
                            <Badge variant={badge.variant} dot>{badge.label}</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                            <p>{instancia.profile_name ?? "Nome do perfil ainda nao identificado"}</p>
                            <p>{instancia.profile_email ?? "O e-mail aparece depois que voce verifica a conexao"}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">Ultima verificacao: {formatarDataHora(instancia.atualizado_em)}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleTestarConexao(instancia.id)}
                            disabled={instanciaEmTeste === instancia.id}
                          >
                            {instanciaEmTeste === instancia.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCcw className="h-4 w-4" />
                            )}
                            Ver se esta funcionando
                          </Button>

                          {podeExcluir ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleExcluirInstancia(instancia.id, instancia.nome)}
                              disabled={instanciaEmExclusao === instancia.id}
                            >
                              {instanciaEmExclusao === instancia.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Remover
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.94))]">
            <CardHeader>
              <CardTitle className="text-base">O que voce pode fazer aqui</CardTitle>
              <CardDescription>Essa tela foi feita para voce resolver o essencial sem precisar conhecer o sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3">
                Conectar uma nova conta do Cal.com ao CRM.
              </div>
              <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3">
                Ver se a conta esta funcionando e puxando agenda.
              </div>
              <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3">
                Abrir links de agendamento e acompanhar proximas reunioes.
              </div>
            </CardContent>
          </Card>

          <AgendaWidget bookings={vm.bookings} carregando={vm.carregando} erro={vm.erro} />

          <Card className="border-[var(--border-subtle)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle className="text-base">Links de agendamento</CardTitle>
              <CardDescription>Abra os links ja publicados no Cal.com para distribuir para time, parceiros ou clientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {vm.eventTypes.length === 0 ? (
                <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-5 text-sm text-[var(--text-secondary)]">
                  Assim que uma conta responder com sucesso, os links de agendamento aparecem aqui.
                </div>
              ) : (
                vm.eventTypes.slice(0, 6).map((eventType) => (
                  <div
                    key={`${eventType.instanciaNome}-${eventType.id}`}
                    className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{eventType.title}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{eventType.instanciaNome}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{eventType.length} min • {eventType.slug}</p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={eventType.schedulingUrl} target="_blank" rel="noreferrer">
                          Abrir
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModulePageShell>
  );
}
