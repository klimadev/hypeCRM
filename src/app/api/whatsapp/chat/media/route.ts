import { NextRequest, NextResponse } from "next/server";
import { withSessao } from "@/lib/api/route-guards";
import { validateQuery } from "@/lib/api/route-validation";
import { ok, badRequest, notFound } from "@/lib/api/http";
import { esquemaWhatsappChatMedia } from "@/lib/validacoes";
import {
  buscarLeadComAcesso,
  resolverInstanciaDoLead,
  buscarMediaBase64,
} from "@/lib/whatsapp-chat";

export async function GET(request: NextRequest) {
  return withSessao(request, async ({ sessao }): Promise<NextResponse> => {
    const validacao = validateQuery(esquemaWhatsappChatMedia, {
      leadId: request.nextUrl.searchParams.get("leadId") ?? "",
      messageId: request.nextUrl.searchParams.get("messageId") ?? "",
    });
    if (!validacao.ok) return validacao.response;

    const { leadId, messageId } = validacao.data;

    const lead = await buscarLeadComAcesso(sessao, leadId);
    if (!lead) {
      return notFound("Lead nao encontrado.");
    }

    const instancia = await resolverInstanciaDoLead(sessao.id_empresa, leadId);
    if (!instancia) {
      return NextResponse.json(
        { erro: "Lead sem instancia WhatsApp configurada.", codigo: "PDV_SEM_INSTANCIA" },
        { status: 409 },
      );
    }

    const media = await buscarMediaBase64(instancia.instanceName, messageId);
    if (!media) {
      return badRequest("Erro ao buscar midia ou midia nao encontrada.");
    }

    return ok({ media });
  });
}
