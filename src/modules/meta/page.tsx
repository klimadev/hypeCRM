"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Link2,
  Loader2,
  RefreshCcw,
  Send,
  User,
  Zap,
} from "lucide-react";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMetaModule, type MetaCapiTestResult } from "./hooks/use-meta-module";
import type { ModuloMetaProps } from "./types";

function KpiCard({
  titulo,
  valor,
  descricao,
  icone,
  destaque = false,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  icone: React.ReactNode;
  destaque?: boolean;
}) {
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

export function ModuloMeta({ perfil }: ModuloMetaProps) {
  const vm = useMetaModule();

  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [eventName, setEventName] = useState("lead_closed");
  const [ativo, setAtivo] = useState(false);
  const [feedbackErro, setFeedbackErro] = useState<string | null>(null);
  const [feedbackSucesso, setFeedbackSucesso] = useState<string | null>(null);
  const [dadosConexao, setDadosConexao] = useState<MetaCapiTestResult | null>(null);
  const [testando, setTestando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const totalEventos = vm.eventos.length;
  const eventosEnviados = vm.eventos.filter((e) => e.evento_status === "ENVIADO").length;
  const eventosErro = vm.eventos.filter((e) => e.evento_status === "ERRO").length;

  if (vm.config && !pixelId && !accessToken) {
    setPixelId(vm.config.pixelId);
    setAccessToken(vm.config.accessToken);
    setEventName(vm.config.eventName);
    setAtivo(vm.config.ativo);
  }

  async function handleSalvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pixelId.trim() || !accessToken.trim()) {
      setFeedbackErro("Preencha o Pixel ID e Access Token.");
      return;
    }

    setFeedbackErro(null);
    setFeedbackSucesso(null);
    setSalvando(true);

    const resultado = await vm.salvarConfig({
      pixelId: pixelId.trim(),
      accessToken: accessToken.trim(),
      eventName: eventName.trim(),
      ativo,
    });

    setSalvando(false);

    if (!resultado.sucesso) {
      setFeedbackErro(resultado.erro ?? "Não foi possível salvar a configuração agora.");
      return;
    }

    setFeedbackSucesso("Configuração salva com sucesso.");
  }

  async function handleTestar() {
    setTestando(true);
    setFeedbackErro(null);
    setFeedbackSucesso(null);
    setDadosConexao(null);

    const resultado = await vm.testarConexao();

    setTestando(false);

    if (!resultado.sucesso) {
      const erroMsg = resultado.erro ?? "Não foi possível testar a conexão agora.";
      let erroDetalhado = erroMsg;
      if (resultado.dados?.erroTipo) {
        const erroTipos: Record<string, string> = {
          token_invalido: " O token pode ter expirado ou sido revogado.",
          pixel_invalido: " O Pixel ID parece estar incorreto.",
          payload_insuficiente: " Os dados de teste não foram suficientes.",
          sem_permissao: " O token não tem permissões suficientes.",
          forbidden: " O token não tem acesso a este Pixel.",
          nao_encontrado: " O Pixel ID não foi encontrado.",
        };
        erroDetalhado += erroTipos[resultado.dados.erroTipo] || "";
      }
      setFeedbackErro(erroDetalhado);
      return;
    }

    if (resultado.dados) {
      setDadosConexao(resultado.dados);
      setFeedbackSucesso(resultado.dados.automaticoAtivo 
        ? `Envio aceito. fbtrace_id: ${resultado.dados.fbtraceId ?? "não retornado"}.` 
        : `Envio aceito, mas o automático está desativado. fbtrace_id: ${resultado.dados.fbtraceId ?? "não retornado"}.`);
    } else {
      setFeedbackSucesso("Conexão validada com sucesso.");
    }
  }

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title="Meta CAPI"
        subtitle="Conecte o CRM à Conversions API da Meta para enviar eventos automáticos de conversão."
        icon={<Zap className="h-5 w-5" />}
        iconTone="blue"
        className="px-4 py-4 md:px-5 md:py-4"
        actions={(
          <Button asChild variant="outline" size="sm">
            <Link href="/integracoes">
              <ArrowLeft className="h-4 w-4" />
              Voltar para integrações
            </Link>
          </Button>
        )}
        badges={[
          <Badge key="conversao" variant="info">Conversão</Badge>,
          <Badge key="status" variant={ativo ? "success" : "warning"} dot>{ativo ? "Ativo" : "Inativo"}</Badge>,
        ]}
      />

      <InlineStatusAlert variant="error" message={vm.erro ?? feedbackErro} />
      <InlineStatusAlert variant="success" message={feedbackSucesso} icon={<CheckCircle2 className="h-4 w-4" />} />
      
      {dadosConexao && (
        <Card className="border-[var(--brand)] bg-[linear-gradient(180deg,rgba(139,92,246,0.08),rgba(139,92,246,0.02))]">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)]/20">
                <CheckCircle2 className="h-5 w-5 text-[var(--brand)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Envio de teste CAPI</p>
                <p className="text-sm text-[var(--text-secondary)]">Pixel ID: {dadosConexao.pixelId}</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 text-sm md:items-end">
              <Badge variant={dadosConexao.automaticoAtivo ? "success" : "warning"}>
                {dadosConexao.automaticoAtivo ? "Automático ativo" : "Automático inativo"}
              </Badge>
              <p className="text-[var(--text-secondary)]">events_received: {dadosConexao.eventsReceived}</p>
              <p className="text-[var(--text-secondary)]">fbtrace_id: {dadosConexao.fbtraceId ?? "não retornado"}</p>
            </div>
          </CardContent>
          <CardContent className="border-t border-[var(--border-subtle)] p-4">
            <div className="space-y-2 text-xs text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--text-primary)]">Resposta bruta</p>
              <pre className="overflow-auto rounded-lg bg-[var(--surface-elevated)] p-3 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                {dadosConexao.respostaBruta}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          titulo="Eventos disparados"
          valor={String(totalEventos)}
          descricao={totalEventos === 1 ? "1 evento registrado" : `${totalEventos} eventos registrados`}
          icone={<Send className="h-5 w-5" />}
        />
        <KpiCard
          titulo="Enviados com sucesso"
          valor={String(eventosEnviados)}
          descricao="Eventos entregues à Meta"
          icone={<CheckCircle2 className="h-5 w-5" />}
        />
        <KpiCard
          titulo="Erros"
          valor={String(eventosErro)}
          descricao="Eventos que falharam"
          icone={<RefreshCcw className="h-5 w-5" />}
          destaque={eventosErro > 0}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          <Card className="border-[var(--border-subtle)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle className="text-base">Configurar Meta Conversions API</CardTitle>
              <CardDescription>
                Informe o Pixel ID e Access Token da sua conta de anúncios Meta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSalvar} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Pixel ID</label>
                  <Input
                    placeholder="1234567890"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Access Token</label>
                  <Input
                    placeholder="EAAC..."
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Nome do Evento</label>
                  <Input
                    placeholder="lead_closed"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-subtle)] bg-[var(--surface-elevated)]"
                  />
                  <label htmlFor="ativo" className="text-sm text-[var(--text-primary)]">
                    Ativar envio automático ao fechar leads
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={salvando}>
                    {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar configuração
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={testando || !pixelId.trim() || !accessToken.trim()}
                    onClick={handleTestar}
                  >
                    {testando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Testar conexão
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-[var(--border-subtle)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle className="text-base">Como funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="flex gap-2">
                <KeyRound className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                <p>
                  <strong className="text-[var(--text-primary)]">Hash de telefone:</strong> O evento usa o
                  telefone do lead com hash SHA-256 para identificar o usuário sem expor dados pessoais.
                </p>
              </div>
              <div className="flex gap-2">
                <Link2 className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                <p>
                  <strong className="text-[var(--text-primary)]">Disparo automático:</strong> Quando um
                  lead mudar para o estágio &quot;fechado&quot;, um evento é enviado automaticamente.
                </p>
              </div>
              <div className="flex gap-2">
                <RefreshCcw className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                <p>
                  <strong className="text-[var(--text-primary)]">Idempotência:</strong> Cada ciclo de
                  fechamento gera uma chave única para evitar duplicatas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModulePageShell>
  );
}
