"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, MessageSquare, Volume2 } from "lucide-react";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { buscarMediaChatUnificado, type UnifiedChatMessage } from "@/lib/api/whatsapp.chat";

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
      <div className={cn("mt-2 flex h-28 w-full items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]")}>
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (erro || !mediaUrl) {
    const label = message.kind === "audioMessage" ? "Áudio" : message.kind === "videoMessage" ? "Vídeo" : "Mídia";
    return (
      <div className="mt-2 flex h-20 w-full items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3">
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

        {msg.hasMedia ? <MediaPreview instanceName={instanceName} message={msg} /> : null}

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

type ChatMessageListProps = {
  instanceName: string;
  remoteJid: string;
  messages: UnifiedChatMessage[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
};

export function ChatMessageList({ instanceName, remoteJid, messages, carregando, erro, recarregar }: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inicializadoRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || messages.length === 0) {
      return;
    }

    const distanciaDoFim = container.scrollHeight - container.scrollTop - container.clientHeight;
    const deveAncorarNoFim = container.scrollTop === 0 || distanciaDoFim <= 120;
    if (!deveAncorarNoFim) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: !inicializadoRef.current ? "auto" : "smooth",
    });
    inicializadoRef.current = true;
  }, [messages.length]);

  useEffect(() => {
    inicializadoRef.current = false;
  }, [instanceName, remoteJid]);

  const grouped = useMemo(() => groupMessagesByDate(messages), [messages]);
  const exibirLoadingVazio = carregando && messages.length === 0;
  const exibirErroVazio = erro && messages.length === 0;
  const exibirEstadoVazio = !carregando && !erro && messages.length === 0;

  return (
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
  );
}
