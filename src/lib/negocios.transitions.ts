import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { QueryClient } from "@/lib/negocios.types";
import { normalizarIdsNegocios } from "@/lib/negocios.utils";
import {
  obterNegocioBasePorId,
  obterNegocioExistente,
  obterLeadsAtivosDisponiveis,
  obterLeadsVinculadosAoNegocio,
  recalcularPrincipalDoNegocio,
} from "@/lib/negocios.queries";
import {
  coletarIdsLeadsVinculadosNegocio,
  definirStatusNegocioPorTipoEstagio,
} from "@/lib/negocios.mutations.utils";

export async function moverNegocioDeEstagio(params: {
  idEmpresa: string;
  idNegocio: string;
  idEstagioDestino: string;
  motivoPerda?: string | null;
}) {
  const negocioAtual = await obterNegocioBasePorId({
    idEmpresa: params.idEmpresa,
    idNegocio: params.idNegocio,
  });

  if (!negocioAtual) {
    return null;
  }

  const estagioDestino = await prisma.estagioFunil.findFirst({
    where: { id: params.idEstagioDestino, id_empresa: params.idEmpresa },
    include: Prisma.validator<Prisma.EstagioFunilInclude>()({ Funil: true }),
  });

  if (!estagioDestino) {
    return null;
  }

  if (negocioAtual.id_estagio === estagioDestino.id) {
    return { negocio: negocioAtual, noop: true };
  }

  const statusNovo = definirStatusNegocioPorTipoEstagio(estagioDestino.tipo);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      UPDATE Negocio
      SET id_funil = ${estagioDestino.id_funil},
          id_estagio = ${estagioDestino.id},
          status = ${statusNovo},
          motivo_perda = ${statusNovo === "PERDIDO" ? params.motivoPerda?.trim() ?? null : null},
          data_fechamento = ${statusNovo === "ABERTO" ? null : new Date()},
          valor_fechado = ${statusNovo === "GANHO" ? negocioAtual.valor_estimado : negocioAtual.valor_fechado},
          atualizado_em = ${new Date()}
      WHERE id = ${params.idNegocio}
        AND id_empresa = ${params.idEmpresa}
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO NegocioEstagioLog (
        id,
        id_negocio,
        id_funil_anterior,
        id_funil_novo,
        id_estagio_anterior,
        id_estagio_novo,
        empresa_id,
        origem,
        criado_em
      ) VALUES (
        ${randomUUID()},
        ${params.idNegocio},
        ${negocioAtual.id_funil},
        ${estagioDestino.id_funil},
        ${negocioAtual.id_estagio},
        ${estagioDestino.id},
        ${params.idEmpresa},
        ${"KANBAN"},
        ${new Date()}
      )
    `);
  });

  return {
    negocio: await obterNegocioBasePorId({
      idEmpresa: params.idEmpresa,
      idNegocio: params.idNegocio,
    }),
    noop: false,
  };
}

export async function vincularLeadsAoNegocio(params: {
  idEmpresa: string;
  idNegocio: string;
  leadIds: string[];
}) {
  const leadIds = normalizarIdsNegocios(params.leadIds);
  if (leadIds.length === 0) {
    return obterNegocioBasePorId({ client: prisma, idEmpresa: params.idEmpresa, idNegocio: params.idNegocio });
  }

  return prisma.$transaction(async (tx) => {
    const negocio = await obterNegocioExistente(tx, { idEmpresa: params.idEmpresa, idNegocio: params.idNegocio });
    if (!negocio) {
      return null;
    }

    const leads = await obterLeadsAtivosDisponiveis(tx, { idEmpresa: params.idEmpresa, idsLeads: leadIds });
    if (!leads) {
      throw new Error("Um ou mais leads informados sao invalidos.");
    }

    const leadsParaTransferir = leads.map((lead) => lead.lead_id);
    const negociosAnteriores = Array.from(
      new Set(
        leads
          .map((lead) => lead.lead_id_negocio)
          .filter((idNegocio): idNegocio is string => Boolean(idNegocio) && idNegocio !== params.idNegocio),
      ),
    );

    await tx.$executeRaw(Prisma.sql`
      UPDATE Lead
      SET id_negocio = ${params.idNegocio},
          atualizado_em = ${new Date()}
      WHERE id_empresa = ${params.idEmpresa}
        AND id IN (${Prisma.join(leadsParaTransferir.map((id) => Prisma.sql`${id}`))})
    `);

    await recalcularPrincipalDoNegocio(tx, { idEmpresa: params.idEmpresa, idNegocio: params.idNegocio });

    for (const idNegocioAnterior of negociosAnteriores) {
      await recalcularPrincipalDoNegocio(tx, { idEmpresa: params.idEmpresa, idNegocio: idNegocioAnterior });
    }

    return obterNegocioBasePorId({ client: tx, idEmpresa: params.idEmpresa, idNegocio: params.idNegocio });
  });
}

export async function desvincularLeadsDoNegocio(params: {
  idEmpresa: string;
  idNegocio: string;
  leadIds: string[];
}) {
  const leadIds = normalizarIdsNegocios(params.leadIds);
  if (leadIds.length === 0) {
    return obterNegocioBasePorId({ client: prisma, idEmpresa: params.idEmpresa, idNegocio: params.idNegocio });
  }

  return prisma.$transaction(async (tx) => {
    const negocio = await obterNegocioExistente(tx, { idEmpresa: params.idEmpresa, idNegocio: params.idNegocio });
    if (!negocio) {
      return null;
    }

    const leadsDoNegocio = await obterLeadsVinculadosAoNegocio(tx, { idEmpresa: params.idEmpresa, idNegocio: params.idNegocio });
    const idsParaRemover = new Set(leadIds);
    const leadsAfetados = leadsDoNegocio.filter((lead) => idsParaRemover.has(lead.lead_id));

    if (leadsAfetados.length === 0) {
      return obterNegocioBasePorId({ client: tx, idEmpresa: params.idEmpresa, idNegocio: params.idNegocio });
    }

    await tx.$executeRaw(Prisma.sql`
      UPDATE Lead
      SET id_negocio = ${null},
          atualizado_em = ${new Date()}
      WHERE id_empresa = ${params.idEmpresa}
        AND id_negocio = ${params.idNegocio}
        AND id IN (${Prisma.join(Array.from(idsParaRemover).map((id) => Prisma.sql`${id}`))})
    `);

    await recalcularPrincipalDoNegocio(tx, { idEmpresa: params.idEmpresa, idNegocio: params.idNegocio });

    return obterNegocioBasePorId({ client: tx, idEmpresa: params.idEmpresa, idNegocio: params.idNegocio });
  });
}

export async function listarNegociosPrincipaisDoLead(params: {
  idEmpresa: string;
  idLead: string;
  client?: QueryClient;
}) {
  const client = params.client ?? prisma;

  return client.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id
    FROM Negocio
    WHERE id_empresa = ${params.idEmpresa}
      AND id_lead = ${params.idLead}
    ORDER BY criado_em ASC
  `);
}

