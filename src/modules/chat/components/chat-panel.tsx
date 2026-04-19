"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Briefcase, CheckCircle2, MessageCircle, UserPlus, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ChatMessagesPanel } from "./chat-messages-panel";
import { ChatOrphanDialog } from "./chat-orphan-dialog";
import { ChatTransferLeadDialog } from "./chat-transfer-lead-dialog";
import type { ChatUnificado, OrphanCriarNegocioParams } from "../types";
import { formatarTelefoneChat, obterNomeChat } from "../helpers";
import {
  acionarConversaFollowUp,
  ativarConversaFollowUp,
  listarTemplatesFollowUp,
  obterConversaFollowUp,
  type FollowUpConversa,
  type FollowUpTemplate,
} from "@/lib/api/chat-follow-up";
import { marcarMensagensComoLidas } from "@/lib/api/whatsapp.chat";
import { buildWhatsappViewedKey, markMessagesAsViewed } from "@/lib/chat-local-view-state";
import { obterAcaoPrimariaChat, obterResumoOperacionalChat } from "../chat-ux";

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
  const [marcandoLido, setMarcandoLido] = useState(false);
  const { addToast } = useToast();

  const nome = obterNomeChat(chat);
  const telefone = formatarTelefoneChat(chat.telefone);
  const resumoOperacional = obterResumoOperacionalChat(chat);
  const podeOperarFollowUp = chat.canal === "whatsapp";
  const statusUi = obterApresentacaoStatusFollowUp(followUp);
  const possuiTemplatesAtivos = templates.length > 0;
  const podeAtivarFollowUp = !followUp && possuiTemplatesAtivos;
  const templateSelecionadoEfetivo = templateSelecionado || templates[0]?.id || "";
  const tempoAteProximoDisparo = formatarTempoAteDisparo(followUp?.proximoDisparoEm ?? null);
  const atualizadoHa = formatarTempoRelativoCurto(ultimaAtualizacaoFollowUp);
  const acaoPrimaria = obterAcaoPrimariaChat(chat);
  const detalhesHeader = [
    telefone,
    chat.canal === "instagram" ? "Instagram" : null,
    resumoOperacional,
    chat.unreadCount > 0 ? `${chat.unreadCount} não lida(s)` : null,
  ]
    .filter((item): item is string => Boolean(item))
    .join(" · ");

  useEffect(() => {
    setFollowUp(null);
    setTemplates([]);
    setTemplateSelecionado("");
    setUltimaAtualizacaoFollowUp(null);
    setCarregandoFollowUp(false);
    setSalvandoFollowUp(false);
  }, [chat.instanceName, chat.remoteJid, chat.canal, chat.leadMatch?.id, podeOperarFollowUp]);

  const handleMarkAsRead = useCallback(async () => {
    if (chat.canal !== "whatsapp" || chat.unreadCount <= 0 || marcandoLido) return;
    setMarcandoLido(true);
    try {
      const resultado = await marcarMensagensComoLidas(chat.instanceName, chat.remoteJid);
      if (resultado.ok) {
        const viewedKey = buildWhatsappViewedKey(chat.instanceName, chat.remoteJid);
        markMessagesAsViewed(viewedKey, []);
        addToast({ type: "success", title: "Mensagens marcadas como lidas" });
      } else {
        addToast({ type: "error", title: "Erro ao marcar como lido", description: resultado.erro });
      }
    } finally {
      setMarcandoLido(false);
    }
  }, [addToast, chat.canal, chat.instanceName, chat.remoteJid, chat.unreadCount, marcandoLido]);

  const handlePrimaryAction = useCallback(() => {
    if (acaoPrimaria.tipo === "registrar_lead") {
      setDialogOpen("lead");
      return;
    }

    if (acaoPrimaria.tipo === "marcar_lido") {
      void handleMarkAsRead();
      return;
    }

    if (acaoPrimaria.tipo === "criar_negocio") {
      setDialogOpen("negocio");
      return;
    }

    setTransferirAberto(true);
  }, [acaoPrimaria.tipo, handleMarkAsRead]);

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
        <header className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-2 md:px-4">
          <div className="flex items-center gap-2.5">
            {onVoltar ? (
              <button type="button" onClick={onVoltar} className="rounded-xl p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)] md:hidden">
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-primary)]">
              {chat.semMatch ? <MessageCircle className="h-4 w-4" /> : nome.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-[var(--text-primary)] md:text-[15px]">{nome}</p>
                {chat.unreadCount > 0 ? <span className="text-[11px] font-medium text-[var(--success)]">{chat.unreadCount}</span> : null}
              </div>

              <p className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">{detalhesHeader}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button size="sm" className="h-8 gap-1.5 rounded-full px-3 text-[11px]" onClick={handlePrimaryAction} disabled={acaoPrimaria.tipo === "marcar_lido" && marcandoLido}>
                {acaoPrimaria.tipo === "registrar_lead" ? <UserPlus className="h-4 w-4" /> : null}
                {acaoPrimaria.tipo === "marcar_lido" ? <MailOpen className="h-4 w-4" /> : null}
                {acaoPrimaria.tipo === "criar_negocio" ? <Briefcase className="h-4 w-4" /> : null}
                {acaoPrimaria.tipo === "transferir" ? <CheckCircle2 className="h-4 w-4" /> : null}
                <span>{acaoPrimaria.tipo === "marcar_lido" && marcandoLido ? "Marcando..." : acaoPrimaria.label}</span>
              </Button>

              {acaoPrimaria.tipo !== "criar_negocio" ? (
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setDialogOpen("negocio")} title="Criar negócio" aria-label="Criar negócio">
                  <Briefcase className="h-4 w-4" />
                </Button>
              ) : null}

              {chat.leadMatch && acaoPrimaria.tipo !== "transferir" ? (
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setTransferirAberto(true)} title="Transferir" aria-label="Transferir">
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              ) : null}

              {chat.semMatch && acaoPrimaria.tipo !== "registrar_lead" ? (
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setDialogOpen("lead")} title="Registrar lead" aria-label="Registrar lead">
                  <UserPlus className="h-4 w-4" />
                </Button>
              ) : null}

              {chat.canal === "whatsapp" && chat.unreadCount > 0 && acaoPrimaria.tipo !== "marcar_lido" ? (
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handleMarkAsRead} disabled={marcandoLido} title="Marcar como lido" aria-label="Marcar como lido">
                  <MailOpen className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <ChatMessagesPanel
          instanceName={chat.instanceName}
          remoteJid={chat.remoteJid}
          unreadCount={chat.unreadCount}
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
