"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  assinarMensagensChatUnificado,
  buscarMensagensChatUnificado,
  enviarMensagemChatUnificado,
  enviarMidiaChatUnificado,
  agendarMensagemChatUnificado,
  listarMensagensAgendadas,
  cancelarMensagemAgendada,
  type MensagemAgendada,
} from "@/lib/api/whatsapp.chat";
import type { UnifiedChatMessage } from "@/lib/api/whatsapp.chat";

function mesclarMensagensChat(base: UnifiedChatMessage[], incoming: UnifiedChatMessage[]) {
  const mapa = new Map<string, UnifiedChatMessage>();
  const mapaTemporario = new Map<string, UnifiedChatMessage>();
  const agora = Math.floor(Date.now() / 1000);

  for (const message of [...base, ...incoming]) {
    let key = message.id;

    if (!message.optimistic) {
      const temporarioMatch = Array.from(mapaTemporario.values()).find(
        (item) =>
          item.fromMe === message.fromMe &&
          item.remoteJid === message.remoteJid &&
          item.text === message.text &&
          Math.abs(item.timestamp - message.timestamp) <= 120,
      );
      if (temporarioMatch) {
        key = temporarioMatch.id;
        mapaTemporario.delete(temporarioMatch.id);
      }
    } else if (message.optimistic || (message.fromMe && Math.abs(agora - message.timestamp) <= 30)) {
      mapaTemporario.set(message.id, message);
    }

    const existing = mapa.get(key);

    if (!existing) {
      mapa.set(key, message);
      continue;
    }

    const merged = {
      ...existing,
      ...message,
      mediaUrl: message.mediaUrl ?? existing.mediaUrl,
      hasMedia: message.hasMedia || existing.hasMedia,
      seconds: message.seconds ?? existing.seconds ?? null,
      optimistic: existing.optimistic && message.optimistic,
      error: message.error ?? existing.error,
    };

    if (existing.fromMe && !message.optimistic && existing.optimistic) {
      merged.optimistic = false;
      merged.status = message.status ?? existing.status;
    }

    mapa.set(key, merged);
  }

  return Array.from(mapa.values()).sort((a, b) => a.timestamp - b.timestamp);
}

function ordenarMensagensPorTimestamp(messages: UnifiedChatMessage[]) {
  return [...messages].sort((a, b) => a.timestamp - b.timestamp);
}

