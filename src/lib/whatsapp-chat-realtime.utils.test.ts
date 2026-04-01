import { describe, expect, it } from "vitest";
import {
  criarChaveChatStream,
  criarChaveConversasStream,
  criarMensagemPreviewConversaRealtime,
  criarWhereLeadMensagensRealtime,
  mapearConversaResumoRealtime,
  normalizarLimiteConversasRealtime,
} from "./whatsapp-chat-realtime.utils";

describe("criarWhereLeadMensagensRealtime", () => {
  it("usa id_lead quando existe lead", () => {
    expect(criarWhereLeadMensagensRealtime("lead-1", "11999999999")).toEqual({ id_lead: "lead-1" });
  });

  it("usa remote_jid quando nao existe lead", () => {
    expect(criarWhereLeadMensagensRealtime("", "(11) 99999-9999")).toEqual({
      remote_jid: { contains: "11999999999" },
    });
  });
});

describe("normalizarLimiteConversasRealtime", () => {
  it("aplica teto de 50 e fallback de 30", () => {
    expect(normalizarLimiteConversasRealtime(undefined)).toBe(30);
    expect(normalizarLimiteConversasRealtime(80)).toBe(50);
  });
});

describe("criarMensagemPreviewConversaRealtime", () => {
  it("muda o texto quando a ultima mensagem eh do usuario", () => {
    expect(criarMensagemPreviewConversaRealtime(true)).toBe("Você: mensagem enviada");
    expect(criarMensagemPreviewConversaRealtime(false)).toBe("Nova mensagem");
  });
});

describe("mapearConversaResumoRealtime", () => {
  it("gera resumo para lead existente", () => {
    expect(
      mapearConversaResumoRealtime({
        conversa: {
          remoteJid: "5511999999999@s.whatsapp.net",
          remoteJidAlt: null,
          pushName: "Maria",
          isGroup: false,
          lastMessage: { key: { remoteJid: "5511999999999@s.whatsapp.net", fromMe: false } },
        },
        lead: {
          id: "lead-1",
          nome: "Maria CRM",
          telefone: "(11) 99999-9999",
          origem: "MANUAL",
          estagioNome: "Novo",
        },
        agoraMs: 1700000000000,
      }),
    ).toMatchObject({
      leadId: "lead-1",
      leadNome: "Maria",
      leadTelefone: "(11) 99999-9999",
      naoLidas: 1,
    });
  });
});

describe("chaves dos streams", () => {
  it("mantem formato estavel para chat e lista", () => {
    expect(criarChaveChatStream("emp-1", "inst-1", "lead-1")).toBe("chat:emp-1:inst-1:lead-1");
    expect(criarChaveConversasStream("emp-1", "ana", true, 20)).toBe("conversation-list:emp-1:ana:unread:20");
  });
});
