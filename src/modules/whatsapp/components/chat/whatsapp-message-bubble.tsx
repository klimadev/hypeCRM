"use client";

import { useCallback, useEffect, useState, memo } from "react";
import { Check, CheckCheck, Clock3, RotateCcw, Trash2, Volume2, Image, Play, Pause, Loader2 } from "lucide-react";
import { buscarMediaWhatsapp, type MediaContent } from "@/lib/api/whatsapp";
import type { WhatsappChatMessage } from "@/modules/whatsapp/types";

type Props = {
  message: WhatsappChatMessage;
  onRetry?: (message: WhatsappChatMessage) => void;
};

function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReceiptIcon({ message }: { message: WhatsappChatMessage }) {
  if (!message.fromMe) return null;
  if (message.status === "PENDING") return <Clock3 className="h-3 w-3 text-[var(--text-tertiary)]" />;
  if (message.status === "SENT") return <Check className="h-3 w-3 text-[var(--text-tertiary)]" />;
  if (message.status === "DELIVERED") return <CheckCheck className="h-3 w-3 text-[var(--text-tertiary)]" />;
  if (message.status === "READ") return <CheckCheck className="h-3 w-3 text-[var(--brand)]" />;
  if (message.status === "PLAYED") return <Volume2 className="h-3 w-3 text-[var(--info-alt)]" />;
  if (message.status === "DELETED") return <Trash2 className="h-3 w-3 text-[var(--text-tertiary)]" />;
  return null;
}

/**
 * Componente para renderizar mensagem de imagem
 */
function ImageMessage({ leadId, messageId }: { leadId: string; messageId: string }) {
  const [media, setMedia] = useState<MediaContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retries, setRetries] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);

    async function loadMedia() {
      try {
        // Usa a função com retries internos
        const result = await buscarMediaWhatsapp(leadId, messageId, 2);
        if (mounted && result.ok) {
          setMedia(result.dados.media);
        } else if (mounted) {
          setError(true);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    // Delay pequeno para evitar many requests em scroll rápido
    const timeoutId = setTimeout(loadMedia, 100);
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [leadId, messageId, retries]);

  const handleRetry = () => {
    if (retries < maxRetries) {
      setRetries(r => r + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 w-48 items-center justify-center rounded-lg bg-[var(--surface)] animate-pulse">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error || !media) {
    return (
      <button
        type="button"
        onClick={handleRetry}
        disabled={retries >= maxRetries}
        className="flex h-32 w-48 items-center justify-center rounded-lg bg-[var(--surface)] transition-colors hover:bg-[var(--surface-elevated)] disabled:opacity-50"
      >
        <div className="flex flex-col items-center gap-1 text-[var(--text-tertiary)]">
          <Image className="h-5 w-5" />
          <span className="text-xs">
            {retries >= maxRetries ? "Erro ao carregar" : "Tentar novamente"}
          </span>
        </div>
      </button>
    );
  }

  return (
    <img
      src={`data:${media.mimetype};base64,${media.base64}`}
      alt="Imagem"
      className="max-h-64 max-w-full rounded-lg object-contain"
      loading="lazy"
    />
  );
}

/**
 * Componente para renderizar mensagem de áudio
 */
function AudioMessage({ leadId, messageId }: { leadId: string; messageId: string }) {
  const [media, setMedia] = useState<MediaContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [retries, setRetries] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);

    async function loadMedia() {
      try {
        const result = await buscarMediaWhatsapp(leadId, messageId, 2);
        if (mounted && result.ok) {
          setMedia(result.dados.media);
        } else if (mounted) {
          setError(true);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const timeoutId = setTimeout(loadMedia, 100);
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [leadId, messageId, retries]);

  useEffect(() => {
    return () => {
      if (audioEl) {
        audioEl.pause();
        audioEl.src = "";
      }
    };
  }, [audioEl]);

  const togglePlay = useCallback(() => {
    if (!audioEl) return;
    if (playing) {
      audioEl.pause();
    } else {
      audioEl.play();
    }
    setPlaying(!playing);
  }, [audioEl, playing]);

  const handleRetry = () => {
    if (retries < maxRetries) {
      setRetries(r => r + 1);
    }
  };

  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const playbackRates = [1, 1.5, 2];

  const handleTimeUpdate = useCallback(() => {
    if (audioEl) {
      setCurrentTime(audioEl.currentTime);
      setDuration(audioEl.duration || media?.seconds || 0);
    }
  }, [audioEl, media?.seconds]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioEl) {
      audioEl.currentTime = time;
      setCurrentTime(time);
    }
  }, [audioEl]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (audioEl) {
      audioEl.volume = vol;
      setVolume(vol);
    }
  }, [audioEl]);

  const cyclePlaybackRate = useCallback(() => {
    const currentIndex = playbackRates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % playbackRates.length;
    const newRate = playbackRates[nextIndex];
    if (audioEl) {
      audioEl.playbackRate = newRate;
    }
    setPlaybackRate(newRate);
  }, [audioEl, playbackRate, playbackRates]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (loading) {
    return (
      <div className="flex h-16 w-64 items-center gap-2 rounded-lg bg-[var(--surface)] px-3 animate-pulse">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
        <span className="text-xs text-[var(--text-tertiary)]">Carregando...</span>
      </div>
    );
  }

  if (error || !media) {
    return (
      <button
        type="button"
        onClick={handleRetry}
        disabled={retries >= maxRetries}
        className="flex h-16 w-64 items-center gap-2 rounded-lg bg-[var(--surface)] px-3 transition-colors hover:bg-[var(--surface-elevated)] disabled:opacity-50"
      >
        <Volume2 className="h-5 w-5 text-[var(--text-tertiary)]" />
        <span className="text-xs text-[var(--text-tertiary)]">
          {retries >= maxRetries ? "Erro ao carregar" : "Tentar novamente"}
        </span>
      </button>
    );
  }

  const audioSrc = `data:${media.mimetype};base64,${media.base64}`;

  return (
    <div className="flex w-64 flex-col gap-2 rounded-lg bg-[var(--surface)] p-3">
      {/* Controls row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white transition-colors hover:bg-[var(--brand-strong)]"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 pl-0.5" />}
        </button>

        {/* Timeline/Waveform */}
        <div className="flex flex-1 flex-col gap-1">
          <input
            type="range"
            min="0"
            max={duration || media.seconds || 0}
            value={currentTime}
            onChange={handleSeek}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--border-subtle)] accent-[var(--brand)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--brand)]"
          />
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || media.seconds || 0)}</span>
          </div>
        </div>
      </div>

      {/* Bottom controls: speed + volume */}
      <div className="flex items-center justify-between">
        {/* Speed control */}
        <button
          type="button"
          onClick={cyclePlaybackRate}
          className="rounded px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-elevated)]"
        >
          {playbackRate}x
        </button>

        {/* Volume control */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (audioEl) {
                if (volume > 0) {
                  audioEl.volume = 0;
                  setVolume(0);
                } else {
                  audioEl.volume = 1;
                  setVolume(1);
                }
              }
            }}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            {volume === 0 ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : volume < 0.5 ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-[var(--border-subtle)] accent-[var(--brand)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--brand)]"
          />
        </div>
      </div>

      <audio
        ref={(el) => {
          if (el) {
            setAudioEl(el);
            el.onended = () => setPlaying(false);
            el.ontimeupdate = handleTimeUpdate;
            el.onloadedmetadata = handleTimeUpdate;
          }
        }}
        src={audioSrc}
      />
    </div>
  );
}

