import { prisma } from "@/lib/prisma";
import type { FiltroAcessoEmpresaFuncionario } from "@/lib/negocios.types";
import { carregarNegociosResumo } from "@/lib/negocios.queries";
import { criarResultadoFunilVazio } from "@/lib/negocios.funnels.utils";

export async function listarFunisDaEmpresa(idEmpresa: string) {
  return prisma.funil.findMany({
    where: { id_empresa: idEmpresa, ativo: true },
    orderBy: [{ padrao: "desc" }, { ordem: "asc" }, { nome: "asc" }],
  });
}

export async function obterFunilPadrao(idEmpresa: string) {
  return prisma.funil.findFirst({
    where: { id_empresa: idEmpresa, ativo: true },
    orderBy: [{ padrao: "desc" }, { ordem: "asc" }, { criado_em: "asc" }],
  });
}

export async function listarEstagiosDoFunil(idEmpresa: string, idFunil?: string) {
  const funil = idFunil
    ? await prisma.funil.findFirst({
        where: { id: idFunil, id_empresa: idEmpresa, ativo: true },
      })
    : await obterFunilPadrao(idEmpresa);

  if (!funil) {
    return criarResultadoFunilVazio();
  }

  const estagios = await prisma.estagioFunil.findMany({
    where: {
      id_empresa: idEmpresa,
      id_funil: funil.id,
    },
    orderBy: { ordem: "asc" },
  });

  return { funil, estagios };
}

export async function listarNegociosKanban(params: {
  sessao: {
    id_empresa: string;
  };
  where: FiltroAcessoEmpresaFuncionario;
  idFunil?: string;
}) {
  const { funil, estagios } = await listarEstagiosDoFunil(params.sessao.id_empresa, params.idFunil);

  const negocios = await carregarNegociosResumo(prisma, {
    idEmpresa: params.sessao.id_empresa,
    where: params.where,
    idFunil: funil ? funil.id : undefined,
  });

  return { funil, estagios, negocios };
}
