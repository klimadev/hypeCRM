import type {
  FiltrosFuncionariosRoute,
  PayloadAcaoLoteFuncionarios,
  PayloadCriacaoFuncionario,
  PayloadCriacaoFuncionarioBruto,
  SessaoFuncionariosRoute,
} from "./route.types";

type WhereBaseFuncionariosParams = {
  idEmpresa: string;
  cargo: FiltrosFuncionariosRoute["cargo"];
  busca: string | null;
  idPdvSessao: string | null;
  idPdvFiltroEmpresa: string | null;
};

export function obterIdPdvRestritoPorSessao(sessao: Pick<SessaoFuncionariosRoute, "perfil" | "id_pdv">) {
  return sessao.perfil === "GERENTE" ? sessao.id_pdv : null;
}

export function deveBloquearFiltroPdvGerente(idPdvSessao: string | null, idPdvFiltro?: string | null) {
  return Boolean(idPdvSessao && idPdvFiltro && idPdvFiltro !== idPdvSessao);
}

export function criarWhereBaseFuncionarios({
  idEmpresa,
  cargo,
  busca,
  idPdvSessao,
  idPdvFiltroEmpresa,
}: WhereBaseFuncionariosParams) {
  return {
    id_empresa: idEmpresa,
    ...(cargo !== "TODOS" ? { cargo } : {}),
    ...(idPdvSessao ? { id_pdv: idPdvSessao } : {}),
    ...(idPdvFiltroEmpresa ? { id_pdv: idPdvFiltroEmpresa } : {}),
    ...(busca
      ? {
          OR: [
            { nome: { contains: busca } },
            { email: { contains: busca } },
            { cargo: { contains: busca } },
            { Pdv: { is: { nome: { contains: busca } } } },
          ],
        }
      : {}),
  };
}

export function criarWhereFuncionarios(
  whereBase: ReturnType<typeof criarWhereBaseFuncionarios>,
  status: FiltrosFuncionariosRoute["status"],
) {
  return {
    ...whereBase,
    ...(status !== "TODOS" ? { ativo: status === "ATIVO" } : {}),
  };
}

export function criarOrderByFuncionarios(
  ordenarPor: FiltrosFuncionariosRoute["ordenar_por"],
  direcao: FiltrosFuncionariosRoute["direcao"],
) {
  const orderByMap = {
    nome: { nome: direcao },
    email: { email: direcao },
    cargo: { cargo: direcao },
    status: { ativo: direcao === "asc" ? "desc" : "asc" },
    pdv: { Pdv: { nome: direcao } },
    criado_em: { criado_em: direcao },
  } as const;

  return orderByMap[ordenarPor];
}

export function validarPayloadCriacaoFuncionario(body: PayloadCriacaoFuncionarioBruto):
  | { ok: true; data: PayloadCriacaoFuncionario }
  | { ok: false; erro: string } {
  const nome = body.nome?.trim();
  const email = body.email?.trim().toLowerCase();
  const senha = body.senha;
  const cargo = body.cargo;
  const id_pdv = body.id_pdv;

  if (!nome || !email || !senha || !cargo || !id_pdv) {
    return { ok: false, erro: "Preencha todos os campos." };
  }

  return {
    ok: true,
    data: {
      nome,
      email,
      senha,
      cargo,
      id_pdv,
    },
  };
}

export function validarPrecondicoesAcaoLoteFuncionario(
  payload: Pick<PayloadAcaoLoteFuncionarios, "acao" | "cargo" | "id_pdv" | "id_funcionario_destino">,
) {
  if (payload.acao === "ALTERAR_CARGO" && !payload.cargo) {
    return { ok: false as const, erro: "Cargo obrigatorio para esta acao." };
  }

  if (payload.acao === "ALTERAR_PDV" && !payload.id_pdv) {
    return { ok: false as const, erro: "PDV obrigatorio para esta acao." };
  }

  if (payload.acao === "INATIVAR" && !payload.id_funcionario_destino) {
    return { ok: false as const, erro: "Destino obrigatorio para inativacao em lote." };
  }

  return { ok: true as const };
}
