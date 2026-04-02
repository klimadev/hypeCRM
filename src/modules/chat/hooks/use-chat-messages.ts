"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  assinarMensagensChatUnificado,
  buscarMensagensChatUnificado,
  enviarMensagemChatUnificado,
} from "@/lib/api/whatsapp.chat";
import type { UnifiedChatMessage } from "@/lib/api/whatsapp.chat";

function mesclarMensagensChat(base: UnifiedChatMessage[], incoming: UnifiedChatMessage[]) {
  const mapa = new Map<string, UnifiedChatMessage>();

  for (const message of [...base, ...incoming]) {
    const existenteTemporario = [...mapa.values()].find(
      (item) =>
        item.optimistic &&
        !message.optimistic &&
        item.fromMe === message.fromMe &&
        item.remoteJid === message.remoteJid &&
        item.text === message.text &&
        Math.abs(item.timestamp - message.timestamp) <= 120,
    );

    const key = existenteTemporario ? existenteTemporario.id : message.id;
    const existing = mapa.get(key);

    if (!existing) {
      mapa.set(key, message);
      continue;
    }

    mapa.set(key, {
      ...existing,
      ...message,
      optimistic: existing.optimistic && message.optimistic,
      error: message.error ?? existing.error,
    });
  }

  return Array.from(mapa.values()).sort((a, b) => a.timestamp - b.timestamp);
}

export function useChatMessages(params: { instanceName: string | null; remoteJid: string | null }) {
  const [messages, setMessages] = useState<UnifiedChatMessage[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sseConectado, setSseConectado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const paramsRef = useRef(params);

  paramsRef.current = params;

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

    try {
      setCarregando(true);
      const result = await buscarMensagensChatUnificado({ instanceName, remoteJid, limite: 100 });
      if (!result.ok) {
        setErro(result.erro);
        return;
      }
      setMessages((prev) => mesclarMensagensChat(prev, result.dados.messages));
      setHasMore(result.dados.hasMore);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string, retryId?: string) => {
      const { instanceName, remoteJid } = paramsRef.current;
      if (!instanceName || !remoteJid) return;

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
          optimistic: true,
          error: null,
        };

        setMessages((prev) => mesclarMensagensChat(prev, [tempMessage]));

        const result = await enviarMensagemChatUnificado({ instanceName, remoteJid, text: normalizedText });
        if (!result.ok) {
          throw new Error(result.erro);
        }
        setMessages((prev) =>
          prev.map((message) =>
            message.id === tempId
              ? { ...message, status: "SENT", optimistic: false, error: null }
              : message,
          ),
        );
      } finally {
        setEnviando(false);
      }
    },
    [],
  );

  useEffect(() => {
    const { instanceName, remoteJid } = params;
    if (!instanceName || !remoteJid) {
      setMessages([]);
      setSseConectado(false);
      return;
    }

    setErro(null);
    setCarregando(true);

    void fetchInitial();

    const unsubscribe = assinarMensagensChatUnificado(
      { instanceName, remoteJid, limite: 100 },
      {
        onSnapshot: (snapshot) => {
          setMessages((prev) => mesclarMensagensChat(prev, snapshot.messages ?? []));
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

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [params.instanceName, params.remoteJid, fetchInitial]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: paramsRef handles current values, only re-subscribe on identity change

  return {
    messages: mensagensOrdenadas,
    carregando,
    erro,
    enviando,
    sseConectado,
    hasMore,
    recarregar: fetchInitial,
    sendMessage,
  };
}
