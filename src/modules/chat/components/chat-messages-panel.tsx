"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Loader2, AlertCircle, MessageSquare, Send, FileText, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import NextImage from "next/image";
import { buscarMediaChatUnificado, type UnifiedChatMessage } from "@/lib/api/whatsapp.chat";
import { useChatMessages } from "../hooks/use-chat-messages";

type ChatMessagesPanelProps = {
  instanceName: string;
  remoteJid: string;
  nomeContato: string;
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
      <div className="mt-1 flex h-36 w-56 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (erro || !mediaUrl) {
    const label = message.kind === "audioMessage" ? "Áudio" : message.kind === "videoMessage" ? "Vídeo" : "Mídia";
    return (
      <div className="mt-1 flex h-24 w-56 items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3">
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
        className="mt-1 max-h-72 max-w-full rounded-2xl object-contain"
      />
    );
  }

  if (message.kind === "audioMessage") {
    return (
      <div className="mt-1 flex w-72 flex-col gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Volume2 className="h-4 w-4 text-[var(--brand)]" />
          Áudio
        </div>
        <audio controls src={mediaUrl} className="w-full" />
      </div>
    );
  }

  if (message.kind === "videoMessage") {
    return (
      <video controls className="mt-1 max-h-72 max-w-full rounded-2xl border border-[var(--border-subtle)] bg-black" src={mediaUrl} />
    );
  }

  return (
    <div className="mt-1 flex w-56 items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
      <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
      <span className="truncate text-xs text-[var(--text-secondary)]">Anexo</span>
    </div>
  );
}

function MessageBubble({ msg }: { msg: UnifiedChatMessage }) {
  const isFromMe = msg.fromMe;
  const isMedia = msg.hasMedia;
  const kindIcon = getKindIcon(msg.kind);
  const isProtocol = msg.kind === "protocolMessage";

  if (isProtocol) return null;

  return (
    <div className={`flex ${isFromMe ? "justify-end" : "justify-start"} px-2 py-0.5`}>
      <div
        className={`relative max-w-[64%] rounded-[18px] px-3 py-2 text-sm shadow-sm ${
          isFromMe
            ? "bg-[color:rgba(139,92,246,0.18)] text-[var(--text-primary)]"
            : "bg-[var(--surface-elevated)] text-[var(--text-primary)]"
        }`}
      >
        {!isFromMe && msg.pushName && msg.pushName !== "Você" && (
          <p className="mb-0.5 text-[11px] font-medium text-[var(--brand)]">{msg.pushName}</p>
        )}

        {isMedia && kindIcon && !msg.mediaUrl && msg.kind !== "imageMessage" && (
          <span className="mr-1.5 text-base">{kindIcon}</span>
        )}

        {msg.text && msg.kind !== "imageMessage" && msg.kind !== "audioMessage" && msg.kind !== "videoMessage" && (
          <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{msg.text}</p>
        )}

        <p
          className={`mt-1 text-[10px] ${
            isFromMe ? "text-[var(--text-tertiary)]" : "text-[var(--text-tertiary)]"
          }`}
        >
          {formatarHora(msg.timestamp)}
        </p>
      </div>
    </div>
  );
}

function MessageDateSeparator({ timestamp }: { timestamp: number }) {
  return (
    <div className="flex items-center justify-center py-3">
      <span className="rounded-full bg-[var(--surface-elevated)] px-3 py-1 text-[11px] font-medium text-[var(--text-tertiary)] shadow-sm">
        {formatarDataGrupo(timestamp)}
      </span>
    </div>
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

export function ChatMessagesPanel({ instanceName, remoteJid }: Omit<ChatMessagesPanelProps, "nomeContato">) {
  const { messages, carregando, erro, enviando, sseConectado, recarregar, sendMessage, scheduleMessage, agendadas } = useChatMessages({
    instanceName,
    remoteJid,
  });
  const [texto, setTexto] = useState("");
  const [agendar, setAgendar] = useState(false);
  const [agendadoPara, setAgendadoPara] = useState("");
  const { addToast } = useToast();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inicializadoRef = useRef(false);

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

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {!sseConectado && (
        <div className="flex items-center justify-center gap-2 border-b border-[var(--border-subtle)] bg-amber-500/10 px-4 py-1.5">
          <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
          <span className="text-xs text-amber-400">Atualizando em tempo real...</span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden bg-[var(--surface)]">
        <div
          ref={containerRef}
          className="h-full overflow-y-auto overscroll-contain"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        >
        {exibirLoadingVazio ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
              <p className="text-sm text-[var(--text-tertiary)]">Carregando mensagens...</p>
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
            <div className="flex flex-col items-center gap-3 p-6">
              <MessageSquare className="h-10 w-10 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">Nenhuma mensagem encontrada</p>
              <p className="text-xs text-[var(--text-tertiary)]">
                As mensagens aparecerão aqui quando houver atividade
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-0 py-4">
            {grouped.map((group) => (
              <div key={group.date}>
                <MessageDateSeparator timestamp={group.timestamp} />
                {group.messages.map((msg) => (
                  <div key={msg.id}>
                    <MessageBubble msg={msg} />
                    {msg.hasMedia ? <MediaPreview instanceName={instanceName} message={msg} /> : null}
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-3">
        {agendadas.length > 0 && (
          <div className="mx-auto mb-2 w-full max-w-4xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-xs text-[var(--text-secondary)]">
            <div className="mb-2 font-medium text-[var(--text-primary)]">Mensagens agendadas</div>
            <div className="space-y-2">
              {agendadas.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/10 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-[var(--text-primary)]">{item.conteudo}</div>
                    <div>{new Date(item.agendadoPara).toLocaleString()}</div>
                  </div>
                  <span className="rounded-full bg-[var(--brand)]/20 px-2 py-1 text-[10px] text-[var(--brand)]">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-2 shadow-[var(--shadow-sm)]">
          <label className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            <input type="checkbox" checked={agendar} onChange={(e) => setAgendar(e.target.checked)} />
            Agendar
          </label>
          {agendar && (
            <input
              type="datetime-local"
              value={agendadoPara}
              onChange={(e) => setAgendadoPara(e.target.value)}
              className="h-10 rounded-lg border border-[var(--border-subtle)] bg-transparent px-3 text-xs text-[var(--text-primary)]"
            />
          )}
          <input
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={enviando || !instanceName || !remoteJid}
            placeholder="Digite uma mensagem..."
            className="h-10 flex-1 bg-transparent px-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={enviando || !texto.trim()}
            className="h-10 w-10 rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
