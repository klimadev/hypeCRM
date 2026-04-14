"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  Layers3,
  Megaphone,
  MessageCircle,
  Phone,
  UserPlus,
  UserRound,
  PanelRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChatMessagesPanel } from "./chat-messages-panel";
import { ChatInfoCard } from "./chat-info-card";
import { ChatOrphanDialog } from "./chat-orphan-dialog";
import { ChatTransferLeadDialog } from "./chat-transfer-lead-dialog";
import { ChatFollowUpCard } from "./chat-follow-up-card";
import type { ChatUnificado, OrphanCriarNegocioParams } from "../types";
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
  onCriarNegocio: (params: OrphanCriarNegocioParams) => Promise<void>;
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
              <ChatInfoCard icon={<Layers3 className="h-4 w-4" />} label="Estágio" value={chat.leadMatch?.nome_estagio ?? "Sem estágio"} description="Fase operacional atual" />
              <ChatInfoCard icon={<UserRound className="h-4 w-4" />} label="Responsável" value={chat.leadMatch?.nome_funcionario ?? "Não atribuído"} description="Pessoa que conduz o lead" />
              <ChatInfoCard icon={<Building2 className="h-4 w-4" />} label="PDV" value={chat.leadMatch?.nome_pdv ?? "Sem PDV"} description={chat.leadMatch?.empresa_origem ?? "Origem operacional do lead"} />
              <ChatInfoCard icon={<Megaphone className="h-4 w-4" />} label="Origem" value={origemLead?.label ?? "Não informada"} description={chat.leadMatch?.fonte ?? "Sem fonte complementar"} />
              <ChatInfoCard
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

            <ChatFollowUpCard
              chat={chat}
              followUp={followUp}
              templates={templates}
              templateSelecionadoEfetivo={templateSelecionadoEfetivo}
              salvandoFollowUp={salvandoFollowUp}
              carregandoFollowUp={carregandoFollowUp}
              atualizadoHa={atualizadoHa}
              statusUi={statusUi}
              tempoAteProximoDisparo={tempoAteProximoDisparo}
              possuiTemplatesAtivos={possuiTemplatesAtivos}
              podeAtivarFollowUp={podeAtivarFollowUp}
              onTemplateSelecionadoChange={setTemplateSelecionado}
              onAtualizarContexto={() => {
                void carregarContextoFollowUp(true);
              }}
              onAtivarCadencia={async () => {
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
              onPausar={() => {
                void executarAcaoFollowUp("PAUSAR");
              }}
              onRetomar={() => {
                void executarAcaoFollowUp("RETOMAR");
              }}
              onEncerrar={() => {
                void executarAcaoFollowUp("ENCERRAR");
              }}
              onReativar={async () => {
                if (!chat.leadMatch || !followUp) return;
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
            />
          </div>
        </SheetContent>
      </Sheet>

      <ChatOrphanDialog
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

      <ChatOrphanDialog
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
          void onCriarNegocio({
            ...params,
            id_lead: chat.leadMatch?.id,
          });
          setDialogOpen(null);
        }}
      />

      <ChatTransferLeadDialog
        open={transferirAberto}
        onOpenChange={setTransferirAberto}
        leadId={chat.leadMatch?.id ?? null}
        leadAtual={chat.leadMatch?.nome_funcionario ?? null}
        onSubmit={onTransferirLead}
      />
    </>
  );
}
