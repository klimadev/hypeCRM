import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  obterSessaoNoServidorMock,
  validarSuperAdminMock,
  empresaFindUniqueMock,
  empresaUpdateMock,
  funcionarioFindUniqueMock,
  funcionarioUpdateMock,
  bcryptHashMock,
} = vi.hoisted(() => ({
  obterSessaoNoServidorMock: vi.fn(),
  validarSuperAdminMock: vi.fn(),
  empresaFindUniqueMock: vi.fn(),
  empresaUpdateMock: vi.fn(),
  funcionarioFindUniqueMock: vi.fn(),
  funcionarioUpdateMock: vi.fn(),
  bcryptHashMock: vi.fn(),
}));

vi.mock("@/lib/autenticacao", () => ({
  obterSessaoNoServidor: obterSessaoNoServidorMock,
  validarSuperAdmin: validarSuperAdminMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    empresa: {
      findUnique: empresaFindUniqueMock,
      update: empresaUpdateMock,
    },
    funcionario: {
      findUnique: funcionarioFindUniqueMock,
      update: funcionarioUpdateMock,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: bcryptHashMock,
  },
}));

import { PUT } from "./route";

describe("PUT /api/super-admin/usuarios/[id]/senha", () => {
  it("atualiza a senha da empresa quando o registro existe", async () => {
    obterSessaoNoServidorMock.mockResolvedValue({ id_usuario: "admin-1" });
    validarSuperAdminMock.mockResolvedValue(true);
    empresaFindUniqueMock.mockResolvedValue({ id: "empresa-1" });
    funcionarioFindUniqueMock.mockResolvedValue(null);
    bcryptHashMock.mockResolvedValue("hash-novo");

    const response = await PUT(
      new NextRequest("http://localhost:3434/api/super-admin/usuarios/empresa-1/senha", {
        method: "PUT",
        body: JSON.stringify({ novaSenha: "senha123", tipo: "empresa" }),
      }),
      { params: Promise.resolve({ id: "empresa-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(empresaUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "empresa-1" },
        data: expect.objectContaining({ senha_hash: "hash-novo" }),
      }),
    );
    expect(funcionarioUpdateMock).not.toHaveBeenCalled();
  });

  it("faz fallback para funcionario quando o tipo informado nao corresponde ao registro", async () => {
    obterSessaoNoServidorMock.mockResolvedValue({ id_usuario: "admin-1" });
    validarSuperAdminMock.mockResolvedValue(true);
    empresaFindUniqueMock.mockResolvedValue(null);
    funcionarioFindUniqueMock.mockResolvedValue({ id: "func-1" });
    bcryptHashMock.mockResolvedValue("hash-novo");

    const response = await PUT(
      new NextRequest("http://localhost:3434/api/super-admin/usuarios/func-1/senha", {
        method: "PUT",
        body: JSON.stringify({ novaSenha: "senha123", tipo: "empresa" }),
      }),
      { params: Promise.resolve({ id: "func-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(empresaUpdateMock).not.toHaveBeenCalled();
    expect(funcionarioUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "func-1" },
        data: expect.objectContaining({ senha_hash: "hash-novo" }),
      }),
    );
  });

  it("retorna 404 quando o usuario nao existe em nenhuma tabela", async () => {
    obterSessaoNoServidorMock.mockResolvedValue({ id_usuario: "admin-1" });
    validarSuperAdminMock.mockResolvedValue(true);
    empresaFindUniqueMock.mockResolvedValue(null);
    funcionarioFindUniqueMock.mockResolvedValue(null);
    bcryptHashMock.mockResolvedValue("hash-novo");

    const response = await PUT(
      new NextRequest("http://localhost:3434/api/super-admin/usuarios/inexistente/senha", {
        method: "PUT",
        body: JSON.stringify({ novaSenha: "senha123", tipo: "funcionario" }),
      }),
      { params: Promise.resolve({ id: "inexistente" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ erro: "Usuario nao encontrado" });
  });
});
