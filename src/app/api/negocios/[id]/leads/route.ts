import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, whereLeadsPorPerfil, whereNegociosPorPerfil } from "@/lib/permissoes";
import { badRequest, notFound } from "@/lib/api/http";
import { parseJson, validateBody } from "@/lib/api/route-validation";
import {
  esquemaAtualizarVinculosNegocio,
  esquemaVincularLeadsAoNegocio,
} from "@/lib/validacoes";
import {
  listarLeadsContato,
} from "@/lib/leads";
import {
  desvincularLeadsDoNegocio,
  montarDtoNegocio,
  obterNegocioPorId,
  vincularLeadsAoNegocio,
} from "@/lib/negocios";

type Params = {
  params: Promise<{ id: string }>;
};

type WhereLeads = Awaited<ReturnType<typeof whereLeadsPorPerfil>>;
type WhereNegocios = Awaited<ReturnType<typeof whereNegociosPorPerfil>>;

function normalizarLeadIds(leadIds: unknown) {
  if (!Array.isArray(leadIds)) {
    return [];
  }

  return leadIds
    .filter((leadId): leadId is string => typeof leadId === "string")
    .map((leadId) => leadId.trim())
    .filter(Boolean);
}

async function validarLeadsPermitidos(idEmpresa: string, whereLeads: WhereLeads, leadIds: string[]) {
  if (leadIds.length === 0) {
    return [];
  }

  const leadsPermitidos = await listarLeadsContato({
    idEmpresa,
    where: whereLeads,
    somenteAtivos: true,
  });

  const idsPermitidos = new Set(leadsPermitidos.map((lead) => lead.id));
  return leadIds.filter((leadId) => idsPermitidos.has(leadId));
}

function combinarIdsPermitidos(leadIdsSolicitados: string[], leadIdsPermitidos: string[], leadIdsJaVinculados: string[]) {
  const idsPermitidos = new Set([...leadIdsPermitidos, ...leadIdsJaVinculados]);
  return leadIdsSolicitados.every((leadId) => idsPermitidos.has(leadId));
}

async function obterNegocioPermitido(idEmpresa: string, idNegocio: string, whereNegocios: WhereNegocios) {
  return obterNegocioPorId({
    idEmpresa,
    idNegocio,
    whereExtra: whereNegocios,
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id } = await params;
  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = validateBody(esquemaVincularLeadsAoNegocio, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const whereNegocios = await whereNegociosPorPerfil(auth.sessao);
  const whereLeads = await whereLeadsPorPerfil(auth.sessao);
  const negocio = await obterNegocioPermitido(auth.sessao.id_empresa, id, whereNegocios);

  if (!negocio) {
    return notFound("Negocio nao encontrado.");
  }

  const leadIds = await validarLeadsPermitidos(auth.sessao.id_empresa, whereLeads, validacao.data.lead_ids);
  const leadIdsJaVinculados = negocio.leads.map((lead) => lead.id);
  if (!combinarIdsPermitidos(validacao.data.lead_ids, leadIds, leadIdsJaVinculados)) {
    return badRequest("Um ou mais leads informados sao invalidos.");
  }

  const atualizado = await vincularLeadsAoNegocio({
    idEmpresa: auth.sessao.id_empresa,
    idNegocio: negocio.id,
    leadIds,
  });

  if (!atualizado) {
    return notFound("Negocio nao encontrado.");
  }

  return NextResponse.json({ negocio: montarDtoNegocio(atualizado) });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id } = await params;
  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = validateBody(esquemaAtualizarVinculosNegocio, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const leadIdsDesejados = normalizarLeadIds(validacao.data.lead_ids);
  const whereNegocios = await whereNegociosPorPerfil(auth.sessao);
  const whereLeads = await whereLeadsPorPerfil(auth.sessao);
  const negocio = await obterNegocioPermitido(auth.sessao.id_empresa, id, whereNegocios);

  if (!negocio) {
    return notFound("Negocio nao encontrado.");
  }

  const leadIdsPermitidos = await validarLeadsPermitidos(auth.sessao.id_empresa, whereLeads, leadIdsDesejados);
  const leadIdsJaVinculados = negocio.leads.map((lead) => lead.id);

  if (!combinarIdsPermitidos(leadIdsDesejados, leadIdsPermitidos, leadIdsJaVinculados)) {
    return badRequest("Um ou mais leads informados sao invalidos.");
  }

  const atuais = negocio.leads.map((lead) => lead.id);
  const idsDesejados = new Set(leadIdsDesejados);
  const paraAdicionar = leadIdsPermitidos.filter((leadId) => !atuais.includes(leadId));
  const paraRemover = atuais.filter((leadId) => !idsDesejados.has(leadId));

  if (paraRemover.length > 0) {
    await desvincularLeadsDoNegocio({
      idEmpresa: auth.sessao.id_empresa,
      idNegocio: negocio.id,
      leadIds: paraRemover,
    });
  }

  if (paraAdicionar.length > 0) {
    await vincularLeadsAoNegocio({
      idEmpresa: auth.sessao.id_empresa,
      idNegocio: negocio.id,
      leadIds: paraAdicionar,
    });
  }

  const atualizado = await obterNegocioPermitido(auth.sessao.id_empresa, negocio.id, whereNegocios);
  return NextResponse.json({ negocio: atualizado ? montarDtoNegocio(atualizado) : null });
}
