"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Loader2, AlertCircle, MessageSquare, Send, FileText, Volume2, CalendarClock, Clock3, X, ChevronDown } from "lucide-react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { listarAtalhosChat, type ChatShortcut } from "@/lib/api/chat-shortcuts";
import { renderizarTemplateWhatsapp, type ContextoTemplateWhatsapp } from "@/lib/whatsapp-template";
import { cn } from "@/lib/utils";
import { buscarMediaChatUnificado, type UnifiedChatMessage } from "@/lib/api/whatsapp.chat";
import {
  filtrarOrdenarAtalhos,
  normalizarMapaUsosAtalho,
  obterQueryAtalho,
  registrarUsoRecenteAtalho,
  resolverAcaoAtalhoTeclado,
} from "@/modules/chat/shortcuts-composer";
import { useChatMessages } from "../hooks/use-chat-messages";

type ChatMessagesPanelProps = {
  instanceName: string;
  remoteJid: string;
  chatContext?: {
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
};

function formatarHora(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatarDataGrupo(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);

  if (date.toDateString() === hoje.toDateString()) return "Hoje";
  if (date.toDateString() === ontem.toDateString()) return "Ontem";

  const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${dias[date.getDay()]}, ${date.getDate()} ${meses[date.getMonth()]} ${date.getFullYear()}`;
}

function getKindIcon(kind: string): string {
  const icons: Record<string, string> = {
    imageMessage: "📷",
    videoMessage: "🎥",
    audioMessage: "🎵",
    documentMessage: "📄",
    stickerMessage: "🎭",
    locationMessage: "📍",
    liveLocationMessage: "📍",
    contactMessage: "👤",
    listMessage: "📋",
    buttonsMessage: "🔘",
    templateMessage: "📄",
    orderMessage: "🛒",
    reactionMessage: "",
  };
  return icons[kind] ?? "";
}

function statusLabel(msg: UnifiedChatMessage) {
  if (msg.error || msg.status === "ERROR") return "Falhou";
  if (msg.optimistic || msg.status === "PENDING") return "Enviando";
  return "Enviado";
}

function MediaPreview({
  instanceName,
  message,
  compact = false,
}: {
  instanceName: string;
  message: UnifiedChatMessage;
  compact?: boolean;
}) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(message.mediaUrl ?? null);
  const [loading, setLoading] = useState(!message.mediaUrl);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!message.hasMedia || message.mediaUrl) {
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setErro(false);
      const resultado = await buscarMediaChatUnificado({ instanceName, messageId: message.id });
      if (!mounted) return;
      if (resultado.ok) {
        setMediaUrl(`data:${resultado.dados.media.mimetype};base64,${resultado.dados.media.base64}`);
      } else {
        setErro(true);
      }
      setLoading(false);
    }, 120);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [instanceName, message.hasMedia, message.id, message.mediaUrl]);

  if (!message.hasMedia) return null;

  if (loading) {
    return (
      <div className={cn("mt-2 flex items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]", compact ? "h-28 w-full" : "h-36 w-56")}>
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (erro || !mediaUrl) {
    const label = message.kind === "audioMessage" ? "Áudio" : message.kind === "videoMessage" ? "Vídeo" : "Mídia";
    return (
      <div className={cn("mt-2 flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3", compact ? "h-20 w-full" : "h-24 w-56")}>
        <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
        <span className="text-xs text-[var(--text-secondary)]">{label} indisponível</span>
      </div>
    );
  }

  if (message.kind === "imageMessage") {
    return (
      <NextImage
        src={mediaUrl}
        alt="Imagem"
        width={480}
        height={320}
        unoptimized
        className="mt-2 max-h-80 max-w-full rounded-2xl object-contain"
      />
    );
  }

  if (message.kind === "audioMessage") {
    return (
      <div className="mt-2 flex w-full min-w-[15rem] max-w-[20rem] flex-col gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Volume2 className="h-4 w-4 text-[var(--brand)]" />
          Áudio
        </div>
        <audio controls src={mediaUrl} className="w-full" />
      </div>
    );
  }

  if (message.kind === "videoMessage") {
    return <video controls className="mt-2 max-h-72 max-w-full rounded-2xl border border-[var(--border-subtle)] bg-black" src={mediaUrl} />;
  }

  return (
    <div className="mt-2 flex w-full items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
      <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
      <span className="truncate text-xs text-[var(--text-secondary)]">Anexo</span>
    </div>
  );
}

function MessageBubble({ instanceName, msg }: { instanceName: string; msg: UnifiedChatMessage }) {
  const isFromMe = msg.fromMe;
  const kindIcon = getKindIcon(msg.kind);
  const isProtocol = msg.kind === "protocolMessage";
  const hasBodyText = Boolean(msg.text) && msg.kind !== "imageMessage" && msg.kind !== "audioMessage" && msg.kind !== "videoMessage";

  if (isProtocol) return null;

  return (
    <div className={cn("flex px-2.5 py-1 md:px-3", isFromMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[86%] rounded-[20px] px-3 py-2 text-sm shadow-sm sm:max-w-[78%] xl:max-w-[66%]",
          isFromMe
            ? "bg-[linear-gradient(180deg,rgba(139,92,246,0.26),rgba(139,92,246,0.16))] text-[var(--text-primary)]"
            : "border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)]",
        )}
      >
        {!isFromMe && msg.pushName && msg.pushName !== "Você" ? (
          <p className="mb-1 text-[11px] font-medium text-[var(--brand)]">{msg.pushName}</p>
        ) : null}

        {msg.hasMedia ? <MediaPreview instanceName={instanceName} message={msg} compact /> : null}

        {hasBodyText ? (
          <p className={cn("whitespace-pre-wrap break-words text-[13px] leading-relaxed", msg.hasMedia ? "mt-2" : "")}>{kindIcon && !msg.hasMedia ? `${kindIcon} ` : ""}{msg.text}</p>
        ) : null}

        {!hasBodyText && kindIcon && !msg.hasMedia ? <p className="text-[13px] leading-relaxed">{kindIcon}</p> : null}

        <div className="mt-1.5 flex items-center justify-end gap-2 text-[10px] text-[var(--text-tertiary)]">
          {isFromMe ? <span>{statusLabel(msg)}</span> : null}
          <span>{formatarHora(msg.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

function MessageDateSeparator({ timestamp }: { timestamp: number }) {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="rounded-full bg-[var(--surface-elevated)] px-3 py-1 text-[10px] font-medium text-[var(--text-tertiary)] shadow-sm">
        {formatarDataGrupo(timestamp)}
      </span>
    </div>
  );
}

function ComposerToggle({
  active,
  label,
  icon,
  onClick,
  expanded,
}: {
  active?: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  expanded?: boolean;
}) {
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

function groupMessagesByDate(msgs: UnifiedChatMessage[]) {
  const groups: Array<{ date: string; timestamp: number; messages: UnifiedChatMessage[] }> = [];
  let currentDate = "";

  for (const msg of msgs) {
    const dateKey = new Date(msg.timestamp * 1000).toDateString();
    if (dateKey !== currentDate) {
      currentDate = dateKey;
      groups.push({
        date: dateKey,
        timestamp: msg.timestamp,
        messages: [msg],
      });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }

  return groups;
}

export function ChatMessagesPanel({ instanceName, remoteJid, chatContext }: ChatMessagesPanelProps) {
  const {
    messages,
    carregando,
    erro,
    enviando,
    sseConectado,
    recarregar,
    sendMessage,
    scheduleMessage,
    cancelScheduledMessage,
    agendadas,
    recarregarAgendadas,
  } = useChatMessages({
    instanceName,
    remoteJid,
  });
  const [texto, setTexto] = useState("");
  const [agendar, setAgendar] = useState(false);
  const [agendadoPara, setAgendadoPara] = useState("");
  const [agendadasAbertas, setAgendadasAbertas] = useState(false);
  const [atalhos, setAtalhos] = useState<ChatShortcut[]>([]);
  const [ultimosUsosAtalhos, setUltimosUsosAtalhos] = useState<Record<string, number>>({});
  const [atalhosAbertos, setAtalhosAbertos] = useState(false);
  const [indiceAtalhoAtivo, setIndiceAtalhoAtivo] = useState(0);
  const { addToast } = useToast();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inicializadoRef = useRef(false);

  const queryAtalho = obterQueryAtalho(texto);
  const chaveRecenciaAtalhos = useMemo(
    () => `chat.shortcuts.recentes:${chatContext?.leadMatch?.id || remoteJid}`,
    [chatContext?.leadMatch?.id, remoteJid],
  );
  const atalhosFiltrados = useMemo(() => {
    return filtrarOrdenarAtalhos(atalhos, queryAtalho, ultimosUsosAtalhos);
  }, [atalhos, queryAtalho, ultimosUsosAtalhos]);

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
    setAtalhosAbertos(false);
    setIndiceAtalhoAtivo(0);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container || messages.length === 0) {
      return;
    }

    const distanciaDoFim = container.scrollHeight - container.scrollTop - container.clientHeight;
    const deveAncorarNoFim = container.scrollTop === 0 || distanciaDoFim <= 120;

    if (!deveAncorarNoFim) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: !inicializadoRef.current ? "auto" : "smooth",
    });
    inicializadoRef.current = true;
  }, [messages.length]);

  useEffect(() => {
    inicializadoRef.current = false;
  }, [instanceName, remoteJid]);

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
      const normalizado = normalizarMapaUsosAtalho(parsed);
      setUltimosUsosAtalhos(normalizado);
    } catch {
      setUltimosUsosAtalhos({});
    }
  }, [chaveRecenciaAtalhos]);

  useEffect(() => {
    if (!texto.startsWith("/") || texto.includes(" ")) {
      setAtalhosAbertos(false);
      setIndiceAtalhoAtivo(0);
      return;
    }

    setAtalhosAbertos(atalhosFiltrados.length > 0);
    setIndiceAtalhoAtivo(0);
  }, [texto, atalhosFiltrados.length]);

  const grouped = groupMessagesByDate(messages);
  const exibirLoadingVazio = carregando && messages.length === 0;
  const exibirErroVazio = erro && messages.length === 0;
  const exibirEstadoVazio = !carregando && !erro && messages.length === 0;

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!texto.trim() || enviando) return;
    const conteudo = texto;
    setTexto("");
    try {
      if (agendar) {
        if (!agendadoPara) throw new Error("Selecione data e hora para agendar.");
        await scheduleMessage(conteudo, new Date(agendadoPara).toISOString());
        setAgendar(false);
        setAgendadoPara("");
        addToast({ type: "success", title: "Mensagem agendada", description: "A mensagem será enviada no horário definido." });
      } else {
        await sendMessage(conteudo);
      }
    } catch (err) {
      setTexto(conteudo);
      const msgErro = err instanceof Error ? err.message : "Nao foi possivel enviar a mensagem agora.";
      addToast({ type: "error", title: "Erro ao enviar mensagem", description: msgErro });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const acao = resolverAcaoAtalhoTeclado({
      atalhosAbertos,
      quantidadeAtalhos: atalhosFiltrados.length,
      indiceAtual: indiceAtalhoAtivo,
      input: {
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      },
    });

    if (acao.tipo === "navegar") {
      event.preventDefault();
      setIndiceAtalhoAtivo(acao.indice);
      return;
    }

    if (acao.tipo === "aplicar") {
      event.preventDefault();
      const alvo = atalhosFiltrados[indiceAtalhoAtivo] ?? atalhosFiltrados[0];
      if (alvo) {
        aplicarAtalho(alvo);
      }
      return;
    }

    if (acao.tipo === "fechar") {
      event.preventDefault();
      setAtalhosAbertos(false);
      return;
    }

    if (acao.tipo === "enviar") {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {!sseConectado ? (
        <div className="flex items-center justify-center gap-2 border-b border-[var(--border-subtle)] bg-amber-500/10 px-4 py-1">
          <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
          <span className="text-[11px] text-amber-400">Reconectando tempo real...</span>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden bg-[var(--surface)]">
        <div
          ref={containerRef}
          className="h-full overflow-y-auto overscroll-contain"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        >
          {exibirLoadingVazio ? (
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-5">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className={cn("flex", index % 3 === 0 ? "justify-end" : "justify-start")}>
                  <div className="h-14 w-[min(22rem,72%)] animate-pulse rounded-[18px] bg-[var(--surface-elevated)]" />
                </div>
              ))}
            </div>
          ) : exibirErroVazio ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 p-6">
                <AlertCircle className="h-8 w-8 text-[var(--danger)]" />
                <p className="text-sm text-[var(--text-secondary)]">{erro}</p>
                <button
                  type="button"
                  onClick={() => recarregar()}
                  className="rounded-lg bg-[var(--brand-soft)] px-4 py-2 text-sm font-medium text-[var(--brand)] transition-colors hover:bg-[var(--brand)]/20"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : exibirEstadoVazio ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 p-6">
                <MessageSquare className="h-10 w-10 text-[var(--text-tertiary)]" />
                <p className="text-sm text-[var(--text-secondary)]">Nenhuma mensagem encontrada</p>
                <p className="text-xs text-[var(--text-tertiary)]">As mensagens aparecerão aqui quando houver atividade</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-0 py-3">
              {grouped.map((group) => (
                <div key={group.date}>
                  <MessageDateSeparator timestamp={group.timestamp} />
                  {group.messages.map((msg) => (
                    <MessageBubble key={msg.id} instanceName={instanceName} msg={msg} />
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(12,12,14,0.94),rgba(12,12,14,1))] px-2.5 py-2.5 md:px-3">
        <div className="mx-auto w-full max-w-5xl rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] px-2.5 py-2">
            <ComposerToggle
              active={agendar}
              label={agendar ? "Agendando" : "Agendar"}
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              onClick={() => setAgendar((current) => !current)}
            />
            {agendadas.length > 0 ? (
              <ComposerToggle
                active={agendadasAbertas}
                label={`Agendadas ${agendadas.length}`}
                icon={<Clock3 className="h-3.5 w-3.5" />}
                onClick={() => setAgendadasAbertas((current) => !current)}
                expanded={agendadasAbertas}
              />
            ) : null}
            {agendar ? (
              <input
                type="datetime-local"
                value={agendadoPara}
                onChange={(e) => setAgendadoPara(e.target.value)}
                className="h-9 rounded-xl border border-[var(--border-subtle)] bg-transparent px-3 text-[11px] text-[var(--text-primary)]"
              />
            ) : null}
            <div className="ml-auto hidden text-[10px] text-[var(--text-tertiary)] md:block">Enter envia, Shift+Enter quebra linha</div>
          </div>

          {agendadasAbertas ? (
            <div className="border-b border-[var(--border-subtle)] px-2.5 py-2.5 text-xs text-[var(--text-secondary)]">
              <div className="space-y-2">
                {agendadas.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-black/10 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-[var(--text-primary)]">{item.conteudo}</div>
                      <div>{new Date(item.agendadoPara).toLocaleString("pt-BR")}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[var(--brand)]/20 px-2 py-1 text-[10px] text-[var(--brand)]">{item.status}</span>
                      {item.status === "PENDENTE" ? (
                        <button
                          type="button"
                          onClick={() => {
                            void cancelScheduledMessage(item.id).catch((err) => {
                              addToast({
                                type: "error",
                                title: "Erro ao cancelar agendamento",
                                description: err instanceof Error ? err.message : "Tente novamente.",
                              });
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

          <div className="relative flex items-end gap-2 px-2.5 py-2">
            <textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={enviando || !instanceName || !remoteJid}
              placeholder={agendar ? "Escreva a mensagem que será enviada depois..." : "Escreva uma mensagem"}
              rows={1}
              className="max-h-28 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
            />
            {atalhosAbertos ? (
              <div className="absolute bottom-[calc(100%+0.5rem)] left-2.5 right-16 z-20 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1.5 shadow-[var(--shadow-md)]">
                <div className="mb-1 px-2 text-[10px] text-[var(--text-tertiary)]">
                  Digite <span className="font-semibold">/</span>, navegue com ↑ ↓ (ou Ctrl/Cmd+J/K) e confirme com Enter/Tab
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {atalhosFiltrados.map((atalho, index) => (
                    <button
                      key={atalho.id}
                      type="button"
                      onClick={() => aplicarAtalho(atalho)}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left transition-colors",
                        indiceAtalhoAtivo === index
                          ? "bg-[var(--brand-soft)] text-[var(--text-primary)]"
                          : "hover:bg-[color:rgba(255,255,255,0.04)]",
                      )}
                    >
                      <span className="mt-0.5 rounded-md border border-[var(--border-subtle)] bg-black/10 px-1.5 py-0.5 font-mono text-[10px] text-[var(--brand)]">
                        /{atalho.slug}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-medium text-[var(--text-primary)]">{atalho.nome}</span>
                        <span className="block truncate text-[11px] text-[var(--text-secondary)]">{atalho.conteudo}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <Button
              type="submit"
              size="icon"
              disabled={enviando || !texto.trim() || (agendar && !agendadoPara)}
              className="h-10 w-10 rounded-[14px] bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
