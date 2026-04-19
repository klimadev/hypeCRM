import { describe, expect, it } from "vitest";
import { formatarPreviewChat, formatarDuracaoSegundos } from "./preview";

describe("formatarPreviewChat", () => {
  it("mostra texto puro em mensagens de texto", () => {
    expect(
      formatarPreviewChat({
        conteudo: "Olá, tudo certo?",
        fromMe: true,
        kind: "text",
      }),
    ).toBe("Você: Olá, tudo certo?");
  });

  it("mostra o nome do arquivo em documentos", () => {
    expect(
      formatarPreviewChat({
        conteudo: "[Arquivo: contrato.pdf]",
        fromMe: false,
        kind: "documentMessage",
      }),
    ).toBe("📄 contrato.pdf");
  });

  it("mostra a duracao em audios", () => {
    expect(
      formatarPreviewChat({
        conteudo: "",
        fromMe: true,
        kind: "audioMessage",
        seconds: 125,
      }),
    ).toBe("Você: 🎙 2:05");
  });

  it("mostra apenas o indicador em imagens", () => {
    expect(
      formatarPreviewChat({
        conteudo: "📷 Produto novo",
        fromMe: false,
        kind: "imageMessage",
      }),
    ).toBe("📷 Imagem");
  });

  it("mostra apenas o indicador em videos", () => {
    expect(
      formatarPreviewChat({
        conteudo: "",
        fromMe: false,
        kind: "videoMessage",
      }),
    ).toBe("🎥 Vídeo");
  });
});

describe("formatarDuracaoSegundos", () => {
  it("formata minutos e segundos", () => {
    expect(formatarDuracaoSegundos(42)).toBe("0:42");
  });

  it("formata horas quando necessario", () => {
    expect(formatarDuracaoSegundos(3723)).toBe("1:02:03");
  });
});
