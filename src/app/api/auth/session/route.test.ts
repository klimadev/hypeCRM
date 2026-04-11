import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  obterSessaoNaRequestMock,
  obterDadosUsuarioLogadoMock,
  verificarUsuarioExisteMock,
} = vi.hoisted(() => ({
  obterSessaoNaRequestMock: vi.fn(),
  obterDadosUsuarioLogadoMock: vi.fn(),
  verificarUsuarioExisteMock: vi.fn(),
}));

vi.mock("@/lib/autenticacao", () => ({
  obterSessaoNaRequest: obterSessaoNaRequestMock,
  obterDadosUsuarioLogado: obterDadosUsuarioLogadoMock,
}));

vi.mock("@/lib/permissoes", () => ({
  verificarUsuarioExiste: verificarUsuarioExisteMock,
}));

import { GET } from "@/app/api/auth/session/route";

describe("GET /api/auth/session", () => {
  it("retorna sessao do usuario quando autenticacao e valida", async () => {
    // Arrange
    const request = new NextRequest("http://localhost:3434/api/auth/session");
    obterSessaoNaRequestMock.mockResolvedValue({
      id_usuario: "user-1",
      id_empresa: "empresa-1",
      id_pdv: "pdv-1",
      perfil: "GERENTE",
    });
    verificarUsuarioExisteMock.mockResolvedValue(true);
    obterDadosUsuarioLogadoMock.mockResolvedValue({ nome: "Maria", email: "maria@hypecrm.com" });

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id_usuario: "user-1",
      id_empresa: "empresa-1",
      id_pdv: "pdv-1",
      nome: "Maria",
      email: "maria@hypecrm.com",
      perfil: "GERENTE",
    });
  });

  it("retorna 401 quando nao existe sessao", async () => {
    // Arrange
    const request = new NextRequest("http://localhost:3434/api/auth/session");
    obterSessaoNaRequestMock.mockResolvedValue(null);

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toBeNull();
  });

  it("retorna 401 quando sessao existe mas usuario nao foi encontrado", async () => {
    // Arrange
    const request = new NextRequest("http://localhost:3434/api/auth/session");
    obterSessaoNaRequestMock.mockResolvedValue({
      id_usuario: "user-1",
      id_empresa: "empresa-1",
      id_pdv: "pdv-1",
      perfil: "GERENTE",
    });
    verificarUsuarioExisteMock.mockResolvedValue(false);

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toBeNull();
  });

  it("retorna 401 quando usuario existe mas dados nao podem ser carregados", async () => {
    // Arrange
    const request = new NextRequest("http://localhost:3434/api/auth/session");
    obterSessaoNaRequestMock.mockResolvedValue({
      id_usuario: "user-1",
      id_empresa: "empresa-1",
      id_pdv: "pdv-1",
      perfil: "GERENTE",
    });
    verificarUsuarioExisteMock.mockResolvedValue(true);
    obterDadosUsuarioLogadoMock.mockResolvedValue(null);

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toBeNull();
  });
});
