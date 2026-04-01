import { describe, expect, it } from "vitest";
import {
  extrairTelefoneDeRemoteJid,
  formatarPreviewMensagem,
  mapearStatusMensagemCru,
  normalizarRemoteJid,
  normalizarTimestampParaIso,
  traduzirTipoMensagem,
} from "@/lib/whatsapp-utils";

describe("traduzirTipoMensagem", () => {
  it("traduz tipo conhecido e fallback desconhecido", () => {
    expect(traduzirTipoMensagem("imageMessage")).toBe("Imagem");
    expect(traduzirTipoMensagem("nao-existe")).toBe("Desconhecido");
  });
});

describe("normalizarTimestampParaIso", () => {
  it("aceita timestamp em segundos", () => {
    expect(normalizarTimestampParaIso(1710000000)).toContain("2024");
  });
});

describe("formatarPreviewMensagem", () => {
  it("usa texto quando presente e fallback por tipo quando ausente", () => {
    expect(formatarPreviewMensagem("conversation", " Olá ")).toBe("Olá");
    expect(formatarPreviewMensagem("imageMessage", "")).toBe("[Imagem]");
  });
});

describe("mapearStatusMensagemCru", () => {
  it("converte status bruto para status do chat", () => {
    expect(mapearStatusMensagemCru("read", true)).toBe("READ");
    expect(mapearStatusMensagemCru(undefined, false)).toBe("DELIVERED");
  });
});

describe("jid utils", () => {
  it("normaliza jid e extrai telefone", () => {
    expect(normalizarRemoteJid("5511999999999@lid")).toBe("5511999999999@s.whatsapp.net");
    expect(extrairTelefoneDeRemoteJid("5511999999999@s.whatsapp.net")).toBe("5511999999999");
  });
});
