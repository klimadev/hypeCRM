"use client";

import { useState, useMemo, useEffect, useRef, useCallback, useDeferredValue, startTransition } from "react";
import { useChatData } from "./use-chat-data";
import { useToast } from "@/components/ui/toast";
import { obterFiltroOrigemLead } from "../helpers";
import type {
  ChatUnificado,
  UseChatModuleReturn,
  OrphanRegistrarLeadParams,
  OrphanCriarNegocioParams,
  ChatCategoriaContagens,
} from "../types";
import { atualizarLeadContato } from "@/lib/api/leads";
import { listarInstanciasWhatsapp } from "@/lib/api/whatsapp.instances";
import { instanciaWhatsappEstaConectada } from "@/lib/whatsapp-instancia-status";
import type { WhatsappInstancia } from "@/modules/whatsapp/types";

const DEBOUNCE_MS = 300;

export function useChatModule(params: { perfil: "EMPRESA" | "GERENTE" | "COLABORADOR"; idUsuario: string }): UseChatModuleReturn {
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const buscaDeferred = useDeferredValue(busca);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => {
        setBuscaDebounced(busca);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [busca]);

  const {
    chats,
    carregando,
    carregandoMais,
    atualizandoInbox,
    erro,
    sseConectado,
    ultimoSyncEm,
    recarregar,
    carregarMais,
    temMais,
    total,
    atualizarChatLocal,
  } = useChatData(buscaDebounced);
  const { addToast } = useToast();
  const [chatSelecionado, setChatSelecionado] = useState<ChatUnificado | null>(null);
  const [filtroOrigem, setFiltroOrigem] = useState<"todos" | "anuncio" | "whatsapp" | "manual">("todos");
  const [filtroFila, setFiltroFila] = useState<"todas" | "sem_dono" | "sem_negocio">("todas");
  const [filtroCanal, setFiltroCanal] = useState<"todos" | "whatsapp" | "instagram">("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<"todas" | "em_aberto" | "nao_lidas" | "sem_negocio" | "com_negocio">("todas");
const [filtroInstancia, setFiltroInstancia] = useState<string | null>(null);
  const [instanciasWhatsapp, setInstanciasWhatsapp] = useState<WhatsappInstancia[]>([]);

  const negocioEstaAberto = useCallback((chat: ChatUnificado) => {
    const status = chat.leadMatch?.negocio?.status?.toLowerCase().trim();
    if (!status) {
      return !chat.leadMatch?.id_negocio;
    }

    if (
      status.includes("ganho") ||
      status.includes("perdid") ||
      status.includes("fechad") ||
      status.includes("cancel") ||
      status.includes("conclu")
    ) {
      return false;
    }

    return true;
  }, []);

  const categoriaContagens = useMemo<ChatCategoriaContagens>(() => {
    return chats.reduce(
      (acc, chat) => {
        if (chat.unreadCount > 0) {
          acc.nao_lidas += 1;
        }

        if (chat.leadMatch?.id_negocio) {
          acc.com_negocio += 1;
        } else {
          acc.sem_negocio += 1;
        }

        if (negocioEstaAberto(chat)) {
          acc.em_aberto += 1;
        }

        return acc;
      },
      { em_aberto: 0, nao_lidas: 0, sem_negocio: 0, com_negocio: 0 },
    );
  }, [chats, negocioEstaAberto]);

  const chatsFiltrados = useMemo(() => {
    const termo = buscaDeferred.trim().toLowerCase();

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

      if (filtroCategoria === "nao_lidas" && chat.unreadCount <= 0) {
        return false;
      }

      if (filtroCategoria === "sem_negocio" && chat.leadMatch?.id_negocio) {
        return false;
      }

      if (filtroCategoria === "com_negocio" && !chat.leadMatch?.id_negocio) {
        return false;
      }

      if (filtroCategoria === "em_aberto" && !negocioEstaAberto(chat)) {
        return false;
      }

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
  }, [chats, buscaDeferred, filtroOrigem, filtroFila, filtroCanal, filtroCategoria, filtroInstancia, negocioEstaAberto]);

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

  const selecionarInstancia = useCallback((telefone: string, instancia: string | null): void => {
    void telefone;
    setFiltroInstancia(instancia);
  }, []);

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
    carregandoMais,
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
    filtroCategoria,
    setFiltroCategoria,
    categoriaContagens,
    filtroInstancia,
    setFiltroInstancia,
    onRegistrarComoLead,
    onCriarNegocio,
    onTransferirLead,
    onIniciarNovoChat,
    selecionarInstancia,
    instanciasWhatsapp,
    recarregandoInbox: atualizandoInbox,
  };
}
