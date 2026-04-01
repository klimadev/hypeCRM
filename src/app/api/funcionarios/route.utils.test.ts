import { describe, expect, it } from "vitest";
import {
  criarOrderByFuncionarios,
  criarWhereBaseFuncionarios,
  criarWhereFuncionarios,
  deveBloquearFiltroPdvGerente,
  obterIdPdvRestritoPorSessao,
  validarPayloadCriacaoFuncionario,
  validarPrecondicoesAcaoLoteFuncionario,
} from "./route.utils";

describe("obterIdPdvRestritoPorSessao", () => {
  it("usa o PDV do gerente", () => {
    expect(obterIdPdvRestritoPorSessao({ perfil: "GERENTE", id_pdv: "pdv-1" })).toBe("pdv-1");
  });

  it("nao restringe perfis da empresa", () => {
    expect(obterIdPdvRestritoPorSessao({ perfil: "EMPRESA", id_pdv: null })).toBeNull();
  });
});

describe("deveBloquearFiltroPdvGerente", () => {
  it("bloqueia quando gerente tenta consultar outro PDV", () => {
    expect(deveBloquearFiltroPdvGerente("pdv-1", "pdv-2")).toBe(true);
  });

  it("permite quando filtro bate com o PDV da sessao", () => {
    expect(deveBloquearFiltroPdvGerente("pdv-1", "pdv-1")).toBe(false);
  });
});

describe("criarWhereFuncionarios", () => {
  it("aplica busca, cargo, status e restricao por PDV do gerente", () => {
    const whereBase = criarWhereBaseFuncionarios({
      idEmpresa: "emp-1",
      cargo: "COLABORADOR",
      busca: "maria",
      idPdvSessao: "pdv-1",
      idPdvFiltroEmpresa: null,
    });

    const where = criarWhereFuncionarios(whereBase, "ATIVO");

    expect(where).toMatchObject({
      id_empresa: "emp-1",
      cargo: "COLABORADOR",
      id_pdv: "pdv-1",
      ativo: true,
    });
    expect(where.OR).toHaveLength(4);
  });
});

describe("criarOrderByFuncionarios", () => {
  it("inverte ordenacao de status para priorizar ativos", () => {
    expect(criarOrderByFuncionarios("status", "asc")).toEqual({ ativo: "desc" });
  });

  it("ordena por PDV usando relacao", () => {
    expect(criarOrderByFuncionarios("pdv", "desc")).toEqual({ Pdv: { nome: "desc" } });
  });
});

describe("validarPayloadCriacaoFuncionario", () => {
  it("normaliza nome e email", () => {
    expect(
      validarPayloadCriacaoFuncionario({
        nome: " Maria ",
        email: " TESTE@EMPRESA.COM ",
        senha: "123456",
        cargo: "COLABORADOR",
        id_pdv: "pdv-1",
      }),
    ).toEqual({
      ok: true,
      data: {
        nome: "Maria",
        email: "teste@empresa.com",
        senha: "123456",
        cargo: "COLABORADOR",
        id_pdv: "pdv-1",
      },
    });
  });

  it("falha quando faltam campos obrigatorios", () => {
    expect(validarPayloadCriacaoFuncionario({ nome: "", email: "a", senha: "", cargo: "", id_pdv: "" })).toEqual({
      ok: false,
      erro: "Preencha todos os campos.",
    });
  });
});

describe("validarPrecondicoesAcaoLoteFuncionario", () => {
  it("exige cargo para alterar cargo", () => {
    expect(validarPrecondicoesAcaoLoteFuncionario({ acao: "ALTERAR_CARGO" })).toEqual({
      ok: false,
      erro: "Cargo obrigatorio para esta acao.",
    });
  });

  it("aceita payload valido para inativacao", () => {
    expect(
      validarPrecondicoesAcaoLoteFuncionario({
        acao: "INATIVAR",
        id_funcionario_destino: "func-2",
      }),
    ).toEqual({ ok: true });
  });
});
