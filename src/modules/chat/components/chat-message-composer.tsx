"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ArrowLeft, CalendarClock, ChevronDown, Clock3, FileText, ImagePlus, Loader2, Paperclip, RefreshCw, Send, Smile, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { listarAtalhosChat, type ChatShortcut } from "@/lib/api/chat-shortcuts";
import { renderizarTemplateWhatsapp, type ContextoTemplateWhatsapp } from "@/lib/whatsapp-template";
import type { MensagemAgendada } from "@/lib/api/whatsapp.chat";
import { cn } from "@/lib/utils";
import {
  filtrarOrdenarAtalhos,
  normalizarMapaUsosAtalho,
  obterQueryAtalho,
  registrarUsoRecenteAtalho,
  resolverAcaoAtalhoTeclado,
  resolverAcaoSlashMenuRaizTeclado,
} from "@/modules/chat/shortcuts-composer";
import type { FollowUpConversa, FollowUpTemplate } from "@/lib/api/chat-follow-up";
import { obterPlaceholderComposerChat } from "../chat-ux";

type ChatContextInfo = {
  telefone: string;
  pushName: string | null;
  canal: "whatsapp" | "instagram";
  leadMatch: {
    id: string;
    nome: string;
    id_estagio: string;
    id_negocio: string | null;
    nome_estagio: string | null;
    nome_funcionario: string | null;
    nome_pdv: string | null;
    negocio: { titulo: string } | null;
  } | null;
};

export type ChatMessageComposerFollowUpContext = {
  followUp: FollowUpConversa | null;
  templates: FollowUpTemplate[];
  templateSelecionado: string;
  salvandoFollowUp: boolean;
  carregandoFollowUp: boolean;
  atualizadoHa: string;
  statusUi: { variant: "success" | "secondary"; label: string };
  tempoAteProximoDisparo: string | null;
  possuiTemplatesAtivos: boolean;
  podeAtivarFollowUp: boolean;
  onTemplateSelecionadoChange: (value: string) => void;
  onAtualizarContexto: () => void;
  onAtivarCadencia: () => void;
  onPausar: () => void;
  onRetomar: () => void;
  onEncerrar: () => void;
  onReativar: () => void;
} | null;

function ComposerToggle({ active, label, icon, onClick, expanded }: { active?: boolean; label: string; icon: ReactNode; onClick: () => void; expanded?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors",
        active
          ? "border-[color:rgba(139,92,246,0.24)] bg-[var(--brand-soft)] text-[var(--brand)]"
          : "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
      )}
    >
      {icon}
      {label}
      {typeof expanded === "boolean" ? <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} /> : null}
    </button>
  );
}

type ChatMessageComposerProps = {
  instanceName: string;
  remoteJid: string;
  enviando: boolean;
  chatContext?: ChatContextInfo;
  followUpContext?: ChatMessageComposerFollowUpContext;
  agendadas: MensagemAgendada[];
  sendMessage: (conteudo: string) => Promise<void>;
  sendMedia: (arquivo: File, caption?: string) => Promise<void>;
  scheduleMessage: (conteudo: string, agendadoParaIso: string, arquivo?: File | null) => Promise<unknown>;
  cancelScheduledMessage: (id: string) => Promise<void>;
  recarregarAgendadas: () => Promise<void>;
};

