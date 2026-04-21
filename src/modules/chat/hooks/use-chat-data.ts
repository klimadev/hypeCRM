"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { criarAssinaturaSse } from "@/lib/api/whatsapp.shared";
import type { ChatUnificado } from "../types";

const LIMITE_PAGINA = 10;
const CHAT_LIST_FETCH_TIMEOUT_MS = 25_000;

function ordenarChatsPorTimestamp(chats: ChatUnificado[]) {
  return [...chats].sort((a, b) => (b.ultimaMensagem?.timestamp ?? 0) - (a.ultimaMensagem?.timestamp ?? 0));
}

function chaveDoChat(chat: ChatUnificado) {
  const identidade = chat.telefone || chat.remoteJid;
  return `${chat.canal}:${chat.instanceName}:${identidade}`;
}

function mesclarChats(base: ChatUnificado[], novos: ChatUnificado[], substituirBase = false) {
  const mapa = new Map<string, ChatUnificado>();

  if (!substituirBase) {
    for (const chat of base) {
      mapa.set(chaveDoChat(chat), chat);
    }
  }

  for (const chat of novos) {
    mapa.set(chaveDoChat(chat), chat);
  }

  return ordenarChatsPorTimestamp(Array.from(mapa.values()));
}

export function useChatData(busca?: string) {
  const [chats, setChats] = useState<ChatUnificado[]>([]);
  // Keep the first render deterministic across SSR and hydration.
  const [carregando, setCarregando] = useState(true);
  const [atualizandoInbox, setAtualizandoInbox] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sseConectado, setSseConectado] = useState(false);
  const [ultimoSyncEm, setUltimoSyncEm] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const chatsRef = useRef<ChatUnificado[]>([]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const fetchPagina = useCallback(async (pag: number, termoBusca?: string) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CHAT_LIST_FETCH_TIMEOUT_MS);

    try {
      if (pag === 1) {
        setAtualizandoInbox(true);
      }
      if (pag === 1 && chatsRef.current.length === 0) {
        setCarregando(true);
      }
      const params = new URLSearchParams();
      params.set("pagina", String(pag));
      params.set("limite", String(LIMITE_PAGINA));
      if (termoBusca && termoBusca.trim()) {
        params.set("busca", termoBusca.trim());
      }
      const res = await fetch(`/api/chat/all?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.erro ?? "Erro ao carregar chats");
      }
      const data = await res.json();
      const chatsRecebidos = data.chats ?? [];
      setChats((atual) => mesclarChats(atual, chatsRecebidos, pag === 1));
      setTotal(data.total ?? 0);
      setPagina(data.pagina ?? 1);
      setTemMais(data.temMais ?? false);
      setErro(null);
      setUltimoSyncEm(Date.now());
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setErro("A busca de conversas excedeu o tempo limite. Tente novamente.");
      } else {
        setErro(err instanceof Error ? err.message : "Erro desconhecido");
      }
    } finally {
      window.clearTimeout(timeout);
      if (pag === 1) {
        setAtualizandoInbox(false);
      }
      setCarregando(false);
    }
  }, []);

  const carregarMais = useCallback(() => {
    if (!temMais || carregando) return;
    fetchPagina(pagina + 1, busca);
  }, [temMais, carregando, pagina, fetchPagina, busca]);

  const recarregar = useCallback(() => fetchPagina(1, busca), [fetchPagina, busca]);

  const atualizarChatLocal = useCallback(
    (instanceName: string, remoteJid: string, updater: (chat: ChatUnificado) => ChatUnificado) => {
      setChats((atual) => {
        const proximos = atual.map((chat) =>
          chat.instanceName === instanceName && chat.remoteJid === remoteJid ? updater(chat) : chat,
        );
        return proximos;
      });
    },
    [],
  );

  useEffect(() => {
    const substituirBase = !!busca && busca.trim().length > 0;

    void fetchPagina(1, busca).then(() => {
      if (substituirBase) {
        setChats((atual) => mesclarChats([], atual, true));
      }
    });

    let unsubscribe: (() => void) | null = null;
    let pausado = false;

    const conectarSse = () => {
      if (unsubscribe) return;
      unsubscribe = criarAssinaturaSse<{ chats: ChatUnificado[]; total: number; temMais: boolean }>(
        "/api/chat/stream",
        {
          onSnapshot: (snapshot) => {
            if (pausado) return;
            const chatsRecebidos = snapshot.chats ?? [];
            setChats((atual) => {
              const proximos = mesclarChats(atual, chatsRecebidos, substituirBase);
              return proximos;
            });
            setTotal(snapshot.total ?? 0);
            setTemMais(snapshot.temMais ?? false);
            setSseConectado(true);
            setErro(null);
            setUltimoSyncEm(Date.now());
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (pausado) {
          pausado = false;
          desconectarSse();
          conectarSse();
          void fetchPagina(1, busca);
        }
      } else {
        pausado = true;
        desconectarSse();
      }
    };

    conectarSse();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      desconectarSse();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [busca, fetchPagina]);

  return {
    chats,
    carregando,
    atualizandoInbox,
    erro,
    sseConectado,
    ultimoSyncEm,
    recarregar,
    carregarMais,
    temMais,
    total,
    atualizarChatLocal,
  };
}
