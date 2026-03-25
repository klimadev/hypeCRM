import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPerfis } from "@/lib/api/route-guards";
import { ok, notFound } from "@/lib/api/http";
import { automacaoArquivada } from "@/lib/automacoes/config";
import { cancelarAgendamentosDaAutomacaoWhatsapp } from "@/lib/whatsapp-automations";

type RouteParams = Promise<{ id: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  return withPerfis(request, ["EMPRESA"], async ({ sessao }) => {
    const { id } = await params;

    const automacao = await prisma.automacao.findFirst({
      where: {
        id,
        id_empresa: sessao.id_empresa,
      },
    });

    if (!automacao) {
      return notFound("Automacao nao encontrada.");
    }

    if (automacaoArquivada(automacao.config_json)) {
      return notFound("Automacao nao encontrada.");
    }

    const atualizada = await prisma.automacao.update({
      where: { id },
      data: { ativo: !automacao.ativo },
    });

    if (!atualizada.ativo) {
      await cancelarAgendamentosDaAutomacaoWhatsapp(id, "Automacao desativada.");
    }

    return ok({ automacao: atualizada }, 200, true);
  });
}
