"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { criarAssinaturaSse } from "@/lib/api/whatsapp.shared";
import type { ChatUnificado } from "../types";

const LIMITE_PAGINA = 50;

function ordenarChatsPorTimestamp(chats: ChatUnificado[]) {
  return [...chats].sort((a, b) => (b.ultimaMensagem?.timestamp ?? 0) - (a.ultimaMensagem?.timestamp ?? 0));
}

function chaveDoChat(chat: ChatUnificado) {
  return `${chat.instanceName}:${chat.remoteJid}`;
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
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sseConectado, setSseConectado] = useState(false);
  const [ultimoSyncEm, setUltimoSyncEm] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchPagina = useCallback(async (pag: number, termoBusca?: string) => {
    try {
      setCarregando(true);
      const params = new URLSearchParams();
      params.set("pagina", String(pag));
      params.set("limite", String(LIMITE_PAGINA));
      if (termoBusca && termoBusca.trim()) {
        params.set("busca", termoBusca.trim());
      }
      const res = await fetch(`/api/chat/all?${params.toString()}`);
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
      setErro(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarMais = useCallback(() => {
    if (!temMais || carregando) return;
    fetchPagina(pagina + 1, busca);
  }, [temMais, carregando, pagina, fetchPagina, busca]);

  const recarregar = useCallback(() => fetchPagina(1, busca), [fetchPagina, busca]);

  useEffect(() => {
    // Quando há busca, substituir base (não mesclar) para evitar resultados duplicados
    const substituirBase = !!busca && busca.trim().length > 0;
    fetchPagina(1, busca).then(() => {
      if (substituirBase) {
        setChats((atual) => mesclarChats([], atual, true));
      }
    });

    const unsubscribe = criarAssinaturaSse<{ chats: ChatUnificado[]; total: number; temMais: boolean }>(
      "/api/chat/stream",
      {
        onSnapshot: (snapshot) => {
          const chatsRecebidos = snapshot.chats ?? [];
          setChats((atual) => mesclarChats(atual, chatsRecebidos, substituirBase));
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

    return () => {
      unsubscribe();
    };
  }, [busca, fetchPagina]);

  return {
    chats,
    carregando,
    erro,
    sseConectado,
    ultimoSyncEm,
    recarregar,
    carregarMais,
    temMais,
    total,
  };
}