export function WhatsappMessageBubble({ message, onRetry }: Props) {
  const outgoing = message.fromMe;
  const isDeleted = message.status === "DELETED";
  const isMedia = message.hasMedia || ["imageMessage", "videoMessage", "audioMessage"].includes(message.kind);

  return (
    <div className={`flex w-full ${outgoing ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] border px-3 py-2 text-[13px] leading-6 shadow-[var(--shadow-sm)] ${
          outgoing
            ? "border-[color:rgba(139,92,246,0.22)] bg-[linear-gradient(180deg,rgba(139,92,246,0.16),rgba(139,92,246,0.12))] rounded-br-none"
            : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] rounded-bl-none"
        } ${isDeleted ? "opacity-50" : ""}`}
        style={{
          borderRadius: outgoing ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        }}
        >
        {isDeleted ? (
          <p className="whitespace-pre-wrap text-sm italic text-[var(--text-tertiary)]">Mensagem excluída</p>
        ) : (
          <>
            {message.kind === "imageMessage" && (
              <ImageMessage leadId={message.leadId} messageId={message.messageId} />
            )}
            {message.kind === "audioMessage" && (
              <AudioMessage leadId={message.leadId} messageId={message.messageId} />
            )}
            {message.kind === "videoMessage" && (
              <div className="flex items-center gap-2 rounded-lg bg-[var(--surface)] px-3 py-2">
                <Play className="h-4 w-4 text-[var(--text-tertiary)]" />
                <span className="text-xs text-[var(--text-tertiary)]">Vídeo</span>
              </div>
            )}
            {message.kind !== "imageMessage" && message.kind !== "audioMessage" && message.kind !== "videoMessage" && (
              <p className="whitespace-pre-wrap text-[var(--text-primary)]">{message.text}</p>
            )}
          </>
        )}
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[var(--text-tertiary)]">
          {message.status === "ERROR" ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 font-medium text-[var(--danger)] transition-colors hover:text-[color:#fb7185]"
              onClick={() => onRetry?.(message)}
            >
              <RotateCcw className="h-3 w-3" />
              Falhou
            </button>
          ) : (
            <>
              <span>{formatTime(message.timestamp)}</span>
              <ReceiptIcon message={message} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
