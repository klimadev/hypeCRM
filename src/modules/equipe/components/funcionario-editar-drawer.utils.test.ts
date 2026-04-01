import { describe, expect, it } from "vitest";
import {
  criarDadosEdicaoFuncionario,
  getCargoLabelFuncionario,
  getIniciaisFuncionario,
  validarDadosFuncionarioEdicao,
} from "./funcionario-editar-drawer.utils";

describe("criarDadosEdicaoFuncionario", () => {
  it("monta os dados iniciais do drawer a partir do funcionario", () => {
    expect(
      criarDadosEdicaoFuncionario({
        id: "1",
        nome: "Maria da Silva",
        email: "maria@empresa.com",
        cargo: "GERENTE",
        ativo: true,
        pdv: { id: "pdv-1", nome: "Centro" },
      }),
    ).toEqual({
      nome: "Maria da Silva",
      email: "maria@empresa.com",
      cargo: "GERENTE",
      id_pdv: "pdv-1",
    });
  });
});

describe("validarDadosFuncionarioEdicao", () => {
  it("retorna erros quando nome, email ou pdv sao invalidos", () => {
    expect(
      validarDadosFuncionarioEdicao({
        nome: "A",
        email: "email-invalido",
        cargo: "COLABORADOR",
        id_pdv: "",
      }),
    ).toEqual({
      nome: "Nome deve ter ao menos 2 caracteres.",
      email: "E-mail inválido.",
      id_pdv: "PDV obrigatório.",
    });
  });

  it("nao retorna erros quando os dados sao validos", () => {
    expect(
      validarDadosFuncionarioEdicao({
        nome: "Maria da Silva",
        email: "maria@empresa.com",
        cargo: "COLABORADOR",
        id_pdv: "pdv-1",
      }),
    ).toEqual({});
  });
});

describe("getCargoLabelFuncionario", () => {
  it("traduz os cargos conhecidos", () => {
    expect(getCargoLabelFuncionario("COLABORADOR")).toBe("Colaborador");
    expect(getCargoLabelFuncionario("GERENTE")).toBe("Gerente");
    expect(getCargoLabelFuncionario("ADMINISTRADOR")).toBe("Administrador");
    expect(getCargoLabelFuncionario("OPERACOES")).toBe("OPERACOES");
  });
});

describe("getIniciaisFuncionario", () => {
  it("gera ate duas iniciais em caixa alta", () => {
    expect(getIniciaisFuncionario("Maria da Silva")).toBe("MD");
    expect(getIniciaisFuncionario("Joao")).toBe("J");
  });
});
