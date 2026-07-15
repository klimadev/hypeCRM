"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowDown, Check, CheckCheck, Clock3, Download, FileText, Loader2, MessageSquare, Smile, Volume2 } from "lucide-react";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { buscarMediaChatUnificado, type UnifiedChatMessage } from "@/lib/api/whatsapp.chat";
import { formatarDuracaoSegundos } from "../preview";
import { encontrarIndicePrimeiraMensagemNaoLida } from "../chat-ux";

const mediaCache = new Map<string, Promise<{ url: string; seconds: number | null } | null>>();
const inflightRequests = new Map<string, Promise<{ url: string; seconds: number | null } | null>>();

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

function rotuloMidia(kind: string): string {
  return (
    {
      imageMessage: "Imagem",
      videoMessage: "Vídeo",
      audioMessage: "Áudio",
      documentMessage: "Documento",
      stickerMessage: "Sticker",
    } as Record<string, string>
  )[kind] ?? "Mídia";
}

function statusIcon(msg: UnifiedChatMessage) {
  if (msg.error || msg.status === "ERROR") {
    return <span title="Falhou"><AlertCircle className="h-3 w-3 text-[var(--danger)]" /></span>;
  }
  if (msg.optimistic || msg.status === "PENDING") {
    return <span title="Enviando"><Clock3 className="h-3 w-3 text-[var(--text-tertiary)]" /></span>;
  }
  if (msg.status === "READ" || msg.status === "PLAYED") {
    return <span title="Lida"><CheckCheck className="h-3 w-3 text-[var(--brand)]" /></span>;
  }
  if (msg.status === "DELIVERED") {
    return <span title="Entregue"><CheckCheck className="h-3 w-3 text-[var(--text-tertiary)]" /></span>;
  }
  if (msg.status === "DELETED") {
    return <span title="Apagada"><FileText className="h-3 w-3 text-[var(--text-tertiary)]" /></span>;
  }
  return <span title="Enviada"><Check className="h-3 w-3 text-[var(--text-tertiary)]" /></span>;
}

