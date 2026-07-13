import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, whereLeadsPorPerfil } from "@/lib/permissoes";
import { badRequest } from "@/lib/api/http";
import { handleRouteError } from "@/lib/api/route-errors";
import { parseJson } from "@/lib/api/route-validation";
import { desativarLeadContato, obterLeadContatoPorId } from "@/lib/leads";
import { desativarNegocio, listarNegociosPrincipaisDoLead } from "@/lib/negocios";
import { z } from "zod";

const esquemaBatchDelete = z.object({
  lead_ids: z.array(z.string().min(1)).min(1, "Informe ao menos um lead."),
  remover_negocios_vinculados: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const body = await parseJson<unknown>(request);
  if (!body.ok) return body.response;

  const validacao = esquemaBatchDelete.safeParse(body.data);
  if (!validacao.success) {
    return badRequest(validacao.error.issues[0]?.message ?? "Dados invalidos.");
  }

  const { lead_ids, remover_negocios_vinculados } = validacao.data;
  const whereLeads = await whereLeadsPorPerfil(auth.sessao);

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      let removidos = 0;
      let erros = 0;

      for (const id of lead_ids) {
        const lead = await obterLeadContatoPorId({
          idEmpresa: auth.sessao.id_empresa,
          idLead: id,
          where: whereLeads,
          somenteAtivos: false,
        });

        if (!lead) {
          erros++;
          continue;
        }

        const leadRemovido = await desativarLeadContato({
          idEmpresa: auth.sessao.id_empresa,
          idLead: lead.id,
          client: tx,
        });

        if (!leadRemovido) {
          erros++;
          continue;
        }

        if (remover_negocios_vinculados) {
          const idsNegocios = new Set<string>();
          if (lead.id_negocio) idsNegocios.add(lead.id_negocio);

          const negociosPrincipais = await listarNegociosPrincipaisDoLead({
            idEmpresa: auth.sessao.id_empresa,
            idLead: lead.id,
            client: tx,
          });

          for (const negocio of negociosPrincipais) idsNegocios.add(negocio.id);

          for (const idNegocio of idsNegocios) {
            await desativarNegocio({
              idEmpresa: auth.sessao.id_empresa,
              idNegocio,
              client: tx,
              removerLeadsVinculados: false,
            });
          }
        }

        removidos++;
      }

      return { removidos, erros };
    });

    return NextResponse.json({
      sucesso: true,
      ...resultado,
    });
  } catch (erro) {
    return handleRouteError(erro, "Erro ao remover leads em massa.", "Erro ao remover leads em massa:");
  }
}
