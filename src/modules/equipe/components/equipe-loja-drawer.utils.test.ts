import { describe, expect, it } from "vitest";
import {
  criarFuncionariosDaLoja,
  filtrarFuncionariosDaLoja,
  ordenarFuncionariosDaLoja,
  type FuncionarioLojaItem,
  validarDadosEdicaoLoja,
  validarNovoFuncionarioLoja,
} from "./equipe-loja-drawer.utils";

const funcionariosBase = [
  {
    id: "1",
    nome: "Marina Souza",
    cargo: "GERENTE",
    email: "marina@crm.test",
    ativo: true,
    pdv: { id: "pdv-1", nome: "Centro" },
  },
  {
    id: "2",
    nome: "Caio Lima",
    cargo: "COLABORADOR",
    email: "caio@crm.test",
    ativo: false,
    Pdv: { id: "pdv-1", nome: "Centro" },
  },
  {
    id: "3",
    nome: "Ana Prado",
    cargo: "COLABORADOR",
    email: "ana@crm.test",
    ativo: true,
    pdv: { id: "pdv-2", nome: "Zona Sul" },
  },
];

describe("criarFuncionariosDaLoja", () => {
  it("mantem apenas funcionarios da loja selecionada", () => {
    expect(criarFuncionariosDaLoja(funcionariosBase, "pdv-1")).toEqual<FuncionarioLojaItem[]>([
      {
        id: "1",
        nome: "Marina Souza",
        cargo: "GERENTE",
        email: "marina@crm.test",
        ativo: true,
      },
      {
        id: "2",
        nome: "Caio Lima",
        cargo: "COLABORADOR",
        email: "caio@crm.test",
        ativo: false,
      },
    ]);
  });
});

describe("filtrarFuncionariosDaLoja", () => {
  it("busca por nome, email e cargo", () => {
    const itens = criarFuncionariosDaLoja(funcionariosBase, "pdv-1");

    expect(filtrarFuncionariosDaLoja(itens, "marina")).toHaveLength(1);
    expect(filtrarFuncionariosDaLoja(itens, "crm.test")).toHaveLength(2);
    expect(filtrarFuncionariosDaLoja(itens, "gerente")).toHaveLength(1);
  });
});

describe("ordenarFuncionariosDaLoja", () => {
  it("ordena por status desc", () => {
    const itens = criarFuncionariosDaLoja(funcionariosBase, "pdv-1");

    expect(ordenarFuncionariosDaLoja(itens, "status", "desc").map((item) => item.id)).toEqual(["2", "1"]);
  });
});

describe("validarDadosEdicaoLoja", () => {
  it("retorna erros para nome e email invalidos", () => {
    expect(validarDadosEdicaoLoja({ nome: "A", email: "email-invalido", cargo: "COLABORADOR", id_pdv: "pdv-1" })).toEqual({
      nome: "Nome deve ter ao menos 2 caracteres.",
      email: "E-mail invalido.",
    });
  });
});

describe("validarNovoFuncionarioLoja", () => {
  it("retorna erros para cadastro incompleto", () => {
    expect(validarNovoFuncionarioLoja({ nome: "", email: "x", senha: "1" })).toEqual({
      nome: "Nome deve ter ao menos 2 caracteres",
      email: "E-mail invalido",
      senha: "Senha deve ter ao menos 4 caracteres",
    });
  });
});
