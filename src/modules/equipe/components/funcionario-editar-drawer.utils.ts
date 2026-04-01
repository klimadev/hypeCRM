import type { DadosEdicao, ErrosEdicao, Funcionario } from "../types";

export function criarDadosEdicaoFuncionario(funcionario: Funcionario): DadosEdicao {
  return {
    nome: funcionario.nome,
    email: funcionario.email,
    cargo: funcionario.cargo,
    id_pdv: funcionario.pdv?.id ?? funcionario.Pdv?.id ?? "",
  };
}

export function validarDadosFuncionarioEdicao(dados: DadosEdicao): ErrosEdicao {
  const erros: ErrosEdicao = {};

  if (!dados.nome.trim() || dados.nome.trim().length < 2) {
    erros.nome = "Nome deve ter ao menos 2 caracteres.";
  }

  if (!dados.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim())) {
    erros.email = "E-mail inválido.";
  }

  if (!dados.id_pdv.trim()) {
    erros.id_pdv = "PDV obrigatório.";
  }

  return erros;
}

export function getCargoLabelFuncionario(cargo: string) {
  const labels: Record<string, string> = {
    COLABORADOR: "Colaborador",
    GERENTE: "Gerente",
    ADMINISTRADOR: "Administrador",
  };

  return labels[cargo] || cargo;
}

export function getIniciaisFuncionario(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getIndiceCorAvatarFuncionario(nome: string, totalCores: number) {
  return nome.charCodeAt(0) % totalCores;
}