export async function desativarNegocio(params: {
  idEmpresa: string;
  idNegocio: string;
  removerLeadsVinculados?: boolean;
  client?: QueryClient;
}) {
  const client = params.client ?? prisma;
  const negocio = await obterNegocioBasePorId({ client, idEmpresa: params.idEmpresa, idNegocio: params.idNegocio });
  if (!negocio) {
    return null;
  }

  const idsLeadsVinculados = coletarIdsLeadsVinculadosNegocio(negocio);
  const agora = new Date();

  if (idsLeadsVinculados.length > 0) {
    await client.$executeRaw(Prisma.sql`
      UPDATE Lead
      SET id_negocio = ${null},
          atualizado_em = ${agora}
      WHERE id_empresa = ${params.idEmpresa}
        AND id_negocio = ${params.idNegocio}
        AND id IN (${Prisma.join(idsLeadsVinculados.map((id) => Prisma.sql`${id}`))})
    `);

    if (params.removerLeadsVinculados) {
      await client.$executeRaw(Prisma.sql`
        DELETE FROM Lead
        WHERE id_empresa = ${params.idEmpresa}
          AND id IN (${Prisma.join(idsLeadsVinculados.map((id) => Prisma.sql`${id}`))})
      `);
    }
  }

  await client.$executeRaw(Prisma.sql`
    DELETE FROM Negocio
    WHERE id = ${params.idNegocio}
      AND id_empresa = ${params.idEmpresa}
  `);

  return { negocio, leadsVinculados: idsLeadsVinculados };
}
