"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, Instagram, Loader2, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useInstagramModule } from "./hooks/use-instagram-module";
import type { InstagramConta, ModuloInstagramProps } from "./types";

function formatarDataHora(valor: string | null) {
  if (!valor) {
    return "Nao informado";
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function obterBadgeStatus(status: InstagramConta["status"]) {
  return status === "active"
    ? { variant: "success" as const, label: "Conectada" }
    : { variant: "warning" as const, label: "Precisa revisar" };
}

function obterIniciaisConta(conta: InstagramConta) {
  const base = conta.nome || conta.username;
  return base.slice(0, 2).toUpperCase();
}

type KpiCardProps = {
  titulo: string;
  valor: string;
  descricao: string;
  destaque?: boolean;
  icone: React.ReactNode;
};

function KpiCard({ titulo, valor, descricao, destaque = false, icone }: KpiCardProps) {
  return (
    <Card className={cn(
      "border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.92))]",
      destaque && "border-[color:rgba(139,92,246,0.24)] bg-[linear-gradient(180deg,rgba(28,20,43,0.95),rgba(12,12,14,0.94))]",
    )}>
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

export function ModuloInstagram({ perfil }: ModuloInstagramProps) {
  const vm = useInstagramModule();
  const [feedbackErro, setFeedbackErro] = useState<string | null>(null);
  const [feedbackSucesso, setFeedbackSucesso] = useState<string | null>(null);
  const [contaEmExclusao, setContaEmExclusao] = useState<string | null>(null);
  const podeExcluir = perfil === "EMPRESA";

  const resumo = useMemo(() => {
    const totalContas = vm.contas.length;
    const totalAtivas = vm.contas.filter((conta) => conta.status === "active").length;

    return {
      totalContas,
      totalAtivas,
      temContaAtiva: totalAtivas > 0,
    };
  }, [vm.contas]);

  async function handleExcluirConta(id: string, nome: string) {
    if (!podeExcluir || !window.confirm(`Remover a conta ${nome}?`)) {
      return;
    }

    setContaEmExclusao(id);
    setFeedbackErro(null);
    setFeedbackSucesso(null);

    try {
      const resultado = await vm.excluirConta(id);

      if (!resultado.sucesso) {
        setFeedbackErro(resultado.erro ?? "Nao foi possivel remover essa conta.");
        return;
      }

      setFeedbackSucesso("Conta do Instagram removida com sucesso.");
    } finally {
      setContaEmExclusao(null);
    }
  }

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title="Instagram"
        subtitle="Conecte o Instagram Business real da operacao para manter a conta salva e identificada dentro do CRM."
        icon={<Instagram className="h-5 w-5" />}
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
          <Badge key="social" variant="info">Social</Badge>,
          <Badge key="status" variant={resumo.temContaAtiva ? "success" : "warning"} dot>{resumo.temContaAtiva ? "Conta ativa" : "Aguardando conexao"}</Badge>,
        ]}
      />

      <InlineStatusAlert variant="error" message={vm.erro ?? feedbackErro} />
      <InlineStatusAlert variant="success" message={feedbackSucesso} icon={<CheckCircle2 className="h-4 w-4" />} />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          titulo="Status"
          valor={resumo.temContaAtiva ? "Conectado" : "Sem conta"}
          descricao={resumo.temContaAtiva ? "O Instagram ja esta salvo e pronto para ser usado pelo CRM." : "Conecte uma conta profissional para salvar o acesso no CRM."}
          destaque
          icone={<ShieldCheck className="h-5 w-5" />}
        />
        <KpiCard
          titulo="Contas conectadas"
          valor={String(resumo.totalContas)}
          descricao={resumo.totalContas === 1 ? "1 conta ligada nesta empresa" : `${resumo.totalContas} contas ligadas nesta empresa`}
          icone={<UserRound className="h-5 w-5" />}
        />
        <KpiCard
          titulo="Contas ativas"
          valor={String(resumo.totalAtivas)}
          descricao="Perfis que responderam ao OAuth e ficaram salvos com sucesso"
          icone={<Instagram className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-4">
          <Card className="border-[var(--border-subtle)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle className="text-base">Conectar Instagram oficial</CardTitle>
              <CardDescription>O botao abaixo inicia o OAuth oficial da Meta e retorna para o callback do HYPE CRM.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
                Use a mesma conta profissional que deve ficar vinculada a esta empresa. Ao concluir o login, o CRM salva os dados da conta conectada e mostra o perfil logo abaixo.
              </div>

              <div className="flex flex-col gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(28,20,43,0.95),rgba(12,12,14,0.94))] p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Fluxo oficial do Instagram Business Login</p>
                  <p className="text-sm text-[var(--text-secondary)]">O redirecionamento usa o callback configurado em `app.hypecrm.com.br`.</p>
                </div>
                <Button asChild className="min-w-52">
                  <a href="/api/integracoes/instagram/oauth/start">
                    <Instagram className="mr-2 h-4 w-4" />
                    Conectar Instagram
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.94))]">
            <CardHeader>
              <CardTitle className="text-base">Conta conectada</CardTitle>
              <CardDescription>Assim que o OAuth concluir, a conta aparece aqui com o identificador salvo para esta empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {vm.carregando ? (
                <div className="flex items-center gap-2 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando conta conectada...
                </div>
              ) : vm.contas.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-5 text-sm text-[var(--text-secondary)]">
                  Nenhuma conta conectada ainda. Clique em <strong className="text-[var(--text-primary)]">Conectar Instagram</strong> para iniciar o OAuth oficial.
                </div>
              ) : (
                vm.contas.map((conta) => {
                  const badge = obterBadgeStatus(conta.status);

                  return (
                    <div key={conta.id} className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)]">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-3">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[16px] border border-[var(--border-subtle)] bg-[color:rgba(139,92,246,0.16)] text-sm font-semibold text-[var(--text-primary)]">
                            {conta.profile_picture_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={conta.profile_picture_url} alt={conta.nome} className="h-full w-full object-cover" />
                            ) : (
                              obterIniciaisConta(conta)
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-[var(--text-primary)]">{conta.nome}</p>
                              <Badge variant={badge.variant} dot>{badge.label}</Badge>
                              {conta.account_type ? <Badge variant="secondary">{conta.account_type}</Badge> : null}
                            </div>
                            <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                              <p>@{conta.username}</p>
                              <p>ID Instagram: {conta.instagram_user_id}</p>
                              <p className="text-xs text-[var(--text-tertiary)]">Atualizado em {formatarDataHora(conta.atualizado_em)}</p>
                              <p className="text-xs text-[var(--text-tertiary)]">Expira em {formatarDataHora(conta.expires_at)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button asChild variant="secondary" size="sm">
                            <Link href={`https://instagram.com/${conta.username}`} target="_blank" rel="noreferrer">
                              Abrir perfil
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>

                          {podeExcluir ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleExcluirConta(conta.id, conta.nome)}
                              disabled={contaEmExclusao === conta.id}
                            >
                              {contaEmExclusao === conta.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
              <CardTitle className="text-base">O que acontece na conexao</CardTitle>
              <CardDescription>Esse fluxo salva a conta conectada seguindo o callback oficial da Meta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3">O CRM envia voce para o OAuth oficial do Instagram Business Login.</div>
              <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3">No callback, o sistema troca o code por token e identifica o perfil conectado.</div>
              <div className="rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3">Depois disso, a conta fica salva por empresa e aparece nesta tela.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModulePageShell>
  );
}
