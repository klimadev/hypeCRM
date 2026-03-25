import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSessao } from "@/lib/api/route-guards";
import { calcularEstadoTrial, type DadosTrial } from "@/lib/trial";

export async function GET(request: NextRequest) {
  return withSessao(request, async ({ sessao }) => {
    const empresa = await prisma.empresa.findUnique({
      where: { id: sessao.id_empresa },
      select: {
        status_assinatura: true,
        trial_inicio: true,
        trial_fim: true,
        assinatura_inicio: true,
        assinatura_fim: true,
        plano: true,
      },
    });

    if (!empresa) {
      return Response.json({ erro: "Empresa não encontrada" }, { status: 404 });
    }

    const dadosTrial: DadosTrial = {
      status_assinatura: empresa.status_assinatura,
      trial_inicio: empresa.trial_inicio,
      trial_fim: empresa.trial_fim,
      assinatura_inicio: empresa.assinatura_inicio,
      assinatura_fim: empresa.assinatura_fim,
      plano: empresa.plano,
    };

    const estadoTrial = calcularEstadoTrial(dadosTrial);

    return Response.json(estadoTrial);
  });
}