export function ChatMessageComposer({
  instanceName,
  remoteJid,
  enviando,
  chatContext,
  followUpContext,
  agendadas,
  sendMessage,
  sendMedia,
  scheduleMessage,
  cancelScheduledMessage,
  recarregarAgendadas,
}: ChatMessageComposerProps) {
  const [texto, setTexto] = useState("");
  const [agendar, setAgendar] = useState(false);
  const [agendadoPara, setAgendadoPara] = useState("");
  const [agendadasAbertas, setAgendadasAbertas] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [atalhos, setAtalhos] = useState<ChatShortcut[]>([]);
  const [ultimosUsosAtalhos, setUltimosUsosAtalhos] = useState<Record<string, number>>({});
  const [menuSlashAberto, setMenuSlashAberto] = useState(false);
  const [menuSlashNivel, setMenuSlashNivel] = useState<"raiz" | "atalhos" | "follow-up" | "fechado">("fechado");
  const [indiceMenuRaizAtivo, setIndiceMenuRaizAtivo] = useState(0);
  const [indiceAtalhoAtivo, setIndiceAtalhoAtivo] = useState(0);
  const [menuFechadoManualParaTexto, setMenuFechadoManualParaTexto] = useState<string | null>(null);
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);
  const { addToast } = useToast();

  const queryAtalho = obterQueryAtalho(texto);
  const chaveRecenciaAtalhos = useMemo(() => `chat.shortcuts.recentes:${chatContext?.leadMatch?.id || remoteJid}`, [chatContext?.leadMatch?.id, remoteJid]);

  const atalhosFiltrados = useMemo(() => filtrarOrdenarAtalhos(atalhos, queryAtalho, ultimosUsosAtalhos), [atalhos, queryAtalho, ultimosUsosAtalhos]);
  const followUpOperacional = chatContext?.canal === "whatsapp";
  const opcoesMenuRaiz = ["atalhos", "follow-up"] as const;
  const placeholderTexto = obterPlaceholderComposerChat({
    agendar,
    canal: chatContext?.canal ?? "whatsapp",
    semMatch: !chatContext?.leadMatch,
    followUpStatus: (followUpContext?.followUp?.status as "ATIVO" | "PAUSADO" | "ENCERRADO" | null | undefined) ?? null,
  });
  const resumoFollowUp = useMemo(() => {
    if (!followUpContext?.followUp) return null;
    if (followUpContext.followUp.status === "ATIVO") {
      return {
        tone: "success" as const,
        label: followUpContext.tempoAteProximoDisparo
          ? `Cadência ativa · ${followUpContext.tempoAteProximoDisparo}`
          : "Cadência ativa",
      };
    }

    if (followUpContext.followUp.status === "PAUSADO") {
      return { tone: "warning" as const, label: "Cadência pausada" };
    }

    if (followUpContext.followUp.status === "ENCERRADO") {
      return { tone: "secondary" as const, label: "Cadência encerrada" };
    }

    return null;
  }, [followUpContext]);
  const ajudaComposer = resumoFollowUp?.label ?? "Digite / para atalhos";

  function abrirSeletorArquivo() {
    inputArquivoRef.current?.click();
  }

  function montarContextoVariaveis(): ContextoTemplateWhatsapp {
    return {
      lead_nome: chatContext?.leadMatch?.nome || chatContext?.pushName || "",
      lead_telefone: chatContext?.telefone || "",
      lead_id: chatContext?.leadMatch?.id || "",
      estagio_nome: chatContext?.leadMatch?.nome_estagio || "",
      negocio_titulo: chatContext?.leadMatch?.negocio?.titulo || "",
      nome_funcionario: chatContext?.leadMatch?.nome_funcionario || "",
      nome_pdv: chatContext?.leadMatch?.nome_pdv || "",
      canal: chatContext?.canal || "",
    };
  }

  function aplicarAtalho(atalho: ChatShortcut) {
    const renderizado = renderizarTemplateWhatsapp(atalho.conteudo, montarContextoVariaveis());
    setTexto(renderizado);
    setUltimosUsosAtalhos((atual) => {
      const atualizadoLimitado = registrarUsoRecenteAtalho(atual, atalho.slug, Date.now());
      try {
        localStorage.setItem(chaveRecenciaAtalhos, JSON.stringify(atualizadoLimitado));
      } catch {
        // ignorar falhas de armazenamento local
      }
      return atualizadoLimitado;
    });
    setMenuSlashAberto(false);
    setMenuSlashNivel("fechado");
    setIndiceAtalhoAtivo(0);
  }

  useEffect(() => {
    if (!agendar && !agendadasAbertas) return;
    void recarregarAgendadas();
  }, [agendar, agendadasAbertas, recarregarAgendadas]);

  useEffect(() => {
    let mounted = true;
    void listarAtalhosChat().then((resultado) => {
      if (!mounted || !resultado.ok) return;
      setAtalhos(resultado.dados.atalhos);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(chaveRecenciaAtalhos);
      if (!salvo) {
        setUltimosUsosAtalhos({});
        return;
      }

      const parsed = JSON.parse(salvo) as unknown;
      setUltimosUsosAtalhos(normalizarMapaUsosAtalho(parsed));
    } catch {
      setUltimosUsosAtalhos({});
    }
  }, [chaveRecenciaAtalhos]);

  useEffect(() => {
    if (!texto.startsWith("/") || texto.includes(" ")) {
      setMenuSlashAberto(false);
      setMenuSlashNivel("fechado");
      setMenuFechadoManualParaTexto(null);
      return;
    }

    if (menuFechadoManualParaTexto === texto) return;

    setMenuSlashAberto(true);
    if (texto === "/") {
      if (menuSlashNivel !== "follow-up") setMenuSlashNivel("raiz");
      setIndiceMenuRaizAtivo(0);
      return;
    }

    if (menuSlashNivel !== "follow-up") {
      setMenuSlashNivel("atalhos");
      setIndiceAtalhoAtivo(0);
    }
  }, [menuFechadoManualParaTexto, menuSlashNivel, texto]);

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if ((!texto.trim() && !arquivoSelecionado) || enviando) return;
    const conteudo = texto;
    setTexto("");

    try {
      if (agendar) {
        if (!agendadoPara) throw new Error("Selecione data e hora para agendar.");
        await scheduleMessage(conteudo, new Date(agendadoPara).toISOString(), arquivoSelecionado ?? undefined);
        setAgendar(false);
        setAgendadoPara("");
        setArquivoSelecionado(null);
        addToast({ type: "success", title: "Mensagem agendada", description: "A mensagem será enviada no horário definido." });
      } else if (arquivoSelecionado) {
        await sendMedia(arquivoSelecionado, conteudo.trim() || undefined);
        setArquivoSelecionado(null);
      } else {
        await sendMessage(conteudo);
      }
    } catch (err) {
      setTexto(conteudo);
      const msgErro = err instanceof Error ? err.message : "Nao foi possivel enviar a mensagem agora.";
      addToast({ type: "error", title: "Erro ao enviar mensagem", description: msgErro });
    }
  };

  const handleArquivoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    setArquivoSelecionado(arquivo);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (menuSlashNivel === "raiz") {
      const acao = resolverAcaoSlashMenuRaizTeclado({
        menuAberto: menuSlashAberto,
        quantidadeOpcoes: opcoesMenuRaiz.length,
        indiceAtual: indiceMenuRaizAtivo,
        input: { key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey },
      });

      if (acao.tipo === "navegar") {
        event.preventDefault();
        setIndiceMenuRaizAtivo(acao.indice);
        return;
      }

      if (acao.tipo === "selecionar") {
        event.preventDefault();
        const selecionado = opcoesMenuRaiz[indiceMenuRaizAtivo] ?? opcoesMenuRaiz[0];
        if (selecionado === "atalhos") {
          setMenuSlashNivel("atalhos");
          setMenuSlashAberto(true);
          setIndiceAtalhoAtivo(0);
        } else {
          setMenuSlashNivel("follow-up");
          setMenuSlashAberto(true);
        }
        return;
      }

      if (acao.tipo === "fechar") {
        event.preventDefault();
        setMenuSlashAberto(false);
        setMenuSlashNivel("fechado");
        setMenuFechadoManualParaTexto(texto);
      }
      return;
    }

    if (menuSlashNivel === "atalhos") {
      if (event.key === "Escape") {
        event.preventDefault();
        if (texto === "/") {
          setMenuSlashNivel("raiz");
          setIndiceMenuRaizAtivo(0);
        } else {
          setMenuSlashAberto(false);
          setMenuSlashNivel("fechado");
          setMenuFechadoManualParaTexto(texto);
        }
        return;
      }

      const acao = resolverAcaoAtalhoTeclado({
        atalhosAbertos: menuSlashAberto,
        quantidadeAtalhos: atalhosFiltrados.length,
        indiceAtual: indiceAtalhoAtivo,
        input: { key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey },
      });

      if (acao.tipo === "navegar") {
        event.preventDefault();
        setIndiceAtalhoAtivo(acao.indice);
        return;
      }

      if (acao.tipo === "aplicar") {
        event.preventDefault();
        const alvo = atalhosFiltrados[indiceAtalhoAtivo] ?? atalhosFiltrados[0];
        if (alvo) aplicarAtalho(alvo);
        return;
      }

      if (acao.tipo === "enviar") {
        event.preventDefault();
        void handleSubmit();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (texto === "/") {
          setMenuSlashNivel("raiz");
          setIndiceMenuRaizAtivo(0);
        } else {
          setMenuSlashAberto(false);
          setMenuSlashNivel("fechado");
          setMenuFechadoManualParaTexto(texto);
        }
      }
      return;
    }

    if (menuSlashNivel === "follow-up") {
      if (event.key === "Escape") {
        event.preventDefault();
        if (texto === "/") {
          setMenuSlashNivel("raiz");
          setIndiceMenuRaizAtivo(0);
        } else {
          setMenuSlashAberto(false);
          setMenuSlashNivel("fechado");
          setMenuFechadoManualParaTexto(texto);
        }
      }
      return;
    }

    const acao = resolverAcaoAtalhoTeclado({
      atalhosAbertos: false,
      quantidadeAtalhos: 0,
      indiceAtual: 0,
      input: { key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey },
    });

    if (acao.tipo === "enviar") {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-[var(--border-subtle)] bg-[var(--surface-soft)] px-2 py-2 md:px-3">
      <div className="mx-auto w-full max-w-5xl rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border-subtle)] px-2 py-1.5">
          <input ref={inputArquivoRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.zip,.webp" onChange={handleArquivoChange} className="hidden" />
          <button type="button" onClick={abrirSeletorArquivo} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)] px-3 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]" aria-label="Anexar arquivo">
            <Paperclip className="h-3.5 w-3.5" />Anexar
          </button>
          <ComposerToggle active={agendar} label={agendar ? "Agendando" : "Agendar"} icon={<CalendarClock className="h-3.5 w-3.5" />} onClick={() => setAgendar((current) => !current)} />
          {agendadas.length > 0 ? <ComposerToggle active={agendadasAbertas} label={`Agendadas ${agendadas.length}`} icon={<Clock3 className="h-3.5 w-3.5" />} onClick={() => setAgendadasAbertas((current) => !current)} expanded={agendadasAbertas} /> : null}
          {agendar ? <input type="datetime-local" value={agendadoPara} onChange={(e) => setAgendadoPara(e.target.value)} className="h-9 rounded-xl border border-[var(--border-subtle)] bg-transparent px-3 text-[11px] text-[var(--text-primary)]" /> : null}
          <div className="ml-auto hidden text-[10px] text-[var(--text-tertiary)] md:block">{ajudaComposer}</div>
        </div>

        {arquivoSelecionado ? (
          <div className="border-b border-[var(--border-subtle)] px-2.5 py-2.5">
            <div className="flex items-center gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-2">
              {arquivoSelecionado.type === "image/webp" || arquivoSelecionado.name.toLowerCase().endsWith(".webp") ? <Smile className="h-4 w-4 text-[var(--brand)]" /> : arquivoSelecionado.type.startsWith("image/") ? <ImagePlus className="h-4 w-4 text-[var(--brand)]" /> : <FileText className="h-4 w-4 text-[var(--brand)]" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-[var(--text-primary)]">{arquivoSelecionado.name}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{arquivoSelecionado.type === "image/webp" || arquivoSelecionado.name.toLowerCase().endsWith(".webp") ? "Sticker" : arquivoSelecionado.type.startsWith("image/") ? "Imagem" : "Documento"}</p>
              </div>
              <button type="button" onClick={() => setArquivoSelecionado(null)} className="rounded-full border border-[var(--border-subtle)] p-1 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]" aria-label="Remover anexo">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        {agendadasAbertas ? (
          <div className="border-b border-[var(--border-subtle)] px-2.5 py-2.5 text-xs text-[var(--text-secondary)]">
            <div className="space-y-2">
              {agendadas.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-[var(--text-primary)]">
                      {item.tipo === "text"
                        ? item.conteudo
                        : item.midiaNomeArquivo ?? (item.tipo === "sticker" ? "Sticker" : item.tipo === "image" ? "Imagem" : "Documento")}
                    </div>
                    <div>{new Date(item.agendadoPara).toLocaleString("pt-BR")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--brand)]/20 px-2 py-1 text-[10px] text-[var(--brand)]">{item.status}</span>
                    {item.status === "PENDENTE" ? (
                      <button
                        type="button"
                        onClick={() => {
                          void cancelScheduledMessage(item.id).catch((err) => {
                            addToast({ type: "error", title: "Erro ao cancelar agendamento", description: err instanceof Error ? err.message : "Tente novamente." });
                          });
                        }}
                        className="rounded-full border border-[var(--border-subtle)] p-1 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
                        aria-label="Cancelar mensagem agendada"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="relative flex items-end gap-2 px-2 py-1.5">
          <textarea
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={enviando || !instanceName || !remoteJid}
            placeholder={placeholderTexto}
            rows={1}
            className="max-h-28 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
          />

          {menuSlashAberto ? (
            <div className="absolute bottom-[calc(100%+0.5rem)] left-2.5 right-16 z-20 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1.5 shadow-[var(--shadow-md)]">
              {menuSlashNivel === "raiz" ? (
                <div className="space-y-1">
                  <button type="button" onClick={() => { setMenuSlashNivel("atalhos"); setIndiceAtalhoAtivo(0); }} className={cn("w-full rounded-xl px-3 py-2 text-left text-sm transition-colors", indiceMenuRaizAtivo === 0 ? "bg-[var(--brand-soft)] text-[var(--text-primary)]" : "text-[var(--text-primary)] hover:bg-[var(--surface-soft)]")}>Acoes rapidas</button>
                  <button type="button" onClick={() => setMenuSlashNivel("follow-up")} className={cn("w-full rounded-xl px-3 py-2 text-left text-sm transition-colors", indiceMenuRaizAtivo === 1 ? "bg-[var(--brand-soft)] text-[var(--text-primary)]" : "text-[var(--text-primary)] hover:bg-[var(--surface-soft)]")}>Cadencia de follow-up</button>
                </div>
              ) : null}

              {menuSlashNivel === "atalhos" ? (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2 px-2 text-[10px] text-[var(--text-tertiary)]">
                    <button type="button" onClick={() => { setMenuSlashNivel("raiz"); setIndiceMenuRaizAtivo(0); }} className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                      <ArrowLeft className="h-3 w-3" /> Voltar
                    </button>
                    <span>{queryAtalho ? `/${queryAtalho}` : "/"}</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {atalhosFiltrados.length > 0 ? (
                      atalhosFiltrados.map((atalho, index) => (
                        <button
                          key={atalho.id}
                          type="button"
                          onClick={() => aplicarAtalho(atalho)}
                          className={cn(
                            "flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left transition-colors",
                            indiceAtalhoAtivo === index ? "bg-[var(--brand-soft)] text-[var(--text-primary)]" : "hover:bg-[var(--surface-soft)]",
                          )}
                        >
                          <span className="mt-0.5 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--brand)]">/{atalho.slug}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-[12px] font-medium text-[var(--text-primary)]">{atalho.nome}</span>
                            <span className="block truncate text-[11px] text-[var(--text-secondary)]">{atalho.conteudo}</span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-2 py-3 text-xs text-[var(--text-secondary)]">Nenhum atalho encontrado.</div>
                    )}
                  </div>
                </div>
              ) : null}

              {menuSlashNivel === "follow-up" ? (
                <div className="space-y-2 rounded-xl border border-[var(--border-subtle)] p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium text-[var(--text-primary)]">Cadencia de follow-ups</div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">{followUpContext?.atualizadoHa ?? "sem atualizacao"}</div>
                    </div>
                    <Badge variant={followUpContext?.statusUi.variant ?? "secondary"} size="sm" dot>{followUpContext?.statusUi.label ?? (followUpOperacional ? "Carregando" : "Indisponivel")}</Badge>
                  </div>

                  {!followUpOperacional ? (
                    <div className="rounded-xl border border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-2 text-[11px] text-[var(--text-primary)]">Disponivel apenas para conversas WhatsApp.</div>
                  ) : followUpContext ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={followUpContext.onAtualizarContexto} className="h-8" disabled={followUpContext.carregandoFollowUp}>
                          <RefreshCw className={cn("mr-1 h-3.5 w-3.5", followUpContext.carregandoFollowUp && "animate-spin")} />Atualizar
                        </Button>
                        {followUpContext.followUp?.status === "ATIVO" ? <Button type="button" size="sm" onClick={followUpContext.onPausar} className="h-8" disabled={followUpContext.salvandoFollowUp || followUpContext.carregandoFollowUp}>Pausar</Button> : null}
                      </div>

                      {!followUpContext.followUp ? (
                        <div className="space-y-2">
                          <Select value={followUpContext.templateSelecionado} onValueChange={followUpContext.onTemplateSelecionadoChange}>
                            <SelectTrigger className="h-8" disabled={followUpContext.salvandoFollowUp || followUpContext.carregandoFollowUp}>
                              <SelectValue placeholder="Selecione uma cadencia" />
                            </SelectTrigger>
                            <SelectContent>
                              {followUpContext.templates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>{template.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!followUpContext.possuiTemplatesAtivos ? <div className="rounded-xl border border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-2 text-[11px] text-[var(--text-primary)]">Nenhuma cadencia ativa encontrada.</div> : null}
                          <Button type="button" size="sm" disabled={!followUpContext.podeAtivarFollowUp || !followUpContext.templateSelecionado || followUpContext.salvandoFollowUp} onClick={followUpContext.onAtivarCadencia} className="h-8">Ativar cadencia</Button>
                        </div>
                      ) : (
                        <div className="space-y-2 text-[11px] text-[var(--text-secondary)]">
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2"><span>Cadencia</span><span className="truncate font-medium text-[var(--text-primary)]">{followUpContext.followUp.template.nome}</span></div>
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2"><span>Etapa atual</span><span className="font-medium text-[var(--text-primary)]">Mensagem {Math.max(1, followUpContext.followUp.etapaAtual)}</span></div>
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2"><span>Ciclo</span><span className="font-medium text-[var(--text-primary)]">{followUpContext.followUp.cicloAtual}</span></div>
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2"><span>Proximo disparo</span><span className="text-right font-medium text-[var(--text-primary)]">{followUpContext.followUp.proximoDisparoEm ? new Date(followUpContext.followUp.proximoDisparoEm).toLocaleString("pt-BR") : "Sem agendamento"}{followUpContext.tempoAteProximoDisparo ? <span className="block text-[10px] text-[var(--text-secondary)]">{followUpContext.tempoAteProximoDisparo}</span> : null}</span></div>
                          {followUpContext.followUp.ultimaRespostaEm ? <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2"><span>Ultima resposta</span><span className="font-medium text-[var(--text-primary)]">{new Date(followUpContext.followUp.ultimaRespostaEm).toLocaleString("pt-BR")}</span></div> : null}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {followUpContext.followUp.status === "PAUSADO" ? <Button variant="outline" size="sm" disabled={followUpContext.salvandoFollowUp || followUpContext.carregandoFollowUp} onClick={followUpContext.onRetomar}>Retomar</Button> : null}
                            {followUpContext.followUp.status !== "ENCERRADO" ? <Button variant="ghost" size="sm" disabled={followUpContext.salvandoFollowUp || followUpContext.carregandoFollowUp} onClick={followUpContext.onEncerrar}>Encerrar</Button> : null}
                            {followUpContext.followUp.status === "ENCERRADO" ? <Button variant="outline" size="sm" disabled={followUpContext.salvandoFollowUp || followUpContext.carregandoFollowUp} onClick={followUpContext.onReativar}>Reativar cadencia</Button> : null}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">Carregando contexto de follow-up...</div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <Button type="submit" size="icon" disabled={enviando || (!texto.trim() && !arquivoSelecionado) || (agendar && !agendadoPara)} className="h-9 w-9 rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]">
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </form>
  );
}
