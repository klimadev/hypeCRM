"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  assinarMensagensWhatsapp,
  enviarMensagemWhatsapp,
  listarMensagensWhatsapp,
  marcarMensagensComoLidas,
} from "@/lib/api/whatsapp";
import { traduzirTipoMensagem, normalizarTimestampParaIso } from "@/lib/whatsapp-utils";
import type { ChatConnectionStatus, WhatsappChatBlockedState, WhatsappChatMessage } from "@/modules/whatsapp/types";
import { mergeWhatsappChatMessages, resolverLeadIdWhatsappChat } from "@/modules/whatsapp/chat-helpers";

type UseWhatsappChatParams = {
  leadId?: string;
  contatoId?: string;
  enabled: boolean;
  markReadEnabled: boolean;
  pollMs?: number;
};

export function useWhatsappChat({ leadId, contatoId, enabled, markReadEnabled, pollMs = 30000 }: UseWhatsappChatParams) {
  const [messages, setMessages] = useState<WhatsappChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ChatConnectionStatus>("unknown");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedState, setBlockedState] = useState<WhatsappChatBlockedState | null>(null);
  const backoffMsRef = useRef(pollMs);
  const messagesRef = useRef<WhatsappChatMessage[]>([]);

  const mountedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const markReadInFlightRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pollingFallbackRef = useRef(false);

  const resolvedLeadId = useMemo(
    () => resolverLeadIdWhatsappChat({ leadId, contatoId }),
    [contatoId, leadId],
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const cancelarSincronizacaoPendente = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    cancelarSincronizacaoPendente();
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
  }, [cancelarSincronizacaoPendente]);

  const fetchMessages = useCallback(async () => {
    if (!enabled || !resolvedLeadId) return;
    requestSeqRef.current += 1;
    const currentSeq = requestSeqRef.current;

    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    if (mountedRef.current) {
      setLoading((prev) => prev || messagesRef.current.length === 0);
      setError(null);
    }

    try {
      const resultado = await listarMensagensWhatsapp(resolvedLeadId, signal);
      if (!resultado.ok) {
        if (resultado.codigo === "PDV_SEM_INSTANCIA") {
          setBlockedState({
            type: "missing_pdv_instance",
            message: resultado.erro,
            actionLabel: resultado.rotaConfiguracao ? "Configurar WhatsApp deste PDV" : undefined,
            actionHref: resultado.rotaConfiguracao ?? undefined,
          });
          setConnectionStatus("unknown");
          setMessages([]);
          setUnreadCount(0);
          return;
        }
        throw new Error(resultado.erro);
      }
      if (!mountedRef.current || currentSeq !== requestSeqRef.current) return;

      pollingFallbackRef.current = false;
      setBlockedState(null);
      setMessages((prev) => mergeWhatsappChatMessages(prev, resultado.dados.messages));
      setConnectionStatus(resultado.dados.connectionStatus);
      setUnreadCount(resultado.dados.unreadCount);
      backoffMsRef.current = pollMs;
    } catch (err) {
      if (!mountedRef.current || signal.aborted) return;
      pollingFallbackRef.current = true;
      setError(err instanceof Error ? err.message : "Erro ao carregar mensagens.");
      backoffMsRef.current = Math.max(pollMs, 30000);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      if (enabled && resolvedLeadId && pollingFallbackRef.current) {
         const delay = document.visibilityState === "hidden" ? Math.max(backoffMsRef.current, 30000) : backoffMsRef.current;
         timeoutRef.current = setTimeout(() => {
           void fetchMessages();
         }, delay);
       }
     }
  }, [enabled, pollMs, resolvedLeadId]);

  const reload = useCallback(async () => {
    cancelarSincronizacaoPendente();
    await fetchMessages();
  }, [cancelarSincronizacaoPendente, fetchMessages]);

  const sendMessage = useCallback(
    async (text: string, retryId?: string) => {
      if (!resolvedLeadId || !enabled) return;

      const normalizedText = text.trim();
      if (!normalizedText) return;

      const tempId = retryId ?? `temp-${Date.now()}`;
      const now = Math.floor(Date.now() / 1000);
      const optimisticMessage: WhatsappChatMessage = {
        id: tempId,
        messageId: tempId,
        leadId: resolvedLeadId,
        remoteJid: "",
        remoteJidAlt: null,
        fromMe: true,
        direction: "outgoing",
        text: normalizedText,
        kind: "text",
        tipoLabel: traduzirTipoMensagem("text"),
        status: "PENDING",
        timestamp: now,
        timestampIso: normalizarTimestampParaIso(now),
        createdAtIso: new Date().toISOString(),
        readAtIso: null,
        dadosAd: null,
        optimistic: true,
        error: null,
      };

      setError(null);
      setSending(true);
      setMessages((prev) => {
        const withoutRetry = retryId ? prev.filter((msg) => msg.id !== retryId) : prev;
        return mergeWhatsappChatMessages(withoutRetry, [optimisticMessage]);
      });

      try {
        const resultado = await enviarMensagemWhatsapp({
          leadId: resolvedLeadId,
          text: normalizedText,
          clientTempId: tempId,
        });

        if (!resultado.ok) {
          if (resultado.codigo === "PDV_SEM_INSTANCIA") {
            setBlockedState({
              type: "missing_pdv_instance",
              message: resultado.erro,
              actionLabel: resultado.rotaConfiguracao ? "Configurar WhatsApp deste PDV" : undefined,
              actionHref: resultado.rotaConfiguracao ?? undefined,
            });
          }
          throw new Error(resultado.erro);
        }

        setBlockedState(null);
        const serverMessage = resultado.dados.message;

        setMessages((prev) => {
          const replaced = prev.map((message) =>
            message.id === (resultado.dados.clientTempId ?? tempId) ? { ...serverMessage, optimistic: false } : message,
          );
          return mergeWhatsappChatMessages(replaced, [serverMessage]);
        });
      } catch (err) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === tempId
              ? {
                  ...message,
                  status: "ERROR",
                  error: err instanceof Error ? err.message : "Erro ao enviar mensagem.",
                  optimistic: false,
                }
              : message,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [enabled, resolvedLeadId],
  );

  const retryMessage = useCallback(
    async (message: WhatsappChatMessage) => {
      await sendMessage(message.text, message.id);
    },
    [sendMessage],
  );

  const markRead = useCallback(async () => {
    if (!resolvedLeadId || !markReadEnabled || markReadInFlightRef.current) return;
    markReadInFlightRef.current = true;
    try {
      const resultado = await marcarMensagensComoLidas(resolvedLeadId);
      if (resultado.ok && mountedRef.current) {
        setUnreadCount(resultado.dados.unreadCount);
        setMessages((prev) =>
          prev.map((message) =>
            !message.fromMe && !message.readAtIso
              ? {
                  ...message,
                  readAtIso: new Date().toISOString(),
                }
              : message,
          ),
        );
      }
    } finally {
      markReadInFlightRef.current = false;
    }
  }, [markReadEnabled, resolvedLeadId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  useEffect(() => {
    const mesmaConversa = Boolean(resolvedLeadId) && messagesRef.current[0]?.leadId === resolvedLeadId;

    if (!mesmaConversa) {
      setMessages([]);
      setUnreadCount(0);
      setConnectionStatus("unknown");
    }
    setError(null);
    setBlockedState(null);
    backoffMsRef.current = pollMs;
    pollingFallbackRef.current = typeof EventSource === "undefined";

    if (!enabled || !resolvedLeadId) {
      stopPolling();
      return;
    }

    void fetchMessages();
    if (typeof EventSource !== "undefined") {
      unsubscribeRef.current = assinarMensagensWhatsapp(resolvedLeadId, {
        onSnapshot: (snapshot) => {
          if (!mountedRef.current) return;
          pollingFallbackRef.current = false;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setBlockedState(null);
          setError(null);
          setMessages((prev) => mergeWhatsappChatMessages(prev, snapshot.messages));
          setConnectionStatus(snapshot.connectionStatus);
          setUnreadCount(snapshot.unreadCount);
        },
        onError: () => {
          if (!mountedRef.current) return;
          pollingFallbackRef.current = true;
          backoffMsRef.current = Math.max(pollMs, 30000);
          if (!timeoutRef.current) {
            void fetchMessages();
          }
        },
      });
    }

    return () => {
      stopPolling();
    };
  }, [enabled, fetchMessages, pollMs, resolvedLeadId, stopPolling]);

  useEffect(() => {
    if (!markReadEnabled || unreadCount <= 0) return;
    void markRead();
  }, [markReadEnabled, unreadCount, markRead]);

  const canSend = useMemo(
    () => enabled && Boolean(resolvedLeadId) && connectionStatus === "online",
    [connectionStatus, enabled, resolvedLeadId],
  );

  return {
    messages,
    connectionStatus,
    unreadCount,
    loading,
    sending,
    error,
    blockedState,
    canSend,
    sendMessage,
    retryMessage,
    markRead,
    reload,
  };
}
