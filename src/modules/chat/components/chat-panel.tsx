"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  Layers3,
  Megaphone,
  MessageCircle,
  RefreshCw,
  Phone,
  UserPlus,
  UserRound,
  PanelRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChatMessagesPanel } from "./chat-messages-panel";
import type { ChatUnificado } from "../types";
import { formatarTelefoneChat, obterMetaOrigemLead, obterNomeChat } from "../helpers";
import {
  acionarConversaFollowUp,
  ativarConversaFollowUp,
  listarTemplatesFollowUp,
  obterConversaFollowUp,
  type FollowUpConversa,
  type FollowUpTemplate,
} from "@/lib/api/chat-follow-up";

function obterApresentacaoStatusFollowUp(followUp: FollowUpConversa | null) {
  if (!followUp) {
    return { variant: "secondary" as const, label: "Desativado" };
  }

  if (followUp.status === "ATIVO") {
    return { variant: "success" as const, label: "Ativo" };
  }

  if (followUp.status === "PAUSADO") {
    return { variant: "secondary" as const, label: "Pausado" };
  }

  if (followUp.motivoEncerramento === "Cliente respondeu") {
    return { variant: "success" as const, label: "Encerrado (respondeu)" };
  }

  return { variant: "secondary" as const, label: "Encerrado" };
}

function formatarTempoAteDisparo(dataIso: string | null) {
  if (!dataIso) return null;

  const alvo = new Date(dataIso).getTime();
  if (Number.isNaN(alvo)) return null;

  const diferencaMinutos = Math.round((alvo - Date.now()) / 60000);
  if (Math.abs(diferencaMinutos) < 1) return "agora";

  const total = Math.abs(diferencaMinutos);
  const dias = Math.floor(total / 1440);
  const horas = Math.floor((total % 1440) / 60);
  const minutos = total % 60;
  const partes: string[] = [];

  if (dias > 0) partes.push(`${dias}d`);
  if (horas > 0) partes.push(`${horas}h`);
  if (minutos > 0) partes.push(`${minutos}min`);

  const sufixo = diferencaMinutos > 0 ? "restantes" : "em atraso";
  return `${partes.join(" ")} ${sufixo}`;
}

function formatarTempoRelativoCurto(referencia: Date | null) {
  if (!referencia) return "sem atualizacao";

  const deltaSegundos = Math.max(0, Math.floor((Date.now() - referencia.getTime()) / 1000));
  if (deltaSegundos < 10) return "agora";
  if (deltaSegundos < 60) return `${deltaSegundos}s`;

  const deltaMinutos = Math.floor(deltaSegundos / 60);
  if (deltaMinutos < 60) return `${deltaMinutos}min`;

  const deltaHoras = Math.floor(deltaMinutos / 60);
  return `${deltaHoras}h`;
}

type ChatPanelProps = {
  chat: ChatUnificado;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  onVoltar?: () => void;
  onRegistrarLead: (params: {
    telefone: string;
    nome?: string;
    id_pdv?: string;
    id_funcionario?: string;
  }) => Promise<void>;
  onCriarNegocio: (params: {
    telefone: string;
    nome?: string;
    id_pdv?: string;
    id_funcionario?: string;
    id_estagio?: string;
  }) => Promise<void>;
  onTransferirLead: (params: { idLead: string; idFuncionario: string }) => Promise<void>;
};

