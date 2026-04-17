"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Briefcase, CheckCircle2, MessageCircle, Phone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ChatMessagesPanel } from "./chat-messages-panel";
import { ChatOrphanDialog } from "./chat-orphan-dialog";
import { ChatTransferLeadDialog } from "./chat-transfer-lead-dialog";
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
  if (!followUp) return { variant: "secondary" as const, label: "Desativado" };
  if (followUp.status === "ATIVO") return { variant: "success" as const, label: "Ativo" };
  if (followUp.status === "PAUSADO") return { variant: "secondary" as const, label: "Pausado" };
  if (followUp.motivoEncerramento === "Cliente respondeu") return { variant: "success" as const, label: "Encerrado (respondeu)" };
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
  return `${partes.join(" ")} ${diferencaMinutos > 0 ? "restantes" : "em atraso"}`;
}

function formatarTempoRelativoCurto(referencia: Date | null) {
  if (!referencia) return "sem atualizacao";
  const deltaSegundos = Math.max(0, Math.floor((Date.now() - referencia.getTime()) / 1000));
  if (deltaSegundos < 10) return "agora";
  if (deltaSegundos < 60) return `${deltaSegundos}s`;
  const deltaMinutos = Math.floor(deltaSegundos / 60);
  if (deltaMinutos < 60) return `${deltaMinutos}min`;
  return `${Math.floor(deltaMinutos / 60)}h`;
}

type ChatPanelProps = {
  chat: ChatUnificado;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  onVoltar?: () => void;
  onRegistrarLead: (params: { telefone: string; nome?: string; id_pdv?: string; id_funcionario?: string }) => Promise<void>;
  onCriarNegocio: (params: OrphanCriarNegocioParams) => Promise<void>;
  onTransferirLead: (params: { idLead: string; idFuncionario: string }) => Promise<void>;
};

