import { Prisma } from "@prisma/client";
import type { NegocioResumo } from "@/lib/negocios.types";

export function definirStatusNegocioPorTipoEstagio(tipo: "ABERTO" | "GANHO" | "PERDIDO") {
  if (tipo === "GANHO") {
    return "GANHO" as const;
  }

  if (tipo === "PERDIDO") {
    return "PERDIDO" as const;
  }

  return "ABERTO" as const;
}

export function coletarIdsLeadsVinculadosNegocio(negocio: NegocioResumo) {
  return Array.from(
    new Set([
      ...negocio.leads.map((lead) => lead.id),
      ...(negocio.lead_principal ? [negocio.lead_principal.id] : []),
    ]),
  );
}

export function construirCamposAtualizacaoNegocio(params: {
  titulo?: string;
  valorEstimado?: number;
  valorFechado?: number | null;
  probabilidade?: number;
  motivoPerda?: string | null;
  idFuncionario?: string;
  idFunil?: string;
  idEstagio?: string;
  status?: "ABERTO" | "GANHO" | "PERDIDO";
  observacoesComerciais?: string | null;
}) {
  return {
    ...(params.titulo !== undefined ? { titulo: params.titulo.trim() } : {}),
    ...(params.valorEstimado !== undefined ? { valor_estimado: params.valorEstimado } : {}),
    ...(params.valorFechado !== undefined ? { valor_fechado: params.valorFechado } : {}),
    ...(params.probabilidade !== undefined ? { probabilidade: params.probabilidade } : {}),
    ...(params.motivoPerda !== undefined ? { motivo_perda: params.motivoPerda?.trim() ?? null } : {}),
    ...(params.idFuncionario !== undefined ? { id_funcionario: params.idFuncionario } : {}),
    ...(params.idFunil !== undefined ? { id_funil: params.idFunil } : {}),
    ...(params.idEstagio !== undefined ? { id_estagio: params.idEstagio } : {}),
    ...(params.status !== undefined ? { status: params.status } : {}),
    ...(params.observacoesComerciais !== undefined
      ? { observacoes_comerciais: params.observacoesComerciais?.trim() ?? null }
      : {}),
    atualizado_em: new Date(),
  } satisfies Record<string, string | number | Date | null>;
}

export function transformarCamposAtualizacaoEmSql(campos: Record<string, string | number | Date | null>) {
  return Object.entries(campos).map(([campo, valor]) => Prisma.sql`${Prisma.raw(campo)} = ${valor}`);
}