export function ChatPanel({
  chat,
  perfil,
  onVoltar,
  onRegistrarLead,
  onCriarNegocio,
  onTransferirLead,
}: ChatPanelProps) {
  const [dialogOpen, setDialogOpen] = useState<"lead" | "negocio" | null>(null);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const [transferirAberto, setTransferirAberto] = useState(false);
  const [followUp, setFollowUp] = useState<FollowUpConversa | null>(null);
  const [templates, setTemplates] = useState<FollowUpTemplate[]>([]);
  const [templateSelecionado, setTemplateSelecionado] = useState("");
  const [salvandoFollowUp, setSalvandoFollowUp] = useState(false);
  const [carregandoFollowUp, setCarregandoFollowUp] = useState(false);
  const [ultimaAtualizacaoFollowUp, setUltimaAtualizacaoFollowUp] = useState<Date | null>(null);
  const { addToast } = useToast();

  const nome = obterNomeChat(chat);
  const origemLead = obterMetaOrigemLead(chat.leadMatch?.origem);
  const telefone = formatarTelefoneChat(chat.telefone);
  const statusPrincipal = chat.semMatch ? "Novo contato" : chat.leadMatch?.nome_estagio ?? "Lead vinculado";
  const canalLabel = chat.canal === "instagram" ? "Instagram" : "WhatsApp";

  const carregarContextoFollowUp = useCallback(async (mostrarErro = false) => {
    if (!chat.leadMatch || chat.canal !== "whatsapp") return;

    setCarregandoFollowUp(true);
    const [conversaResult, templatesResult] = await Promise.all([
      obterConversaFollowUp(chat.instanceName, chat.remoteJid),
      listarTemplatesFollowUp(),
    ]);
    setCarregandoFollowUp(false);

    if (conversaResult.ok) {
      setFollowUp(conversaResult.dados.conversa);
    } else if (mostrarErro) {
      addToast({ type: "error", title: "Erro ao atualizar follow-up", description: conversaResult.erro });
    }

    if (templatesResult.ok) {
      setTemplates(templatesResult.dados.templates.filter((template) => template.ativo && template.canal === "whatsapp"));
    } else if (mostrarErro) {
      addToast({ type: "error", title: "Erro ao atualizar cadencias", description: templatesResult.erro });
    }

    setUltimaAtualizacaoFollowUp(new Date());
  }, [addToast, chat.canal, chat.instanceName, chat.leadMatch, chat.remoteJid]);

  useEffect(() => {
    if (!detalhesAbertos || !chat.leadMatch || chat.canal !== "whatsapp") return;

    let ativo = true;

    const carregarComControle = async () => {
      await carregarContextoFollowUp();
      if (!ativo) return;
    };

    void carregarComControle();
    const intervalo = window.setInterval(() => {
      void carregarComControle();
    }, 30000);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [carregarContextoFollowUp, chat.canal, chat.leadMatch, detalhesAbertos]);

  const statusUi = obterApresentacaoStatusFollowUp(followUp);
  const possuiTemplatesAtivos = templates.length > 0;
  const podeAtivarFollowUp = !followUp && possuiTemplatesAtivos;
  const templateSelecionadoEfetivo = templateSelecionado || templates[0]?.id || "";
  const tempoAteProximoDisparo = formatarTempoAteDisparo(followUp?.proximoDisparoEm ?? null);
  const atualizadoHa = formatarTempoRelativoCurto(ultimaAtualizacaoFollowUp);

  const executarAcaoFollowUp = useCallback(async (acao: "PAUSAR" | "RETOMAR" | "ENCERRAR") => {
    if (!followUp) return;

    if (acao === "ENCERRAR") {
      const confirmado = window.confirm("Encerrar este follow-up agora? Os proximos disparos serao cancelados.");
      if (!confirmado) return;
    }

    setSalvandoFollowUp(true);
    const resultado = await acionarConversaFollowUp({ conversaId: followUp.id, acao });
    setSalvandoFollowUp(false);
    if (!resultado.ok) {
      addToast({
        type: "error",
        title: acao === "PAUSAR" ? "Erro ao pausar" : acao === "RETOMAR" ? "Erro ao retomar" : "Erro ao encerrar",
        description: resultado.erro,
      });
      return;
    }

    setFollowUp(resultado.dados.conversa);
    addToast({
      type: "success",
      title: acao === "PAUSAR" ? "Follow-up pausado" : acao === "RETOMAR" ? "Follow-up retomado" : "Follow-up encerrado",
    });
    void carregarContextoFollowUp();
  }, [addToast, carregarContextoFollowUp, followUp]);

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col bg-[var(--surface)]">
        <header className="shrink-0 border-b border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] px-3 py-2.5 md:px-4">
          <div className="flex flex-wrap items-start gap-2.5 lg:items-center">
            {onVoltar ? (
              <button
                type="button"
                onClick={onVoltar}
                className="rounded-xl p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)] md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:rgba(139,92,246,0.24)] bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand)]">
              {chat.semMatch ? <MessageCircle className="h-4 w-4" /> : nome.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)] md:text-[15px]">{nome}</p>
                <Badge variant={chat.semMatch ? "secondary" : "success"} size="sm" dot>
                  {chat.semMatch ? "Novo" : "CRM"}
                </Badge>
                <Badge variant="secondary" size="sm">{canalLabel}</Badge>
                {origemLead ? (
                  <Badge variant={origemLead.variant} size="sm" className="hidden sm:inline-flex" dot>
                    {origemLead.label}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-[var(--text-tertiary)]" />
                  {telefone}
                </span>
                <span className="truncate">{statusPrincipal}</span>
                {chat.unreadCount > 0 ? <span>{chat.unreadCount} não lida(s)</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {chat.semMatch ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 min-h-9 gap-1.5 rounded-xl px-3 text-[11px]"
                  onClick={() => setDialogOpen("lead")}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Registrar lead</span>
                </Button>
              ) : null}
              <Button size="sm" className="h-9 min-h-9 gap-1.5 rounded-xl px-3 text-[11px]" onClick={() => setDialogOpen("negocio")}>
                <Briefcase className="h-4 w-4" />
                <span>Criar negócio</span>
              </Button>
              {chat.leadMatch ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 min-h-9 gap-1.5 rounded-xl px-3 text-[11px]"
                  onClick={() => setTransferirAberto(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Transferir</span>
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 min-h-9 gap-1.5 rounded-xl px-2.5 text-[11px]"
                onClick={() => setDetalhesAbertos(true)}
              >
                <PanelRight className="h-4 w-4" />
                <span className="hidden sm:inline">Detalhes</span>
              </Button>
            </div>
          </div>
        </header>

        <ChatMessagesPanel
          instanceName={chat.instanceName}
          remoteJid={chat.remoteJid}
          chatContext={{
            telefone: chat.telefone,
            pushName: chat.pushName,
            canal: chat.canal,
            leadMatch: chat.leadMatch,
          }}
        />
      </div>

      <Sheet open={detalhesAbertos} onOpenChange={setDetalhesAbertos}>
        <SheetContent side="right" className="w-full max-w-[26rem] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.98))] p-0">
          <SheetHeader className="gap-2 px-4 py-4">
            <SheetTitle>Detalhes da conversa</SheetTitle>
            <SheetDescription>
              Contexto do contato sem roubar espaço da leitura do feed.
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:rgba(139,92,246,0.24)] bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand)]">
                  {chat.semMatch ? <MessageCircle className="h-4 w-4" /> : nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{nome}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={chat.semMatch ? "secondary" : "success"} size="sm" dot>
                      {chat.semMatch ? "Sem lead" : "Lead vinculado"}
                    </Badge>
                    {origemLead ? (
                      <Badge variant={origemLead.variant} size="sm" dot>
                        {origemLead.label}
                      </Badge>
                    ) : null}
                    <Badge variant="secondary" size="sm">{chat.instanceName}</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-[12px] text-[var(--text-secondary)]">
                <div className="inline-flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                  {telefone}
                </div>
                {chat.leadMatch?.nome_funcionario ? (
                  <div className="inline-flex items-center gap-2">
                    <UserRound className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    {chat.leadMatch.nome_funcionario}
                  </div>
                ) : null}
                {chat.leadMatch?.nome_pdv ? (
                  <div className="inline-flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    {chat.leadMatch.nome_pdv}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <InfoCard icon={<Layers3 className="h-4 w-4" />} label="Estágio" value={chat.leadMatch?.nome_estagio ?? "Sem estágio"} description="Fase operacional atual" />
              <InfoCard icon={<UserRound className="h-4 w-4" />} label="Responsável" value={chat.leadMatch?.nome_funcionario ?? "Não atribuído"} description="Pessoa que conduz o lead" />
              <InfoCard icon={<Building2 className="h-4 w-4" />} label="PDV" value={chat.leadMatch?.nome_pdv ?? "Sem PDV"} description={chat.leadMatch?.empresa_origem ?? "Origem operacional do lead"} />
              <InfoCard icon={<Megaphone className="h-4 w-4" />} label="Origem" value={origemLead?.label ?? "Não informada"} description={chat.leadMatch?.fonte ?? "Sem fonte complementar"} />
              <InfoCard
                icon={<Briefcase className="h-4 w-4" />}
                label="Negócio"
                value={chat.leadMatch?.negocio?.titulo ?? (chat.leadMatch?.id_negocio ? "Vinculado" : "Nenhum")}
                description={
                  chat.leadMatch?.negocio
                    ? `${chat.leadMatch.negocio.status} · ${chat.leadMatch.negocio.id}`
                    : chat.leadMatch?.id_negocio ?? "Ainda sem negócio associado"
                }
              />
            </div>

            {chat.leadMatch ? (
              <div className="mt-4 rounded-[20px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Contexto operacional</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">O chat já nasce com dono e estágio</p>
                  </div>
                  <Badge variant={chat.leadMatch.id_funcionario ? "success" : "secondary"} size="sm" dot>
                    {chat.leadMatch.id_funcionario ? "Atribuído" : "Sem dono"}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-[12px] text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                    <span>Dono</span>
                    <span className="truncate font-medium text-[var(--text-primary)]">{chat.leadMatch.nome_funcionario ?? "Não atribuído"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                    <span>PDV</span>
                    <span className="truncate font-medium text-[var(--text-primary)]">{chat.leadMatch.nome_pdv ?? "Sem PDV"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                    <span>Lead</span>
                    <span className="truncate font-medium text-[var(--text-primary)]">{chat.leadMatch.nome}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {chat.leadMatch && chat.canal === "whatsapp" ? (
              <div className="mt-4 rounded-[20px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Follow-up automatico</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Cadencia por conversa</p>
                    <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">Atualizado ha {atualizadoHa}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={carregandoFollowUp}
                      onClick={() => {
                        void carregarContextoFollowUp(true);
                      }}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${carregandoFollowUp ? "animate-spin" : ""}`} />
                    </Button>
                    <Badge variant={statusUi.variant} size="sm" dot>
                      {statusUi.label}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-[12px] text-[var(--text-secondary)]">
                  {followUp ? (
                    <>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                        <span>Cadencia</span>
                        <span className="truncate font-medium text-[var(--text-primary)]">{followUp.template.nome}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                        <span>Etapa atual</span>
                        <span className="font-medium text-[var(--text-primary)]">Mensagem {Math.max(1, followUp.etapaAtual)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                        <span>Ciclo</span>
                        <span className="font-medium text-[var(--text-primary)]">{followUp.cicloAtual}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                        <span>Proximo disparo</span>
                        <span className="text-right font-medium text-[var(--text-primary)]">
                          {followUp.proximoDisparoEm ? new Date(followUp.proximoDisparoEm).toLocaleString("pt-BR") : "Sem agendamento"}
                          {tempoAteProximoDisparo ? <span className="block text-[10px] text-[var(--text-secondary)]">{tempoAteProximoDisparo}</span> : null}
                        </span>
                      </div>
                      {followUp.ultimaRespostaEm ? (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                          <span>Ultima resposta</span>
                          <span className="font-medium text-[var(--text-primary)]">{new Date(followUp.ultimaRespostaEm).toLocaleString("pt-BR")}</span>
                        </div>
                      ) : null}
                      {followUp.status === "PAUSADO" && followUp.motivoPausa ? (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                          <span>Motivo</span>
                          <span className="font-medium text-[var(--text-primary)]">{followUp.motivoPausa}</span>
                        </div>
                      ) : null}
                      {followUp.status === "ENCERRADO" && followUp.motivoEncerramento ? (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                          <span>Motivo</span>
                          <span className="font-medium text-[var(--text-primary)]">{followUp.motivoEncerramento}</span>
                        </div>
                      ) : null}
                      {followUp.status === "ENCERRADO" ? (
                        <div className="rounded-xl border border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.1)] px-3 py-2 text-[11px] text-[var(--text-primary)]">
                          {followUp.motivoEncerramento === "Cliente respondeu"
                            ? "Follow-up encerrado automaticamente: o lead respondeu e os proximos disparos foram cancelados."
                            : `Follow-up encerrado: ${followUp.motivoEncerramento ?? "Fluxo concluido."}`}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Select value={templateSelecionadoEfetivo} onValueChange={setTemplateSelecionado}>
                        <SelectTrigger disabled={salvandoFollowUp || carregandoFollowUp}>
                          <SelectValue placeholder="Selecione uma cadencia" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!possuiTemplatesAtivos ? (
                        <div className="rounded-xl border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.1)] px-3 py-2 text-[11px] text-[var(--text-primary)]">
                          Nenhuma cadencia ativa encontrada. Crie/ative uma cadencia em Configuracoes para habilitar o follow-up automatico.
                        </div>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        disabled={!templateSelecionadoEfetivo || salvandoFollowUp || !podeAtivarFollowUp}
                        onClick={async () => {
                          if (!chat.leadMatch || !templateSelecionadoEfetivo) return;
                          setSalvandoFollowUp(true);
                          const resultado = await ativarConversaFollowUp({
                            instanceName: chat.instanceName,
                            remoteJid: chat.remoteJid,
                            idLead: chat.leadMatch.id,
                            templateId: templateSelecionadoEfetivo,
                          });
                          setSalvandoFollowUp(false);
                          if (!resultado.ok) {
                            addToast({ type: "error", title: "Erro ao ativar follow-up", description: resultado.erro });
                            return;
                          }
                          setFollowUp(resultado.dados.conversa);
                          void carregarContextoFollowUp();
                          addToast({ type: "success", title: "Follow-up ativado" });
                        }}
                      >
                        {salvandoFollowUp ? "Ativando..." : "Ativar cadencia"}
                      </Button>
                    </>
                  )}
                </div>

                {followUp ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {followUp.status === "ATIVO" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={salvandoFollowUp || carregandoFollowUp}
                        onClick={() => {
                          void executarAcaoFollowUp("PAUSAR");
                        }}
                      >
                        Pausar
                      </Button>
                    ) : null}
                    {followUp.status === "PAUSADO" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={salvandoFollowUp || carregandoFollowUp}
                        onClick={() => {
                          void executarAcaoFollowUp("RETOMAR");
                        }}
                      >
                        Retomar
                      </Button>
                    ) : null}
                    {followUp.status !== "ENCERRADO" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={salvandoFollowUp || carregandoFollowUp}
                        onClick={() => {
                          void executarAcaoFollowUp("ENCERRAR");
                        }}
                      >
                        Encerrar
                      </Button>
                    ) : null}
                    {followUp.status === "ENCERRADO" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={salvandoFollowUp || carregandoFollowUp || !chat.leadMatch}
                        onClick={async () => {
                          if (!chat.leadMatch) return;
                          setSalvandoFollowUp(true);
                          const resultado = await ativarConversaFollowUp({
                            instanceName: chat.instanceName,
                            remoteJid: chat.remoteJid,
                            idLead: chat.leadMatch.id,
                            templateId: followUp.template.id,
                          });
                          setSalvandoFollowUp(false);
                          if (!resultado.ok) {
                            addToast({ type: "error", title: "Erro ao reativar", description: resultado.erro });
                            return;
                          }
                          setFollowUp(resultado.dados.conversa);
                          void carregarContextoFollowUp();
                          addToast({ type: "success", title: "Follow-up reativado" });
                        }}
                      >
                        Reativar cadencia
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <OrphanDialog
        key={`lead-${chat.instanceName}-${chat.remoteJid}`}
        open={dialogOpen === "lead"}
        onOpenChange={(open) => {
          if (!open) setDialogOpen(null);
        }}
        title="Registrar como Lead"
        description="Cadastrar este contato como um novo lead no CRM."
        telefone={chat.telefone}
        nomeInicial={chat.pushName && chat.pushName !== "Você" ? chat.pushName : ""}
        perfil={perfil}
        onSubmit={(params) => {
          void onRegistrarLead(params);
          setDialogOpen(null);
        }}
      />

      <OrphanDialog
        key={`negocio-${chat.instanceName}-${chat.remoteJid}`}
        open={dialogOpen === "negocio"}
        onOpenChange={(open) => {
          if (!open) setDialogOpen(null);
        }}
        title="Criar negócio"
        description="Cadastrar o contato e abrir um negócio a partir desta conversa."
        telefone={chat.telefone}
        nomeInicial={chat.pushName && chat.pushName !== "Você" ? chat.pushName : ""}
        perfil={perfil}
        onSubmit={(params) => {
          void onCriarNegocio(params);
          setDialogOpen(null);
        }}
      />

      <TransferLeadDialog
        open={transferirAberto}
        onOpenChange={setTransferirAberto}
        leadId={chat.leadMatch?.id ?? null}
        leadAtual={chat.leadMatch?.nome_funcionario ?? null}
        onSubmit={onTransferirLead}
      />
    </>
  );
}

type FuncionarioItem = {
  id: string;
  nome: string;
};

function TransferLeadDialog({
  open,
  onOpenChange,
  leadId,
  leadAtual,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  leadAtual: string | null;
  onSubmit: (params: { idLead: string; idFuncionario: string }) => Promise<void>;
}) {
  const [funcionarios, setFuncionarios] = useState<FuncionarioItem[]>([]);
  const [idFuncionario, setIdFuncionario] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;

    let ativo = true;
    setCarregando(true);
    fetch("/api/leads", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!ativo) return;
        setFuncionarios(Array.isArray(json?.funcionarios) ? json.funcionarios : []);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setIdFuncionario("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir responsabilidade</DialogTitle>
          <DialogDescription>
            Reatribua o lead para outro colaborador sem sair do chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Atual</div>
            <div className="mt-1 font-medium text-[var(--text-primary)]">{leadAtual ?? "Sem responsável"}</div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Novo responsável</label>
            <Select value={idFuncionario} onValueChange={setIdFuncionario} disabled={carregando || salvando}>
              <SelectTrigger>
                <SelectValue placeholder={carregando ? "Carregando colaboradores..." : "Selecione um colaborador"} />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((funcionario) => (
                  <SelectItem key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            disabled={!leadId || !idFuncionario || salvando}
            onClick={async () => {
              if (!leadId || !idFuncionario) return;
              setSalvando(true);
              try {
                await onSubmit({ idLead: leadId, idFuncionario });
                onOpenChange(false);
              } finally {
                setSalvando(false);
              }
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type InfoCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
};

function InfoCard({ icon, label, value, description }: InfoCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        <span className="text-[var(--brand)]">{icon}</span>
        {label}
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-[var(--text-primary)]">{value}</div>
      <div className="mt-1 text-[11px] text-[var(--text-secondary)]">{description}</div>
    </div>
  );
}

type OrphanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  telefone: string;
  nomeInicial: string;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  onSubmit: (params: {
    telefone: string;
    nome?: string;
    id_pdv?: string;
    id_funcionario?: string;
    id_estagio?: string;
  }) => void;
};

function OrphanDialog({
  open,
  onOpenChange,
  title,
  description,
  telefone,
  nomeInicial,
  perfil,
  onSubmit,
}: OrphanDialogProps) {
  const [nome, setNome] = useState(nomeInicial);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Telefone</label>
            <input
              type="text"
              value={formatarTelefoneChat(telefone)}
              disabled
              className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm text-[var(--text-tertiary)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Nome (opcional)</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do contato"
              className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>

          <p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-xs text-[var(--text-secondary)]">
            {perfil === "COLABORADOR"
              ? "O lead será vinculado automaticamente a você."
              : perfil === "GERENTE"
                ? "O responsável será escolhido dentro do seu PDV após o cadastro."
                : "Você poderá complementar PDV e responsável na próxima etapa."}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                telefone,
                nome: nome.trim() || undefined,
              })
            }
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
