export type SessaoFuncionariosRoute = {
  id_usuario: string;
  id_empresa: string;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  id_pdv: string | null;
};

export type FiltrosFuncionariosRoute = {
  busca?: string;
  status: "ATIVO" | "INATIVO" | "TODOS";
  cargo: "COLABORADOR" | "GERENTE" | "ADMINISTRADOR" | "TODOS";
  id_pdv?: string;
  ordenar_por: "nome" | "email" | "cargo" | "status" | "pdv" | "criado_em";
  direcao: "asc" | "desc";
  pagina: number;
  por_pagina: number;
};

export type FuncionarioListagemItem = {
  id: string;
  nome?: string;
  id_pdv: string;
  ativo: boolean;
  cargo: string;
  Pdv: { id: string; nome: string };
};

export type FuncionarioAcaoLoteItem = {
  id: string;
  nome: string;
  cargo: string;
  id_pdv: string;
  ativo: boolean;
};

export type DestinoInativacaoFuncionario = {
  id: string;
  nome: string;
  id_pdv: string;
  cargo: string;
};

export type PayloadCriacaoFuncionarioBruto = {
  nome?: string;
  email?: string;
  senha?: string;
  cargo?: string;
  id_pdv?: string;
};

export type PayloadCriacaoFuncionario = {
  nome: string;
  email: string;
  senha: string;
  cargo: string;
  id_pdv: string;
};

export type PayloadAcaoLoteFuncionarios = {
  acao: "ATIVAR" | "ALTERAR_CARGO" | "ALTERAR_PDV" | "INATIVAR";
  ids: string[];
  cargo?: string;
  id_pdv?: string;
  id_funcionario_destino?: string;
  observacao?: string;
};

export type ResultadoAcaoLoteFuncionarios = {
  processados: number;
  atualizados: number;
  falhas: Array<{ id: string; motivo: string }>;
};
