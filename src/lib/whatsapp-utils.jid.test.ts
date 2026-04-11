import { describe, expect, it } from "vitest";

import {
  ehGrupo,
  ehStatusBroadcast,
  extrairTelefoneDeRemoteJid,
  normalizarRemoteJid,
} from "@/lib/whatsapp-utils.jid";

describe("normalizarRemoteJid", () => {
  it("normaliza sufixo @lid para @s.whatsapp.net", () => {
    // Arrange
    const input = "5511999999999@lid";

    // Act
    const result = normalizarRemoteJid(input);

    // Assert
    expect(result).toBe("5511999999999@s.whatsapp.net");
  });

  it("retorna string vazia para entrada nula", () => {
    // Arrange
    const input = null;

    // Act
    const result = normalizarRemoteJid(input);

    // Assert
    expect(result).toBe("");
  });
});

describe("extrairTelefoneDeRemoteJid", () => {
  it("extrai apenas dígitos de jid padrão", () => {
    // Arrange
    const input = "55-11-98765-4321@s.whatsapp.net";

    // Act
    const result = extrairTelefoneDeRemoteJid(input);

    // Assert
    expect(result).toBe("5511987654321");
  });

  it("retorna vazio para entrada undefined", () => {
    // Arrange
    const input = undefined;

    // Act
    const result = extrairTelefoneDeRemoteJid(input);

    // Assert
    expect(result).toBe("");
  });
});

describe("ehGrupo", () => {
  it("retorna true para jid de grupo", () => {
    // Arrange
    const input = "123456@g.us";

    // Act
    const result = ehGrupo(input);

    // Assert
    expect(result).toBe(true);
  });

  it("retorna false para jid de contato comum", () => {
    // Arrange
    const input = "5511999999999@s.whatsapp.net";

    // Act
    const result = ehGrupo(input);

    // Assert
    expect(result).toBe(false);
  });
});

describe("ehStatusBroadcast", () => {
  it("retorna true para status@broadcast", () => {
    // Arrange
    const input = "status@broadcast";

    // Act
    const result = ehStatusBroadcast(input);

    // Assert
    expect(result).toBe(true);
  });

  it("retorna false para outros jids", () => {
    // Arrange
    const input = "status@g.us";

    // Act
    const result = ehStatusBroadcast(input);

    // Assert
    expect(result).toBe(false);
  });
});