export function useChatMessages(params: { instanceName: string | null; remoteJid: string | null }) {
  const [messages, setMessages] = useState<UnifiedChatMessage[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sseConectado, setSseConectado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [agendadas, setAgendadas] = useState<MensagemAgendada[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const paramsRef = useRef(params);
  
  // Generation counter - usado para detectar mudanças de conversa
  const generationRef = useRef(0);

  paramsRef.current = params;

  const paramsAtuaisRef = useRef<{ instanceName: string | null; remoteJid: string | null }>({
    instanceName: null,
    remoteJid: null,
  });

  const mensagensOrdenadas = useMemo(
    () => [...messages].sort((a, b) => a.timestamp - b.timestamp),
    [messages],
  );

  const fetchInitial = useCallback(async () => {
    const { instanceName, remoteJid } = paramsRef.current;
    if (!instanceName || !remoteJid) {
      setMessages([]);
      setCarregando(false);
      return;
    }

    // Guard: evitar buscar/mesclar mensagens de conversas diferentes
    paramsAtuaisRef.current = { instanceName, remoteJid };
    const geracaoAtual = generationRef.current;

    try {
      setCarregando(true);
      setPaginaAtual(1);
      const result = await buscarMensagensChatUnificado({ instanceName, remoteJid, limite: 10, page: 1 });
      
      // Verificação: geração mudou durante fetch?
      if (geracaoAtual !== generationRef.current) {
        console.log("[ChatMessages] Abortando fetch - geração mudou");
        setCarregando(false);
        return;
      }
      
      // Verificação pós-busca: params ainda correspondem?
      if (paramsAtuaisRef.current.instanceName !== instanceName || paramsAtuaisRef.current.remoteJid !== remoteJid) {
        console.log("[ChatMessages] Abortando fetch - params mudou durante carregamento");
        setCarregando(false);
        return;
      }

      if (!result.ok) {
        setErro(result.erro);
        return;
      }
      setMessages((prev) => {
        const atual = paramsAtuaisRef.current;
        if (atual.instanceName !== instanceName || atual.remoteJid !== remoteJid) {
          return prev;
        }
        return ordenarMensagensPorTimestamp(mesclarMensagensChat(prev, result.dados.messages));
      });
      setHasMore(result.dados.hasMore);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarMensagensAnteriores = useCallback(async () => {
    const { instanceName, remoteJid } = paramsRef.current;
    if (!instanceName || !remoteJid || carregando || carregandoMais || !hasMore) return;

    const proximaPagina = paginaAtual + 1;
    setCarregandoMais(true);
    try {
      const result = await buscarMensagensChatUnificado({ instanceName, remoteJid, limite: 10, page: proximaPagina });
      if (!result.ok) {
        setErro(result.erro);
        return;
      }

      setMessages((prev) => {
        return ordenarMensagensPorTimestamp(mesclarMensagensChat(result.dados.messages, prev));
      });
      setPaginaAtual(proximaPagina);
      setHasMore(result.dados.hasMore);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setCarregandoMais(false);
    }
  }, [carregando, carregandoMais, hasMore, paginaAtual]);

  const sendMessage = useCallback(
    async (text: string, retryId?: string) => {
      const { instanceName, remoteJid } = paramsRef.current;
      if (!instanceName || !remoteJid) return;

      // Guard: verificar se ainda estamos na mesma geração (conversation)
      const geracaoAtual = generationRef.current;
      if (geracaoAtual !== generationRef.current) {
        console.log("[ChatMessages] Abortando envio - geração mudou");
        return;
      }

      // Guard: verificar se ainda estamos na mesma conversa
      const atual = paramsAtuaisRef.current;
      if (atual.instanceName !== instanceName || atual.remoteJid !== remoteJid) {
        console.log("[ChatMessages] Abortando envio - params mudou");
        return;
      }

      const normalizedText = text.trim();
      if (!normalizedText) return;

      setEnviando(true);
      try {
        const tempId = retryId ?? `temp-${Date.now()}`;
        const now = Math.floor(Date.now() / 1000);
        const tempMessage: UnifiedChatMessage = {
          id: tempId,
          remoteJid,
          fromMe: true,
          text: normalizedText,
          kind: "text",
          timestamp: now,
          pushName: null,
          status: "PENDING",
          hasMedia: false,
          mediaUrl: null,
          seconds: null,
          dadosAd: null,
          optimistic: true,
          error: null,
        };

        setMessages((prev) => {
          // Guard adicional antes de modificar estado
          const atual = paramsAtuaisRef.current;
          if (atual.instanceName !== instanceName || atual.remoteJid !== remoteJid) {
            console.log("[ChatMessages] Abortando adição de mensagem - params mudou");
            return prev;
          }
          return mesclarMensagensChat(prev, [tempMessage]);
        });

        const result = await enviarMensagemChatUnificado({ instanceName, remoteJid, text: normalizedText });
        if (!result.ok) {
          setMessages((prev) => {
            const atual = paramsAtuaisRef.current;
            if (atual.instanceName !== instanceName || atual.remoteJid !== remoteJid) {
              return prev;
            }
            const proximas = prev.map((message) =>
              message.id === tempId
                ? { ...message, status: "ERROR", optimistic: false, error: result.erro }
                : message,
            );
            return proximas;
          });
          throw new Error(result.erro);
        }
        setMessages((prev) => {
          const atual = paramsAtuaisRef.current;
          if (atual.instanceName !== instanceName || atual.remoteJid !== remoteJid) {
            return prev;
          }
          const proximas = prev.map((message) =>
            message.id === tempId
              ? { ...message, status: "SENT", optimistic: false, error: null }
              : message,
          );
          return proximas;
        });
      } finally {
        setEnviando(false);
      }
    },
    [],
  );

  const sendMedia = useCallback(
    async (arquivo: File, caption?: string) => {
      const { instanceName, remoteJid } = paramsRef.current;
      if (!instanceName || !remoteJid) return;

      setEnviando(true);
      try {
        const tempId = `temp-media-${Date.now()}`;
        const now = Math.floor(Date.now() / 1000);
        const isSticker = arquivo.type === "image/webp" || arquivo.name.toLowerCase().endsWith(".webp");
        const isImage = arquivo.type.startsWith("image/");
        const kind = isSticker ? "stickerMessage" : isImage ? "imageMessage" : "documentMessage";
        const tempMessage: UnifiedChatMessage = {
          id: tempId,
          remoteJid,
          fromMe: true,
          text: kind === "documentMessage" ? `[Arquivo: ${arquivo.name}]` : isSticker ? "[Sticker]" : caption?.trim() || "",
          kind,
          timestamp: now,
          pushName: null,
          status: "PENDING",
          hasMedia: true,
          mediaUrl: URL.createObjectURL(arquivo),
          seconds: null,
          dadosAd: null,
          optimistic: true,
          error: null,
        };

        setMessages((prev) => mesclarMensagensChat(prev, [tempMessage]));

        const result = await enviarMidiaChatUnificado({ instanceName, remoteJid, arquivo, caption });
        if (!result.ok) {
          setMessages((prev) => prev.map((message) => (message.id === tempId ? { ...message, status: "ERROR", optimistic: false, error: result.erro } : message)));
          throw new Error(result.erro);
        }

        setMessages((prev) => prev.map((message) => (message.id === tempId ? { ...message, status: "SENT", optimistic: false, error: null } : message)));
      } finally {
        setEnviando(false);
      }
    },
    [],
  );

  const fetchAgendadas = useCallback(async () => {
    const { instanceName, remoteJid } = paramsRef.current;
    if (!instanceName || !remoteJid) {
      setAgendadas([]);
      return;
    }

    const result = await listarMensagensAgendadas({ instanceName, remoteJid });
    if (result.ok) {
      setAgendadas(result.dados.agendadas);
    }
  }, []);

  const scheduleMessage = useCallback(
    async (text: string, agendadoPara: string, arquivo?: File | null) => {
      const { instanceName, remoteJid } = paramsRef.current;
      if (!instanceName || !remoteJid) return;

      // Guard: verificar geração
      const geracaoAtual = generationRef.current;
      if (geracaoAtual !== generationRef.current) {
        console.log("[ChatMessages] Abortando agendamento - geração mudou");
        return;
      }

      // Guard: verificar se ainda estamos na mesma conversa
      const atual = paramsAtuaisRef.current;
      if (atual.instanceName !== instanceName || atual.remoteJid !== remoteJid) {
        console.log("[ChatMessages] Abortando agendamento - params mudou");
        return;
      }

      const normalizedText = text.trim();
      if (!normalizedText && !arquivo) return;

      const result = await agendarMensagemChatUnificado({
        instanceName,
        remoteJid,
        text: normalizedText,
        agendadoPara,
        arquivo: arquivo ?? undefined,
      });

      if (!result.ok) {
        throw new Error(result.erro);
      }

      await fetchAgendadas();
      return result.dados;
    },
    [fetchAgendadas],
  );

  const cancelScheduledMessage = useCallback(
    async (id: string) => {
      const result = await cancelarMensagemAgendada(id);
      if (!result.ok) {
        throw new Error(result.erro);
      }
      await fetchAgendadas();
    },
    [fetchAgendadas],
  );

  useEffect(() => {
    const { instanceName, remoteJid } = params;
    if (!instanceName || !remoteJid) {
      setMessages([]);
      setSseConectado(false);
      return;
    }

    generationRef.current++;
    const geracaoAtual = generationRef.current;

    paramsAtuaisRef.current = { instanceName, remoteJid };

    setMessages([]);
    setErro(null);
    setSseConectado(false);
    
    setCarregando(true);

    let ativo = true;
    let unsubscribe: (() => void) | null = null;
    let pausado = false;

    const conectarSse = () => {
      if (unsubscribe || !ativo) return;
      unsubscribe = assinarMensagensChatUnificado(
        { instanceName, remoteJid, limite: 10 },
        {
          onSnapshot: (snapshot) => {
            if (geracaoAtual !== generationRef.current) {
              console.log("[ChatMessages] Ignorando snapshot - geração mudou");
              return;
            }
            const atual = paramsAtuaisRef.current;
            if (atual.instanceName !== instanceName || atual.remoteJid !== remoteJid) {
              console.log("[ChatMessages] Ignorando snapshot - params mudou");
              return;
            }
            if (pausado) return;
            setMessages((prev) => {
              return mesclarMensagensChat(prev, snapshot.messages ?? []);
            });
            setHasMore(snapshot.hasMore ?? false);
            setSseConectado(true);
            setCarregando(false);
            setErro(null);
          },
          onError: () => {
            setSseConectado(false);
          },
        },
      );
      unsubscribeRef.current = unsubscribe;
    };

    const desconectarSse = () => {
      unsubscribe?.();
      unsubscribe = null;
      unsubscribeRef.current = null;
    };

    const iniciar = async () => {
      if (geracaoAtual !== generationRef.current) {
        console.log("[ChatMessages] Abortando - geração mudou");
        return;
      }

      if (geracaoAtual !== generationRef.current) return;
      await fetchInitial();

      if (geracaoAtual !== generationRef.current) {
        console.log("[ChatMessages] Abortando após fetch - geração mudou");
        return;
      }
      
      if (!ativo) return;

      const atual = paramsAtuaisRef.current;
      if (atual.instanceName !== instanceName || atual.remoteJid !== remoteJid) {
        console.log("[ChatMessages] Abortando SSE - params mudou");
        return;
      }

      conectarSse();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (pausado && ativo) {
          pausado = false;
          desconectarSse();
          conectarSse();
          if (geracaoAtual === generationRef.current) {
            void fetchInitial();
          }
        }
      } else {
        pausado = true;
        desconectarSse();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    void iniciar();

    return () => {
      ativo = false;
      desconectarSse();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchInitial, params.instanceName, params.remoteJid]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: paramsRef handles current values, only re-subscribe on identity change

  return {
    messages: mensagensOrdenadas,
    carregando,
    carregandoMais,
    erro,
    enviando,
    sseConectado,
    hasMore,
    recarregar: fetchInitial,
    sendMessage,
    sendMedia,
    scheduleMessage,
    cancelScheduledMessage,
    agendadas,
    recarregarAgendadas: fetchAgendadas,
    carregarMensagensAnteriores,
  };
}
