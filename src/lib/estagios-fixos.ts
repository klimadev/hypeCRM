import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const NOME_ESTAGIO_INDEFINIDO = "Indefinido" as const;

export const ESTAGIOS_FIXOS_PADRAO = [
  { nome: "Indefinido", tipo: "ABERTO", ordem: 1 },
  { nome: "Em Atendimento", tipo: "ABERTO", ordem: 2 },
  { nome: "Proposta Enviada", tipo: "ABERTO", ordem: 3 },
  { nome: "Pré Aprovação", tipo: "ABERTO", ordem: 4 },
  { nome: "Fechado", tipo: "GANHO", ordem: 5 },
  { nome: "Pós Vendas", tipo: "GANHO", ordem: 6 },
  { nome: "Perdido", tipo: "PERDIDO", ordem: 7 },
] as const;

type EstagioFunilBasico = {
  id: string;
  id_empresa: string;
  id_funil: string;
  nome: string;
  ordem: bigint;
  tipo: string;
  criado_em: Date;
  atualizado_em: Date;
};

async function criarEstagioIndefinido(funilPadraoId: string, idEmpresa: string) {
  const maiorOrdem = await prisma.estagioFunil.aggregate({
    where: { id_empresa: idEmpresa, id_funil: funilPadraoId },
    _max: { ordem: true },
  });

  const ordem = (maiorOrdem._max.ordem ?? BigInt(0)) + BigInt(1);

  return prisma.estagioFunil.create({
    data: {
      id: randomUUID(),
      id_empresa: idEmpresa,
      id_funil: funilPadraoId,
      nome: NOME_ESTAGIO_INDEFINIDO,
      tipo: "ABERTO",
      ordem,
    },
  });
}

async function garantirEstagioIndefinido(funilPadraoId: string, idEmpresa: string) {
  const estagiosComMesmoNome = await prisma.estagioFunil.findMany({
    where: {
      id_empresa: idEmpresa,
      id_funil: funilPadraoId,
      nome: NOME_ESTAGIO_INDEFINIDO,
    },
    orderBy: { ordem: "asc" },
  });

  if (estagiosComMesmoNome.length > 0) {
    const estagioIndefinido = estagiosComMesmoNome[0];

    if (estagioIndefinido.tipo !== "ABERTO") {
      return prisma.estagioFunil.update({
        where: { id: estagioIndefinido.id },
        data: { tipo: "ABERTO" },
      });
    }

    return estagioIndefinido;
  }

  return criarEstagioIndefinido(funilPadraoId, idEmpresa);
}

export async function garantirFunilPadraoEmpresa(idEmpresa: string) {
  const funilExistente = await prisma.funil.findFirst({
    where: { id_empresa: idEmpresa, padrao: true },
    orderBy: [{ ordem: "asc" }, { criado_em: "asc" }],
  });

  if (funilExistente) {
    return funilExistente;
  }

  return prisma.funil.create({
    data: {
      id: randomUUID(),
      id_empresa: idEmpresa,
      nome: "Funil principal",
      slug: "funil-principal",
      descricao: "Funil padrao criado automaticamente",
      padrao: true,
      ativo: true,
      ordem: 0,
    },
  });
}

export async function garantirEstagiosFixosEmpresa(idEmpresa: string) {
  const funilPadrao = await garantirFunilPadraoEmpresa(idEmpresa);
  await garantirEstagioIndefinido(funilPadrao.id, idEmpresa);

  const estagios = await prisma.estagioFunil.findMany({
    where: { id_empresa: idEmpresa, id_funil: funilPadrao.id },
    orderBy: { ordem: "asc" },
  });

  return estagios as unknown as EstagioFunilBasico[];
}

export async function obterEstagioIndefinido(idEmpresa: string) {
  const funilPadrao = await garantirFunilPadraoEmpresa(idEmpresa);

  const estagio = await prisma.estagioFunil.findFirst({
    where: { id_empresa: idEmpresa, id_funil: funilPadrao.id, nome: NOME_ESTAGIO_INDEFINIDO },
  });

  if (estagio) {
    if (estagio.tipo !== "ABERTO") {
      return prisma.estagioFunil.update({
        where: { id: estagio.id },
        data: { tipo: "ABERTO" },
      });
    }

    return estagio;
  }

  return garantirEstagioIndefinido(funilPadrao.id, idEmpresa);

}
