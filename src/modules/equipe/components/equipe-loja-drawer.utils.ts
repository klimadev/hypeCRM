import type { DadosEdicao, Funcionario, ErrosEdicao } from "../types";

export type OrdenacaoLoja = "nome" | "email" | "cargo" | "status";
export type DirecaoOrdenacaoLoja = "asc" | "desc";

export type FuncionarioLojaItem = {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  ativo: boolean;
};

export type ErrosCadastroLoja = {
  nome?: string;
  email?: string;
  senha?: string;
};

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function criarFuncionariosDaLoja(funcionarios: Funcionario[], lojaId?: string | null): FuncionarioLojaItem[] {
  return funcionarios
    .filter((funcionario) => funcionario.pdv?.id === lojaId || funcionario.Pdv?.id === lojaId)
    .map((funcionario) => ({
      id: funcionario.id,
      nome: funcionario.nome,
      cargo: funcionario.cargo,
      email: funcionario.email,
      ativo: funcionario.ativo,
    }));
}

export function filtrarFuncionariosDaLoja(funcionarios: FuncionarioLojaItem[], busca: string) {
  const termo = busca.trim().toLowerCase();
  if (!termo) {
    return funcionarios;
  }

  return funcionarios.filter((funcionario) => {
    const alvo = `${funcionario.nome} ${funcionario.email} ${funcionario.cargo}`.toLowerCase();
    return alvo.includes(termo);
  });
}

export function ordenarFuncionariosDaLoja(
  funcionarios: FuncionarioLojaItem[],
  ordenacao: OrdenacaoLoja,
  direcao: DirecaoOrdenacaoLoja,
) {
  const lista = [...funcionarios];
  lista.sort((a, b) => {
    const valorA = ordenacao === "status" ? (a.ativo ? "ATIVO" : "INATIVO") : a[ordenacao];
    const valorB = ordenacao === "status" ? (b.ativo ? "ATIVO" : "INATIVO") : b[ordenacao];
    const comparacao = String(valorA ?? "").localeCompare(String(valorB ?? ""), "pt-BR", {
      sensitivity: "base",
    });
    return direcao === "asc" ? comparacao : -comparacao;
  });
  return lista;
}

export function proximaOrdenacaoLoja(
  ordenacaoAtual: OrdenacaoLoja,
  direcaoAtual: DirecaoOrdenacaoLoja,
  campo: OrdenacaoLoja,
) {
  if (ordenacaoAtual === campo) {
    return {
      ordenacao: ordenacaoAtual,
      direcao: direcaoAtual === "asc" ? "desc" : "asc",
    } satisfies { ordenacao: OrdenacaoLoja; direcao: DirecaoOrdenacaoLoja };
  }

  return {
    ordenacao: campo,
    direcao: "asc",
  } satisfies { ordenacao: OrdenacaoLoja; direcao: DirecaoOrdenacaoLoja };
}

export function validarDadosEdicaoLoja(dados: DadosEdicao): ErrosEdicao {
  const erros: ErrosEdicao = {};

  if (!dados.nome.trim() || dados.nome.trim().length < 2) {
    erros.nome = "Nome deve ter ao menos 2 caracteres.";
  }

  if (!dados.email.trim() || !REGEX_EMAIL.test(dados.email.trim())) {
    erros.email = "E-mail invalido.";
  }

  return erros;
}

export function validarNovoFuncionarioLoja(dados: { nome: string; email: string; senha: string }): ErrosCadastroLoja {
  const erros: ErrosCadastroLoja = {};

  if (!dados.nome.trim() || dados.nome.trim().length < 2) {
    erros.nome = "Nome deve ter ao menos 2 caracteres";
  }

  if (!dados.email.trim() || !REGEX_EMAIL.test(dados.email.trim())) {
    erros.email = "E-mail invalido";
  }

  if (!dados.senha || dados.senha.length < 4) {
    erros.senha = "Senha deve ter ao menos 4 caracteres";
  }

  return erros;
}

export function nomeCargoEquipe(cargo: string) {
  const mapa: Record<string, string> = {
    COLABORADOR: "Vendedor",
    GERENTE: "Gerente",
    ADMINISTRADOR: "Admin",
  };

  return mapa[cargo] ?? cargo;
}