export function ChatPanel({ chat, perfil, onVoltar, onRegistrarLead, onCriarNegocio, onTransferirLead }: ChatPanelProps) {
  const [dialogOpen, setDialogOpen] = useState<"lead" | "negocio" | null>(null);
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
  const podeOperarFollowUp = chat.canal === "whatsapp";
  const statusUi = obterApresentacaoStatusFollowUp(followUp);
  const possuiTemplatesAtivos = templates.length > 0;
  const podeAtivarFollowUp = !followUp && possuiTemplatesAtivos;
  const templateSelecionadoEfetivo = templateSelecionado || templates[0]?.id || "";
  const tempoAteProximoDisparo = formatarTempoAteDisparo(followUp?.proximoDisparoEm ?? null);
  const atualizadoHa = formatarTempoRelativoCurto(ultimaAtualizacaoFollowUp);

  useEffect(() => {
    setFollowUp(null);
    setTemplates([]);
    setTemplateSelecionado("");
    setUltimaAtualizacaoFollowUp(null);
    setCarregandoFollowUp(false);
    setSalvandoFollowUp(false);
  }, [chat.instanceName, chat.remoteJid, chat.canal, chat.leadMatch?.id, podeOperarFollowUp]);

  const carregarContextoFollowUp = useCallback(async (mostrarErro = false) => {
    if (!podeOperarFollowUp) return;

    setCarregandoFollowUp(true);
    try {
      const [conversaResult, templatesResult] = await Promise.all([
        obterConversaFollowUp(chat.instanceName, chat.remoteJid),
        listarTemplatesFollowUp(),
      ]);

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
    } finally {
      setCarregandoFollowUp(false);
      setUltimaAtualizacaoFollowUp(new Date());
    }
  }, [addToast, chat.instanceName, chat.remoteJid, podeOperarFollowUp]);

  useEffect(() => {
    if (!podeOperarFollowUp) return;

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
  }, [carregarContextoFollowUp, podeOperarFollowUp]);

  const ativarOuReativarFollowUp = useCallback(async () => {
    if (chat.canal !== "whatsapp") return;

    const templateId = followUp?.template.id ?? templateSelecionadoEfetivo;
    if (!templateId) {
      addToast({ type: "error", title: "Selecione uma cadência", description: "Escolha um template ativo antes de ativar o follow-up." });
      return;
    }

    setSalvandoFollowUp(true);
    try {
      const resultado = await ativarConversaFollowUp({
        instanceName: chat.instanceName,
        remoteJid: chat.remoteJid,
        idLead: chat.leadMatch?.id,
        templateId,
      });

      if (!resultado.ok) {
        addToast({ type: "error", title: "Erro ao ativar follow-up", description: resultado.erro });
        return;
      }

      setFollowUp(resultado.dados.conversa);
      setTemplateSelecionado(resultado.dados.conversa.template.id);
      addToast({ type: "success", title: followUp ? "Follow-up reativado" : "Follow-up ativado" });
      void carregarContextoFollowUp();
    } finally {
      setSalvandoFollowUp(false);
    }
  }, [addToast, chat.canal, chat.instanceName, chat.leadMatch, chat.remoteJid, carregarContextoFollowUp, followUp, templateSelecionadoEfetivo]);

  const executarAcaoFollowUp = useCallback(async (acao: "PAUSAR" | "RETOMAR" | "ENCERRAR") => {
    if (!followUp) return;

    if (acao === "ENCERRAR") {
      const confirmado = window.confirm("Encerrar este follow-up agora? Os proximos disparos serao cancelados.");
      if (!confirmado) return;
    }

    setSalvandoFollowUp(true);
    try {
      const resultado = await acionarConversaFollowUp({ conversaId: followUp.id, acao });
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
    } finally {
      setSalvandoFollowUp(false);
    }
  }, [addToast, carregarContextoFollowUp, followUp]);

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col bg-[var(--surface)]">
        <header className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-2.5 md:px-4">
          <div className="flex flex-wrap items-start gap-2.5 lg:items-center">
            {onVoltar ? (
              <button type="button" onClick={onVoltar} className="rounded-xl p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)] md:hidden">
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--brand)] bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand)]">
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
                <Button variant="outline" size="sm" className="h-9 min-h-9 gap-1.5 rounded-xl px-3 text-[11px]" onClick={() => setDialogOpen("lead")}>
                  <UserPlus className="h-4 w-4" />
                  <span>Registrar lead</span>
                </Button>
              ) : null}
              <Button size="sm" className="h-9 min-h-9 gap-1.5 rounded-xl px-3 text-[11px]" onClick={() => setDialogOpen("negocio")}>
                <Briefcase className="h-4 w-4" />
                <span>Criar negócio</span>
              </Button>
              {chat.leadMatch ? (
                <Button variant="outline" size="sm" className="h-9 min-h-9 gap-1.5 rounded-xl px-3 text-[11px]" onClick={() => setTransferirAberto(true)}>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Transferir</span>
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <ChatMessagesPanel
          instanceName={chat.instanceName}
          remoteJid={chat.remoteJid}
          chatContext={{ telefone: chat.telefone, pushName: chat.pushName, canal: chat.canal, leadMatch: chat.leadMatch }}
          followUpContext={
            podeOperarFollowUp
              ? {
                  followUp,
                  templates,
                  templateSelecionado,
                  salvandoFollowUp,
                  carregandoFollowUp,
                  atualizadoHa,
                  statusUi,
                  tempoAteProximoDisparo,
                  possuiTemplatesAtivos,
                  podeAtivarFollowUp,
                  onTemplateSelecionadoChange: setTemplateSelecionado,
                  onAtualizarContexto: () => void carregarContextoFollowUp(true),
                  onAtivarCadencia: ativarOuReativarFollowUp,
                  onPausar: () => void executarAcaoFollowUp("PAUSAR"),
                  onRetomar: () => void executarAcaoFollowUp("RETOMAR"),
                  onEncerrar: () => void executarAcaoFollowUp("ENCERRAR"),
                  onReativar: ativarOuReativarFollowUp,
                }
              : null
          }
        />
      </div>

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
        tipoAcao="registrar_lead"
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
        tipoAcao="criar_negocio"
        onSubmit={(params) => {
          void onCriarNegocio({ ...params, id_lead: chat.leadMatch?.id });
          setDialogOpen(null);
        }}
      />

      <ChatTransferLeadDialog open={transferirAberto} onOpenChange={setTransferirAberto} leadId={chat.leadMatch?.id ?? null} leadAtual={chat.leadMatch?.nome_funcionario ?? null} onSubmit={onTransferirLead} />
    </>
  );
}