function groupMessagesByDate(msgs: UnifiedChatMessage[]) {
  const groups: Array<{ date: string; timestamp: number; messages: UnifiedChatMessage[] }> = [];
  let currentDate = "";

  for (const msg of msgs) {
    const dateKey = new Date(msg.timestamp * 1000).toDateString();
    if (dateKey !== currentDate) {
      currentDate = dateKey;
      groups.push({ date: dateKey, timestamp: msg.timestamp, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }

  return groups;
}

function MediaPreview({ instanceName, message }: { instanceName: string; message: UnifiedChatMessage }) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(message.mediaUrl ?? null);
  const [seconds, setSeconds] = useState<number | null>(message.seconds ?? null);
  const [loading, setLoading] = useState(Boolean(message.hasMedia && !message.mediaUrl));
  const [erro, setErro] = useState(false);
  const cacheKey = `${instanceName}:${message.id}`;

  useEffect(() => {
    let mounted = true;
    if (!message.hasMedia || message.mediaUrl) {
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setErro(false);

      let fetchPromise = inflightRequests.get(cacheKey);
      if (!fetchPromise) {
        fetchPromise = buscarMediaChatUnificado({ instanceName, messageId: message.id }).then((resultado) => {
          if (resultado.ok) {
            const url = `data:${resultado.dados.media.mimetype};base64,${resultado.dados.media.base64}`;
            const seconds = resultado.dados.media.seconds ?? null;
            mediaCache.set(cacheKey, Promise.resolve({ url, seconds }));
            return { url, seconds };
          }
          return null;
        }).finally(() => {
          inflightRequests.delete(cacheKey);
        });
        inflightRequests.set(cacheKey, fetchPromise);
      }

      const resultado = await fetchPromise;
      if (!mounted) return;
      if (resultado) {
        setMediaUrl(resultado.url);
        setSeconds(resultado.seconds);
      } else {
        setErro(true);
      }
      setLoading(false);
    }, 120);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [instanceName, message.hasMedia, message.id, message.mediaUrl, cacheKey]);

  if (!message.hasMedia) return null;

  if (loading) {
    return (
      <div className={cn("mt-2 flex h-28 w-full items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]")}>
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (erro || !mediaUrl) {
    return (
      <div className="mt-2 flex h-20 w-full items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3">
        <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
        <span className="text-xs text-[var(--text-secondary)]">{rotuloMidia(message.kind)} indisponível</span>
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
    const duracao = formatarDuracaoSegundos(message.seconds ?? seconds);
    return (
      <div className="mt-2 flex w-full min-w-[15rem] max-w-[20rem] flex-col gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Volume2 className="h-4 w-4 text-[var(--brand)]" />
          Áudio{duracao ? ` · ${duracao}` : ""}
        </div>
        <audio controls src={mediaUrl} className="w-full" />
      </div>
    );
  }

  if (message.kind === "stickerMessage") {
    return (
      <div className="mt-2 flex w-full max-w-[14rem] flex-col gap-2 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-2">
        <div className="flex items-center gap-2 px-1 pt-1 text-[10px] text-[var(--text-tertiary)]">
          <Smile className="h-3.5 w-3.5 text-[var(--brand)]" />
          Sticker
        </div>
        <img src={mediaUrl} alt="Sticker" className="max-h-64 w-full rounded-xl object-contain" loading="lazy" />
      </div>
    );
  }

  if (message.kind === "videoMessage") {
    return <video controls className="mt-2 max-h-72 max-w-full rounded-2xl border border-[var(--border-subtle)] bg-black" src={mediaUrl} />;
  }

  if (message.kind === "documentMessage") {
    const fileName = message.text.match(/^\[Arquivo:\s*(.+)\]$/i)?.[1]?.trim() ?? "Documento";
    return (
      <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="flex items-center gap-3 p-3">
          <FileText className="h-5 w-5 shrink-0 text-[var(--brand)]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[var(--text-primary)]">{fileName}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Documento</p>
          </div>
          <a href={mediaUrl} download={fileName} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]" aria-label={`Baixar ${fileName}`}>
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex w-full items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
      <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
      <span className="truncate text-xs text-[var(--text-secondary)]">{rotuloMidia(message.kind)}</span>
    </div>
  );
}

const IMAGE_PLACEHOLDER_REGEX = /^(📷 ?)?(Imagem)$/i;
const VIDEO_PLACEHOLDER_REGEX = /^(🎥 ?)?(Vídeo)$/i;

function textoEGatewayReal(msg: UnifiedChatMessage): boolean {
  if (!msg.text) return false;
  const texto = msg.text.trim();
  if (msg.kind === "imageMessage") return !IMAGE_PLACEHOLDER_REGEX.test(texto);
  if (msg.kind === "videoMessage") return !VIDEO_PLACEHOLDER_REGEX.test(texto);
  return Boolean(msg.text);
}

function MessageBubble({ instanceName, msg }: { instanceName: string; msg: UnifiedChatMessage }) {
  const isFromMe = msg.fromMe;
  const isProtocol = msg.kind === "protocolMessage";
  const hasMediaCaption = msg.kind === "imageMessage" && textoEGatewayReal(msg);
  const hasBodyText =
    Boolean(msg.text) && msg.kind !== "imageMessage" && msg.kind !== "audioMessage" && msg.kind !== "videoMessage" && msg.kind !== "documentMessage" && msg.kind !== "stickerMessage";

  if (isProtocol) return null;

  return (
    <div className={cn("flex px-2.5 py-1 md:px-3", isFromMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[86%] rounded-[20px] px-3 py-2 text-sm shadow-sm sm:max-w-[78%] xl:max-w-[66%]",
          isFromMe
            ? "bg-[color-mix(in_srgb,var(--brand)_18%,var(--surface-elevated))] text-[var(--text-primary)]"
            : "border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)]",
        )}
      >
        {!isFromMe && msg.pushName && msg.pushName !== "Você" ? (
          <p className="mb-1 text-[11px] font-medium text-[var(--brand)]">{msg.pushName}</p>
        ) : null}

        {msg.hasMedia ? <MediaPreview key={`${msg.id}:${msg.mediaUrl ?? ""}:${msg.seconds ?? ""}:${String(msg.hasMedia)}`} instanceName={instanceName} message={msg} /> : null}

        {hasMediaCaption ? (
          <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed mt-2">{msg.text}</p>
        ) : null}

        {hasBodyText ? (
          <p className={cn("whitespace-pre-wrap break-words text-[13px] leading-relaxed", msg.hasMedia ? "mt-2" : "")}>{msg.text}</p>
        ) : null}

        <div className="mt-1.5 flex items-center justify-end gap-2 text-[10px] text-[var(--text-tertiary)]">
          {isFromMe ? statusIcon(msg) : null}
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

function UnreadSeparator({ unreadCount }: { unreadCount: number }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="h-px flex-1 bg-[color-mix(in_srgb,var(--brand)_18%,transparent)]" />
      <span className="rounded-full border border-[color-mix(in_srgb,var(--brand)_24%,transparent)] bg-[var(--brand-soft)] px-3 py-1 text-[10px] font-semibold text-[var(--brand)]">
        {unreadCount} não lida(s)
      </span>
      <div className="h-px flex-1 bg-[color-mix(in_srgb,var(--brand)_18%,transparent)]" />
    </div>
  );
}

type ChatMessageListProps = {
  instanceName: string;
  remoteJid: string;
  messages: UnifiedChatMessage[];
  unreadCount?: number;
  carregando: boolean;
  carregandoMais?: boolean;
  erro: string | null;
  recarregar: () => void;
  carregarMensagensAnteriores?: () => void;
};

export function ChatMessageList({ instanceName, remoteJid, messages, unreadCount = 0, carregando, carregandoMais, erro, recarregar, carregarMensagensAnteriores }: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inicializadoRef = useRef(false);
  const [mostrarVoltarAoPresente, setMostrarVoltarAoPresente] = useState(false);

  function atualizarEstadoRolagem(container: HTMLDivElement) {
    const distanciaDoFim = container.scrollHeight - container.scrollTop - container.clientHeight;
    setMostrarVoltarAoPresente(distanciaDoFim > 240);
  }

  function rolarParaFim(behavior: ScrollBehavior = "smooth") {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container || messages.length === 0) {
      return;
    }

    const distanciaDoFim = container.scrollHeight - container.scrollTop - container.clientHeight;
    const deveAncorarNoFim = container.scrollTop === 0 || distanciaDoFim <= 120;
    if (!deveAncorarNoFim) return;

    rolarParaFim(!inicializadoRef.current ? "auto" : "smooth");
    inicializadoRef.current = true;
    atualizarEstadoRolagem(container);
  }, [messages.length]);

  useEffect(() => {
    inicializadoRef.current = false;
  }, [instanceName, remoteJid]);

  const grouped = useMemo(() => groupMessagesByDate(messages), [messages]);
  const unreadIndex = useMemo(() => encontrarIndicePrimeiraMensagemNaoLida(messages, unreadCount), [messages, unreadCount]);
  const exibirLoadingVazio = carregando && messages.length === 0;
  const exibirErroVazio = erro && messages.length === 0;
  const exibirEstadoVazio = !carregando && !erro && messages.length === 0;

  // Loading incremental quando há mensagens
  const exibirLoadingIncremental = carregando && messages.length > 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      atualizarEstadoRolagem(container);
      if (carregarMensagensAnteriores && container.scrollTop <= 40) {
        carregarMensagensAnteriores();
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [carregarMensagensAnteriores]);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-[var(--surface)]">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto overscroll-contain"
      >
        {carregandoMais ? (
          <div className="flex justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
          </div>
        ) : null}
        {exibirLoadingVazio ? (
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-5">
            {/* Header skeleton */}
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--surface-elevated)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-elevated)]" />
                <div className="h-2 w-32 animate-pulse rounded bg-[var(--surface-elevated)]" />
              </div>
            </div>
            {/* Message skeletons - varied patterns */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className={cn("flex", index % 3 === 0 ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "animate-pulse rounded-xl bg-[var(--surface-elevated)]",
                    index % 3 === 0 ? "h-12 w-32" : index % 3 === 1 ? "h-16 w-48" : "h-10 w-40",
                  )}
                />
              </div>
            ))}
            {/* Timestamp skeleton */}
            <div className="flex justify-center pt-2">
              <div className="h-4 w-20 animate-pulse rounded-full bg-[var(--surface-elevated)]" />
            </div>
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
            <div className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--brand)_8%,var(--surface))]">
                  <MessageSquare className="h-7 w-7 text-[var(--text-tertiary)]" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border-subtle)]">
                  <div className="h-2 w-2 rounded-full bg-[var(--success)]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma mensagem ainda</p>
                <p className="text-xs text-[var(--text-tertiary)] max-w-[200px]">
                  As mensagens desta conversa aparecerão aqui quando houver atividade
                </p>
              </div>
            </div>
          </div>
        ) : exibirLoadingIncremental ? (
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-0 py-3">
            {(() => {
              let indiceGlobal = 0;
              return grouped.map((group) => (
                <div key={group.date}>
                  <MessageDateSeparator timestamp={group.timestamp} />
                  {group.messages.map((msg) => {
                    const elementos = [];
                    if (unreadIndex === indiceGlobal) {
                      elementos.push(<UnreadSeparator key={`unread-${msg.id}`} unreadCount={unreadCount} />);
                    }
                    elementos.push(<MessageBubble key={msg.id} instanceName={instanceName} msg={msg} />);
                    indiceGlobal += 1;
                    return elementos;
                  })}
                </div>
              ));
            })()}
            {/* Loading indicator at bottom */}
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Carregando mais...
              </div>
            </div>
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-0 py-3">
            {(() => {
              let indiceGlobal = 0;
              return grouped.map((group) => (
                <div key={group.date}>
                  <MessageDateSeparator timestamp={group.timestamp} />
                  {group.messages.map((msg) => {
                    const elementos = [];
                    if (unreadIndex === indiceGlobal) {
                      elementos.push(<UnreadSeparator key={`unread-${msg.id}`} unreadCount={unreadCount} />);
                    }
                    elementos.push(<MessageBubble key={msg.id} instanceName={instanceName} msg={msg} />);
                    indiceGlobal += 1;
                    return elementos;
                  })}
                </div>
              ));
            })()}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {mostrarVoltarAoPresente ? (
        <button
          type="button"
          onClick={() => rolarParaFim()}
          className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-[11px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-md)] transition-colors hover:border-[var(--border-strong)]"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          Voltar ao presente
        </button>
      ) : null}
    </div>
  );
}
