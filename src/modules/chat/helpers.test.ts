import { describe, expect, it } from "vitest";
import { formatarTelefoneChat, marcarChatComoLidoLocalmente } from "@/modules/chat/helpers";
import type { ChatUnificado } from "@/modules/chat/types";

describe("formatarTelefoneChat", () => {
  it("formata numero BR completo com DDI", () => {
    expect(formatarTelefoneChat("5511998765432")).toBe("+55 (11) 99876-5432");
  });

  it("retorna fallback para telefone vazio", () => {
    expect(formatarTelefoneChat("")).toBe("-");
    expect(formatarTelefoneChat(null)).toBe("-");
    expect(formatarTelefoneChat(undefined)).toBe("-");
  });

  it("nao quebra com string sem digitos", () => {
    expect(formatarTelefoneChat("sem-telefone")).toBe("sem-telefone");
  });
});

describe("marcarChatComoLidoLocalmente", () => {
  it("zera contador sem alterar outros dados da conversa", () => {
    const chat: ChatUnificado = {
      instanceName: "instancia-1",
      remoteJid: "5511999999999@s.whatsapp.net",
      telefone: "5511999999999",
      pushName: "Contato",
      isGroup: false,
      canal: "whatsapp",
      ultimaMensagem: { conteudo: "oi", fromMe: false, timestamp: 123 },
      unreadCount: 3,
      instancias: [],
      isDuplicado: false,
      instanciaSelecionada: null,
      leadMatch: null,
      semMatch: true,
    };

    expect(marcarChatComoLidoLocalmente(chat)).toEqual({
      ...chat,
      unreadCount: 0,
    });
  });
});
