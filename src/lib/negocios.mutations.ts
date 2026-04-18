import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { NegocioResumo } from "@/lib/negocios.types";
import { normalizarIdsNegocios } from "@/lib/negocios.utils";
import {
  obterNegocioBasePorId,
  recalcularPrincipalDoNegocio,
  validarLeadsVinculaveis,
} from "@/lib/negocios.queries";
import {
  construirCamposAtualizacaoNegocio,
  definirStatusNegocioPorTipoEstagio,
  transformarCamposAtualizacaoEmSql,
} from "@/lib/negocios.mutations.utils";

export async function criarNegocio(params: {
  idEmpresa: string;
  idFunil?: string;
  idEstagio: string;
  idFuncionario: string;
  titulo: string;
  valorEstimado: number;
  leadIds?: string[];
  probabilidade?: number;
  observacoesComerciais?: string | null;
  motivoPerda?: string | null;
}) {
  const estagio = await prisma.estagioFunil.findFirst({
    where: { id: params.idEstagio, id_empresa: params.idEmpresa },
    include: Prisma.validator<Prisma.EstagioFunilInclude>()({ Funil: true }),
  });

  if (!estagio) {
    return null;
  }

  const funil = params.idFunil
    ? await prisma.funil.findFirst({
        where: { id: params.idFunil, id_empresa: params.idEmpresa, ativo: true },
      })
    : estagio.Funil;

  if (!funil || funil.id !== estagio.id_funil) {
    return null;
  }

  const leadIdsNormalizados = normalizarIdsNegocios(params.leadIds ?? []);

  return prisma.$transaction(async (tx) => {
    const leadsVinculaveis =
      leadIdsNormalizados.length > 0
        ? await validarLeadsVinculaveis({ tx, idEmpresa: params.idEmpresa, idsLeads: leadIdsNormalizados })
        : [];

    if (leadsVinculaveis === null) {
      throw new Error("Um ou mais leads selecionados sao invalidos.");
    }

    const idLeadPrincipal = leadsVinculaveis[0]?.id ?? null;
    const agora = new Date();
    const negocioId = randomUUID();
    let statusNegocio: "ABERTO" | "GANHO" | "PERDIDO" = "ABERTO";

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO Negocio (
        id,
        id_empresa,
        id_lead,
      id_funil,
      id_estagio,
        id_funcionario,
        id_produto_principal,
        titulo,
        valor_estimado,
        valor_fechado,
        probabilidade,
        status,
        data_abertura,
        data_fechamento,
        motivo_perda,
        observacoes_comerciais,
        chave_migracao,
        criado_em,
        atualizado_em
      ) VALUES (
        ${negocioId},
        ${params.idEmpresa},
        ${idLeadPrincipal},
        ${funil.id},
        ${estagio.id},
        ${params.idFuncionario},
        ${null},
        ${params.titulo.trim()},
        ${params.valorEstimado},
        ${null},
        ${params.probabilidade ?? null},
        ${(statusNegocio = definirStatusNegocioPorTipoEstagio(estagio.tipo))},
        ${agora},
        ${statusNegocio === "ABERTO" ? null : agora},
        ${statusNegocio === "PERDIDO"
          ? params.motivoPerda?.trim() ?? null
          : null},
        ${params.observacoesComerciais?.trim() ?? null},
        ${null},
        ${agora},
        ${agora}
      )
    `);

    if (leadsVinculaveis.length > 0) {
      const leadsParaAtualizar = leadsVinculaveis.map((lead) => lead.lead_id);
      const antigosNegocios = Array.from(
        new Set(
          leadsVinculaveis
            .map((lead) => lead.lead_id_negocio)
            .filter((idNegocio): idNegocio is string => Boolean(idNegocio) && idNegocio !== negocioId),
        ),
      );

      await tx.$executeRaw(Prisma.sql`
        UPDATE Lead
        SET id_negocio = ${negocioId},
            atualizado_em = ${agora}
        WHERE id_empresa = ${params.idEmpresa}
          AND id IN (${Prisma.join(leadsParaAtualizar.map((id) => Prisma.sql`${id}`))})
      `);

      for (const idNegocioAntigo of antigosNegocios) {
        await recalcularPrincipalDoNegocio(tx, {
          idEmpresa: params.idEmpresa,
          idNegocio: idNegocioAntigo,
        });
      }
    }

    await recalcularPrincipalDoNegocio(tx, {
      idEmpresa: params.idEmpresa,
      idNegocio: negocioId,
    });

    return obterNegocioBasePorId({
      client: tx,
      idEmpresa: params.idEmpresa,
      idNegocio: negocioId,
    });
  });
}

export async function atualizarNegocio(params: {
  idEmpresa: string;
  idNegocio: string;
  titulo?: string;
  valorEstimado?: number;
  valorFechado?: number | null;
  probabilidade?: number;
  motivoPerda?: string | null;
  idFuncionario?: string;
  idFunil?: string;
  idEstagio?: string;
  idProdutoPrincipal?: string | null;
  status?: "ABERTO" | "GANHO" | "PERDIDO";
  observacoesComerciais?: string | null;
}) {
  const negocioExistente = await obterNegocioBasePorId({
    idEmpresa: params.idEmpresa,
    idNegocio: params.idNegocio,
  });

  if (!negocioExistente) {
    return null;
  }

  if (params.idFunil) {
    const funil = await prisma.funil.findFirst({
      where: { id: params.idFunil, id_empresa: params.idEmpresa, ativo: true },
      select: { id: true },
    });
    if (!funil) {
      throw new Error("Funil invalido.");
    }
  }

  if (params.idEstagio) {
    const estagio = await prisma.estagioFunil.findFirst({
      where: {
        id: params.idEstagio,
        id_empresa: params.idEmpresa,
        ...(params.idFunil ? { id_funil: params.idFunil } : {}),
      },
      select: { id: true, tipo: true, id_funil: true },
    });

    if (!estagio) {
      throw new Error("Estagio invalido.");
    }
  }

  if (params.idFuncionario) {
    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: params.idFuncionario,
        id_empresa: params.idEmpresa,
        ativo: true,
      },
      select: { id: true },
    });

    if (!funcionario) {
      throw new Error("Funcionario invalido.");
    }
  }

  if (params.idProdutoPrincipal !== undefined && params.idProdutoPrincipal !== null) {
    const produto = await prisma.produto.findFirst({
      where: {
        id: params.idProdutoPrincipal,
        id_empresa: params.idEmpresa,
      },
      select: { id: true },
    });

    if (!produto) {
      throw new Error("Produto invalido.");
    }
  }

  const campos = transformarCamposAtualizacaoEmSql(construirCamposAtualizacaoNegocio(params));

  await prisma.$executeRaw(Prisma.sql`
    UPDATE Negocio
    SET ${Prisma.join(campos, ", ")}
    WHERE id = ${params.idNegocio}
      AND id_empresa = ${params.idEmpresa}
  `);

  return obterNegocioBasePorId({
    client: prisma,
    idEmpresa: params.idEmpresa,
    idNegocio: params.idNegocio,
  });
}

export function montarDtoNegocio(negocio: NegocioResumo) {
  return negocio;
}

export async function criarNegocioComLead(params: {
  idEmpresa: string;
  idEstagio: string;
  idFuncionario: string;
  nome: string;
  telefone: string;
  valorEstimado: number;
  probabilidade?: number;
  fonte?: string;
  empresaOrigem?: string;
  titulo?: string;
}) {
  const negocio = await criarNegocio({
    idEmpresa: params.idEmpresa,
    idEstagio: params.idEstagio,
    idFuncionario: params.idFuncionario,
    titulo: params.titulo?.trim() || `Negocio inicial - ${params.nome}`,
    valorEstimado: params.valorEstimado,
    leadIds: [],
    probabilidade: params.probabilidade,
  });

  if (!negocio) {
    return null;
  }

  return { lead: null, negocio };
}
