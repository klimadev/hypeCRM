import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, whereLeadsPorPerfil, whereNegociosPorPerfil } from "@/lib/permissoes";
import { notFound } from "@/lib/api/http";
import { listarLeadsContato } from "@/lib/leads";
import {
  desvincularLeadsDoNegocio,
  montarDtoNegocio,
  obterNegocioPorId,
} from "@/lib/negocios";

type Params = {
  params: Promise<{ id: string; leadId: string }>;
};

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id, leadId } = await params;
  const whereNegocios = await whereNegociosPorPerfil(auth.sessao);
  const whereLeads = await whereLeadsPorPerfil(auth.sessao);

  const negocio = await obterNegocioPorId({
    idEmpresa: auth.sessao.id_empresa,
    idNegocio: id,
    whereExtra: whereNegocios,
  });

  if (!negocio) {
    return notFound("Negocio nao encontrado.");
  }

  const leadsPermitidos = await listarLeadsContato({
    idEmpresa: auth.sessao.id_empresa,
    where: whereLeads,
    somenteAtivos: false,
  });

  const lead = leadsPermitidos.find((item) => item.id === leadId);
  if (!lead) {
    return notFound("Lead nao encontrado.");
  }

  const atualizado = await desvincularLeadsDoNegocio({
    idEmpresa: auth.sessao.id_empresa,
    idNegocio: negocio.id,
    leadIds: [lead.id],
  });

  if (!atualizado) {
    return notFound("Negocio nao encontrado.");
  }

  return NextResponse.json({ negocio: montarDtoNegocio(atualizado) });
}
