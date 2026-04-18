import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  exigirSessaoMock,
  whereNegociosPorPerfilMock,
  obterNegocioPorIdMock,
  atualizarNegocioMock,
  montarDtoNegocioMock,
  funcionarioFindFirstMock,
  produtoFindFirstMock,
} = vi.hoisted(() => ({
  exigirSessaoMock: vi.fn(),
  whereNegociosPorPerfilMock: vi.fn(),
  obterNegocioPorIdMock: vi.fn(),
  atualizarNegocioMock: vi.fn(),
  montarDtoNegocioMock: vi.fn(),
  funcionarioFindFirstMock: vi.fn(),
  produtoFindFirstMock: vi.fn(),
}));

vi.mock("@/lib/permissoes", () => ({
  exigirSessao: exigirSessaoMock,
  whereNegociosPorPerfil: whereNegociosPorPerfilMock,
  podeGerenciarRecursoNoPdv: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/negocios", () => ({
  obterNegocioPorId: obterNegocioPorIdMock,
  atualizarNegocio: atualizarNegocioMock,
  montarDtoNegocio: montarDtoNegocioMock,
  desativarNegocio: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    funcionario: {
      findFirst: funcionarioFindFirstMock,
    },
    produto: {
      findFirst: produtoFindFirstMock,
    },
  },
}));

import { PATCH } from "./route";

describe("PATCH /api/negocios/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    exigirSessaoMock.mockResolvedValue({
      sessao: {
        id_usuario: "user-1",
        id_empresa: "empresa-1",
        id_pdv: "pdv-1",
        perfil: "GERENTE",
      },
      erro: null,
    });
    whereNegociosPorPerfilMock.mockResolvedValue({ id_empresa: "empresa-1" });
    obterNegocioPorIdMock.mockResolvedValue({ id: "negocio-1" });
    atualizarNegocioMock.mockResolvedValue({ id: "negocio-1", id_produto_principal: "produto-1" });
    montarDtoNegocioMock.mockImplementation((negocio) => negocio);
    funcionarioFindFirstMock.mockResolvedValue(null);
    produtoFindFirstMock.mockResolvedValue({ id: "produto-1" });
  });

  it("encaminha id_produto_principal ao atualizar negocio", async () => {
    const request = new NextRequest("http://localhost:3434/api/negocios/negocio-1", {
      method: "PATCH",
      body: JSON.stringify({ id_produto_principal: "produto-1" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "negocio-1" }) });

    expect(response.status).toBe(200);
    expect(produtoFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: "produto-1",
        id_empresa: "empresa-1",
      },
      select: { id: true },
    });
    expect(atualizarNegocioMock).toHaveBeenCalledWith({
      idEmpresa: "empresa-1",
      idNegocio: "negocio-1",
      titulo: undefined,
      valorEstimado: undefined,
      valorFechado: undefined,
      probabilidade: undefined,
      motivoPerda: undefined,
      idFuncionario: undefined,
      idFunil: undefined,
      idEstagio: undefined,
      status: undefined,
      observacoesComerciais: undefined,
      idProdutoPrincipal: "produto-1",
    });
  });

  it("permite limpar o produto principal do negocio", async () => {
    const request = new NextRequest("http://localhost:3434/api/negocios/negocio-1", {
      method: "PATCH",
      body: JSON.stringify({ id_produto_principal: null }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "negocio-1" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(produtoFindFirstMock).not.toHaveBeenCalled();
    expect(atualizarNegocioMock).toHaveBeenCalledWith(expect.objectContaining({
      idProdutoPrincipal: null,
    }));
    expect(json).toEqual({ negocio: { id: "negocio-1", id_produto_principal: "produto-1" } });
  });

  it("retorna erro quando o produto informado nao existe", async () => {
    produtoFindFirstMock.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3434/api/negocios/negocio-1", {
      method: "PATCH",
      body: JSON.stringify({ id_produto_principal: "produto-invalido" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "negocio-1" }) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ erro: "Produto invalido." });
    expect(atualizarNegocioMock).not.toHaveBeenCalled();
  });
});
