"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useChatData } from "./use-chat-data";
import { useToast } from "@/components/ui/toast";
import { obterFiltroOrigemLead } from "../helpers";
import type {
  ChatUnificado,
  UseChatModuleReturn,
  OrphanRegistrarLeadParams,
  OrphanCriarNegocioParams,
} from "../types";
import { atualizarLeadContato } from "@/lib/api/leads";
import { listarInstanciasWhatsapp } from "@/lib/api/whatsapp.instances";
import { instanciaWhatsappEstaConectada } from "@/lib/whatsapp-instancia-status";
import type { WhatsappInstancia } from "@/modules/whatsapp/types";

export function useChatModule(params: { perfil: "EMPRESA" | "GERENTE" | "COLABORADOR"; idUsuario: string }): UseChatModuleReturn {
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const { chats, carregando, erro, sseConectado, ultimoSyncEm, recarregar, carregarMais, temMais, total, atualizarChatLocal } = useChatData(buscaDebounced);
  const { addToast } = useToast();
  const [chatSelecionado, setChatSelecionado] = useState<ChatUnificado | null>(null);
  const [filtroOrigem, setFiltroOrigem] = useState<"todos" | "anuncio" | "whatsapp" | "manual">("todos");
  const [filtroFila, setFiltroFila] = useState<"todas" | "sem_dono" | "sem_negocio">("todas");
  const [filtroCanal, setFiltroCanal] = useState<"todos" | "whatsapp" | "instagram">("todos");
  const [filtroInstancia, setFiltroInstancia] = useState<string | null>(null);
  const [instanciasWhatsapp, setInstanciasWhatsapp] = useState<WhatsappInstancia[]>([]);
  const ultimoChatMarcadoRef = useRef<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setBuscaDebounced(busca);
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [busca]);

  useEffect(() => {
    const leadId = chatSelecionado?.leadMatch?.id;
    if (!leadId) return;
    if (chatSelecionado?.canal === "instagram") return;

    const chave = `${chatSelecionado.instanceName}:${chatSelecionado.remoteJid}`;
    if (ultimoChatMarcadoRef.current === chave) return;
    ultimoChatMarcadoRef.current = chave;

    void fetch("/api/whatsapp/chat/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    }).then(async (res) => {
      if (res.ok) {
        atualizarChatLocal(chatSelecionado.instanceName, chatSelecionado.remoteJid, (chat) => ({
          ...chat,
          unreadCount: 0,
        }));
      }
    });
  }, [atualizarChatLocal, chatSelecionado]);

  const chatsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return chats.filter((chat) => {
      const filtroChat = obterFiltroOrigemLead(chat.leadMatch?.origem);
      if (filtroOrigem !== "todos" && filtroChat !== filtroOrigem) {
        return false;
      }

      if (filtroFila === "sem_dono" && chat.leadMatch?.id_funcionario) {
        return false;
      }

      if (filtroFila === "sem_negocio" && chat.leadMatch?.id_negocio) {
        return false;
      }

      if (filtroCanal !== "todos" && chat.canal !== filtroCanal) {
        return false;
      }

      // Filtro por instância (para chats duplicados)
      if (filtroInstancia && chat.isDuplicado) {
        const instanciasDoChat = chat.instancias?.map((i) => i.instanceName) ?? [];
        if (!instanciasDoChat.includes(filtroInstancia)) {
          return false;
        }
      }

      if (!termo) {
        return true;
      }

      const nome = chat.leadMatch?.nome ?? chat.pushName ?? "";
      const telefone = chat.telefone ?? "";
      const conteudo = chat.ultimaMensagem?.conteudo ?? "";
      const origem = chat.leadMatch?.origem ?? "";
      const fonte = chat.leadMatch?.fonte ?? "";
      const pdv = chat.leadMatch?.nome_pdv ?? "";
      const funcionario = chat.leadMatch?.nome_funcionario ?? "";
      const negocio = chat.leadMatch?.negocio?.titulo ?? "";
      const statusNegocio = chat.leadMatch?.negocio?.status ?? "";

      return (
        nome.toLowerCase().includes(termo) ||
        telefone.includes(termo) ||
        conteudo.toLowerCase().includes(termo) ||
        origem.toLowerCase().includes(termo) ||
        fonte.toLowerCase().includes(termo) ||
        pdv.toLowerCase().includes(termo) ||
        funcionario.toLowerCase().includes(termo) ||
        negocio.toLowerCase().includes(termo) ||
        statusNegocio.toLowerCase().includes(termo)
      );
    });
  }, [chats, busca, filtroOrigem, filtroFila, filtroCanal, filtroInstancia]);

  const chatsOrdenados = useMemo(() => {
    return [...chatsFiltrados].sort((a, b) => {
      const tsA = a.ultimaMensagem?.timestamp ?? 0;
      const tsB = b.ultimaMensagem?.timestamp ?? 0;
      return tsB - tsA;
    });
  }, [chatsFiltrados]);

  const totalChats = chats.length;
  const totalOrphans = chats.filter((c) => c.semMatch).length;
  const totalMatched = chats.filter((c) => !c.semMatch).length;
  const totalSemDono = chats.filter((c) => !c.leadMatch?.id_funcionario).length;
  const totalSemNegocio = chats.filter((c) => !c.leadMatch?.id_negocio).length;
  const totalDuplicados = chats.filter((c) => c.isDuplicado).length;

  useEffect(() => {
    void listarInstanciasWhatsapp().then((res) => {
      if (res.ok) {
        setInstanciasWhatsapp(res.dados.instancias.filter(instanciaWhatsappEstaConectada));
      }
    });
  }, []);

  const selecionarInstancia = useCallback((): void => {}, []);

  const onRegistrarComoLead = async (params: OrphanRegistrarLeadParams) => {
    try {
      const res = await fetch("/api/chat/orphan/registrar-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        addToast({
          type: "error",
          title: "Erro ao registrar lead",
          description: json.erro ?? "Ocorreu um erro ao registrar o lead.",
        });
        return;
      }
      const json = await res.json();
      addToast({
        type: "success",
        title: "Lead registrado",
        description: "O contato foi cadastrado como lead com sucesso.",
      });
      await recarregar();
      return json.lead;
    } catch {
      addToast({
        type: "error",
        title: "Erro",
        description: "Nao foi possivel conectar ao servidor.",
      });
      return null;
    }
  };

  const onCriarNegocio = async (params: OrphanCriarNegocioParams) => {
    try {
      const res = await fetch("/api/chat/orphan/criar-negocio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        addToast({
          type: "error",
          title: "Erro ao criar negocio",
          description: json.erro ?? "Ocorreu um erro ao criar o negocio.",
        });
        return;
      }
      addToast({
        type: "success",
        title: "Negocio criado",
        description: "O negocio foi criado e vinculado ao contato com sucesso.",
      });
      await recarregar();
    } catch {
      addToast({
        type: "error",
        title: "Erro",
        description: "Nao foi possivel conectar ao servidor.",
      });
    }
  };

  const onTransferirLead = async ({ idLead, idFuncionario }: { idLead: string; idFuncionario: string }) => {
    try {
      const res = await atualizarLeadContato(idLead, { id_funcionario: idFuncionario });
      if (!res.ok) {
        addToast({
          type: "error",
          title: "Erro ao transferir lead",
          description: res.erro,
        });
        return;
      }

      addToast({
        type: "success",
        title: "Lead transferido",
        description: "O responsável foi atualizado com sucesso.",
      });
      await recarregar();
    } catch {
      addToast({
        type: "error",
        title: "Erro",
        description: "Nao foi possivel conectar ao servidor.",
      });
    }
  };

  const onIniciarNovoChat = async ({ telefone, instanceName }: { telefone: string; instanceName: string }) => {
    const telefoneNormalizado = telefone.replace(/\D/g, "");
    const instancia = instanciasWhatsapp.find((i) => i.instance_name === instanceName && instanciaWhatsappEstaConectada(i));

    if (!instancia) {
      addToast({
        type: "error",
        title: "Instância inválida",
        description: "Selecione uma instância conectada para iniciar a conversa.",
      });
      return;
    }

    const chatFake: ChatUnificado = {
      instanceName: instancia.instance_name,
      remoteJid: `${telefoneNormalizado}@s.whatsapp.net`,
      telefone: telefoneNormalizado,
      pushName: null,
      isGroup: false,
      canal: "whatsapp",
      ultimaMensagem: null,
      unreadCount: 0,
      instancias: [],
      isDuplicado: false,
      instanciaSelecionada: null,
      leadMatch: null,
      semMatch: true,
    };

    setChatSelecionado(chatFake);
    addToast({
      type: "success",
      title: "Conversa iniciada",
      description: `Chat aberto via ${instancia.instance_name}. Envie uma mensagem para começar.`,
    });
  };

  return {
    chats: chatsOrdenados,
    chatSelecionado,
    setChatSelecionado,
    busca,
    setBusca,
    carregando,
    erro,
    sseConectado,
    ultimoSyncEm,
    recarregar,
    carregarMais,
    atualizarChatLocal,
    temMais,
    total,
    totalChats,
    totalOrphans,
    totalMatched,
    totalSemDono,
    totalSemNegocio,
    totalDuplicados,
    perfil: params.perfil,
    idUsuario: params.idUsuario,
    filtroOrigem,
    setFiltroOrigem,
    filtroFila,
    setFiltroFila,
    filtroCanal,
    setFiltroCanal,
    filtroInstancia,
    setFiltroInstancia,
    onRegistrarComoLead,
    onCriarNegocio,
    onTransferirLead,
    onIniciarNovoChat,
    selecionarInstancia,
    instanciasWhatsapp,
  };
}
