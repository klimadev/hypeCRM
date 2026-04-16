"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  assinarMensagensChatUnificado,
  buscarMensagensChatUnificado,
  enviarMensagemChatUnificado,
  agendarMensagemChatUnificado,
  listarMensagensAgendadas,
  cancelarMensagemAgendada,
  type MensagemAgendada,
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
    async (text: string, agendadoPara: string) => {
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
      if (!normalizedText) return;

      const result = await agendarMensagemChatUnificado({
        instanceName,
        remoteJid,
        text: normalizedText,
        agendadoPara,
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

    // Incrementar geração para invalidar operações assíncronas pendentes
    generationRef.current++;
    const geracaoAtual = generationRef.current;

    // Atualizar o ref de params antes de qualquer operação
    paramsAtuaisRef.current = { instanceName, remoteJid };

    // Limpar mensagens anteriores imediatamente para evitar mistura
    setMessages([]);
    setErro(null);
    setSseConectado(false);
    
    setCarregando(true);

    let ativo = true;
    let unsubscribe: (() => void) | null = null;

    const iniciar = async () => {
      // Verificar se ainda estamos na mesma geração (conversation)
      if (geracaoAtual !== generationRef.current) {
        console.log("[ChatMessages] Abortando - geração mudou");
        return;
      }

      if (geracaoAtual !== generationRef.current) return;
      await fetchInitial();

      // Verificação após fetch
      if (geracaoAtual !== generationRef.current) {
        console.log("[ChatMessages] Abortando após fetch - geração mudou");
        return;
      }
      
      if (!ativo) return;

      // Verificar se ainda estamos na mesma conversa antes de iniciar SSE
      const atual = paramsAtuaisRef.current;
      if (atual.instanceName !== instanceName || atual.remoteJid !== remoteJid) {
        console.log("[ChatMessages] Abortando SSE - params mudou");
        return;
      }

      unsubscribe = assinarMensagensChatUnificado(
        { instanceName, remoteJid, limite: 10 },
        {
          onSnapshot: (snapshot) => {
            // Verificar geração e params
            if (geracaoAtual !== generationRef.current) {
              console.log("[ChatMessages] Ignorando snapshot - geração mudou");
              return;
            }
            const atual = paramsAtuaisRef.current;
            if (atual.instanceName !== instanceName || atual.remoteJid !== remoteJid) {
              console.log("[ChatMessages] Ignorando snapshot - params mudou");
              return;
            }
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

    void iniciar();

    return () => {
      ativo = false;
      unsubscribe?.();
      unsubscribeRef.current = null;
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
    scheduleMessage,
    cancelScheduledMessage,
    agendadas,
    recarregarAgendadas: fetchAgendadas,
    carregarMensagensAnteriores,
  };
}
