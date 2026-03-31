import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const ESTAGIOS_FIXOS_PADRAO = [
  { nome: "Indefinido", tipo: "ABERTO", ordem: 1 },
  { nome: "Em Atendimento", tipo: "ABERTO", ordem: 2 },
  { nome: "Proposta Enviada", tipo: "ABERTO", ordem: 3 },
  { nome: "Pré Aprovação", tipo: "ABERTO", ordem: 4 },
  { nome: "Fechado", tipo: "GANHO", ordem: 5 },
  { nome: "Pós Vendas", tipo: "GANHO", ordem: 6 },
  { nome: "Perdido", tipo: "PERDIDO", ordem: 7 },
] as const;

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

  await prisma.$transaction(async (tx) => {
    const existentes = await tx.estagioFunil.findMany({
      where: { id_empresa: idEmpresa, id_funil: funilPadrao.id },
      orderBy: { ordem: "asc" },
    });

    const mapaPorNome = new Map(existentes.map((estagio) => [estagio.nome, estagio]));

    // Primeiro passo: mover TODOS os existentes para uma faixa alta temporária (evita conflitos)
    // Usar timestamp atual em milissegundos como base para garantir unicidade
    const baseTemp = Date.now();
    for (let i = 0; i < existentes.length; i++) {
      await tx.estagioFunil.update({
        where: { id: existentes[i].id },
        data: { ordem: baseTemp + i },
      });
    }

    // Segundo passo: criar/atualizar os estágios fixos com as ordens finais 1-7
    for (const estagioFixo of ESTAGIOS_FIXOS_PADRAO) {
      const existente = mapaPorNome.get(estagioFixo.nome);
      if (existente) {
        await tx.estagioFunil.update({
          where: { id: existente.id },
          data: {
            nome: estagioFixo.nome,
            tipo: estagioFixo.tipo,
            ordem: estagioFixo.ordem,
          },
        });
        continue;
      }

      await tx.estagioFunil.create({
        data: {
          id: randomUUID(),
          id_empresa: idEmpresa,
          id_funil: funilPadrao.id,
          nome: estagioFixo.nome,
          tipo: estagioFixo.tipo,
          ordem: estagioFixo.ordem,
        },
      });
    }
  });

  return prisma.estagioFunil.findMany({
    where: { id_empresa: idEmpresa, id_funil: funilPadrao.id },
    orderBy: { ordem: "asc" },
  });
}

export async function obterEstagioIndefinido(idEmpresa: string) {
  await garantirEstagiosFixosEmpresa(idEmpresa);
  const funilPadrao = await garantirFunilPadraoEmpresa(idEmpresa);
  const estagio = await prisma.estagioFunil.findFirst({
    where: { id_empresa: idEmpresa, id_funil: funilPadrao.id, nome: "Indefinido", ordem: 1 },
  });

  if (!estagio) {
    throw new Error("Estagio fixo 'Indefinido' nao encontrado.");
  }

  return estagio;
}
