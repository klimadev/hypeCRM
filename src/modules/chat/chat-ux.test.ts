import { describe, expect, it } from "vitest";
import type { UnifiedChatMessage } from "../../lib/api/whatsapp.chat";
import type { ChatUnificado } from "./types";
import {
  encontrarIndicePrimeiraMensagemNaoLida,
  listarSinaisOperacionaisChat,
  obterAcaoPrimariaChat,
  obterPlaceholderComposerChat,
  obterResumoOperacionalChat,
} from "./chat-ux";

function criarChat(base?: Partial<ChatUnificado>): ChatUnificado {
  return {
    instanceName: "instancia-1",
    remoteJid: "5511999999999@s.whatsapp.net",
    telefone: "5511999999999",
    pushName: "Maria",
    isGroup: false,
    canal: "whatsapp",
    ultimaMensagem: {
      conteudo: "Oi",
      fromMe: false,
      timestamp: 1710000000,
      kind: "conversation",
      hasMedia: false,
      mediaUrl: null,
    },
    unreadCount: 0,
    instancias: [],
    isDuplicado: false,
    instanciaSelecionada: null,
    leadMatch: {
      id: "lead-1",
      nome: "Maria",
      telefone: "5511999999999",
      id_funcionario: "func-1",
      id_pdv: "pdv-1",
      id_estagio: "estagio-1",
      id_negocio: "neg-1",
      nome_funcionario: "Ana",
      nome_pdv: "Centro",
      nome_estagio: "Contato",
      origem: "SINCRONIZACAO_WHATSAPP",
      fonte: null,
      empresa_origem: null,
      negocio: {
        id: "neg-1",
        titulo: "Negocio Maria",
        status: "ABERTO",
        id_funcionario: "func-1",
        id_estagio: "estagio-1",
      },
    },
    semMatch: false,
    ...base,
  };
}

function criarMensagem(base?: Partial<UnifiedChatMessage>): UnifiedChatMessage {
  return {
    id: crypto.randomUUID(),
    remoteJid: "5511999999999@s.whatsapp.net",
    fromMe: false,
    text: "Oi",
    kind: "conversation",
    timestamp: 1710000000,
    pushName: "Maria",
    status: "RECEIVED",
    hasMedia: false,
    mediaUrl: null,
    ...base,
  };
}

describe("listarSinaisOperacionaisChat", () => {
  it("mostra apenas sinais que pedem acao imediata", () => {
    const chat = criarChat({
      semMatch: true,
      leadMatch: null,
      unreadCount: 3,
    });

    expect(listarSinaisOperacionaisChat(chat)).toEqual([{ label: "3 não lidas", tone: "warning" }]);
  });

  it("expõe gargalos operacionais para leads sem dono e sem negocio", () => {
    const chat = criarChat({
      leadMatch: {
        ...criarChat().leadMatch!,
        id_funcionario: "",
        nome_funcionario: null,
        id_negocio: null,
        negocio: null,
      },
    });

    expect(listarSinaisOperacionaisChat(chat)).toEqual([
      { label: "Sem responsável", tone: "warning" },
      { label: "Sem negócio", tone: "info" },
    ]);
  });
});

describe("obterResumoOperacionalChat", () => {
  it("usa novo contato como resumo discreto quando ainda nao ha lead", () => {
    expect(obterResumoOperacionalChat(criarChat({ semMatch: true, leadMatch: null }))).toBe("Novo contato");
  });

  it("resume gargalo principal sem virar um badge chamativo", () => {
    expect(
      obterResumoOperacionalChat(
        criarChat({
          leadMatch: {
            ...criarChat().leadMatch!,
            id_negocio: null,
            negocio: null,
          },
        }),
      ),
    ).toBe("Sem negócio");
  });
});

describe("obterAcaoPrimariaChat", () => {
  it("sugere registrar lead para contatos novos", () => {
    expect(obterAcaoPrimariaChat(criarChat({ semMatch: true, leadMatch: null }))).toEqual({ tipo: "registrar_lead", label: "Registrar lead" });
  });

  it("sugere marcar como lido quando ha mensagens pendentes", () => {
    expect(obterAcaoPrimariaChat(criarChat({ unreadCount: 2 }))).toEqual({ tipo: "marcar_lido", label: "Marcar como lido" });
  });

  it("sugere criar negocio quando o lead ainda nao tem oportunidade", () => {
    expect(
      obterAcaoPrimariaChat(
        criarChat({
          unreadCount: 0,
          leadMatch: {
            ...criarChat().leadMatch!,
            id_negocio: null,
            negocio: null,
          },
        }),
      ),
    ).toEqual({ tipo: "criar_negocio", label: "Criar negócio" });
  });
});

describe("obterPlaceholderComposerChat", () => {
  it("usa contexto especifico para agendamento", () => {
    expect(obterPlaceholderComposerChat({ agendar: true, canal: "whatsapp", semMatch: false, followUpStatus: null })).toBe("Mensagem agendada");
  });

  it("orienta o primeiro contato quando ainda nao existe lead", () => {
    expect(obterPlaceholderComposerChat({ agendar: false, canal: "whatsapp", semMatch: true, followUpStatus: null })).toBe("Escreva a primeira mensagem");
  });

  it("sinaliza follow-up pausado sem transformar o composer em painel", () => {
    expect(obterPlaceholderComposerChat({ agendar: false, canal: "whatsapp", semMatch: false, followUpStatus: "PAUSADO" })).toBe("Responda para retomar");
  });
});

describe("encontrarIndicePrimeiraMensagemNaoLida", () => {
  it("marca a primeira mensagem nao lida entre as mais recentes recebidas", () => {
    const messages = [
      criarMensagem({ id: "1", fromMe: false }),
      criarMensagem({ id: "2", fromMe: true }),
      criarMensagem({ id: "3", fromMe: false }),
      criarMensagem({ id: "4", fromMe: false }),
    ];

    expect(encontrarIndicePrimeiraMensagemNaoLida(messages, 2)).toBe(2);
  });

  it("retorna nulo quando nao ha nao lidas", () => {
    expect(encontrarIndicePrimeiraMensagemNaoLida([criarMensagem()], 0)).toBeNull();
  });
});
