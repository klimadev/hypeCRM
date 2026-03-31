import { NextRequest } from "next/server";
import { exigirSessao, whereLeadsPorPerfil } from "@/lib/permissoes";
import { notFound, ok } from "@/lib/api/http";
import { listarNegociosDoLead, obterLeadContatoPorId } from "@/lib/leads";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id } = await params;
  const whereLeads = await whereLeadsPorPerfil(auth.sessao);
  const lead = await obterLeadContatoPorId({
    idEmpresa: auth.sessao.id_empresa,
    idLead: id,
    where: whereLeads,
  });

  if (!lead) {
    return notFound("Lead nao encontrado.");
  }

  const negocios = await listarNegociosDoLead({
    idEmpresa: auth.sessao.id_empresa,
    idLead: lead.id,
  });

  return ok({ negocios: negocios ?? [] });
}
