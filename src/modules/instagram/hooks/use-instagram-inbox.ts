"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InstagramInboxConversation, InstagramInboxMessage } from "@/lib/integracoes/instagram-inbox";

type InboxSnapshot = {
  account: { id: string; nome: string; username: string; instagram_user_id: string } | null;
  conversations: InstagramInboxConversation[];
  selectedConversationId: string | null;
  messages: InstagramInboxMessage[];
};

const POLLING_MS = 10000;

export function useInstagramInbox() {
  const [snapshot, setSnapshot] = useState<InboxSnapshot>({
    account: null,
    conversations: [],
    selectedConversationId: null,
    messages: [],
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoMensagem, setCarregandoMensagem] = useState(false);

  const carregar = useCallback(async (conversationId?: string | null) => {
    if (!conversationId) {
      setCarregando(true);
    } else {
      setCarregandoMensagem(true);
    }

    try {
      const params = new URLSearchParams();
      if (conversationId) params.set("conversationId", conversationId);
      const resposta = await fetch(`/api/integracoes/instagram/inbox?${params.toString()}`, { cache: "no-store" });
      const json = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(json.erro ?? "Nao foi possivel carregar a inbox do Instagram.");
      }

      setSnapshot({
        account: json.account ?? null,
        conversations: json.conversations ?? [],
        selectedConversationId: json.selectedConversationId ?? null,
        messages: json.messages ?? [],
      });
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Nao foi possivel carregar a inbox do Instagram.");
    } finally {
      setCarregando(false);
      setCarregandoMensagem(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
    const id = window.setInterval(() => {
      void carregar(snapshot.selectedConversationId);
    }, POLLING_MS);

    return () => window.clearInterval(id);
  }, [carregar, snapshot.selectedConversationId]);

  const selecionarConversa = useCallback(async (conversationId: string) => {
    setSnapshot((atual) => ({ ...atual, selectedConversationId: conversationId }));
    await carregar(conversationId);
  }, [carregar]);

  const conversasOrdenadas = useMemo(() => {
    return [...snapshot.conversations].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [snapshot.conversations]);

  const enviarMensagem = useCallback(async (texto: string) => {
    const conversation = snapshot.conversations.find((c) => c.id === snapshot.selectedConversationId);
    if (!conversation?.participant_id || !texto.trim()) return;

    try {
      const resposta = await fetch("/api/integracoes/instagram/inbox/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: conversation.participant_id, texto }),
      });
      const json = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        throw new Error(json.erro ?? "Erro ao enviar.");
      }
      await carregar(snapshot.selectedConversationId);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao enviar mensagem.");
    }
  }, [snapshot.conversations, snapshot.selectedConversationId, carregar]);

  return {
    account: snapshot.account,
    conversations: conversasOrdenadas,
    selectedConversationId: snapshot.selectedConversationId,
    messages: snapshot.messages,
    carregando,
    carregandoMensagem,
    erro,
    selecionarConversa,
    recarregar: () => carregar(snapshot.selectedConversationId),
    enviarMensagem,
  };
}
