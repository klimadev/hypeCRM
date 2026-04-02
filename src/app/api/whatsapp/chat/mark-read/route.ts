import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/permissoes";
import { buscarLeadComAcesso } from "@/lib/whatsapp-chat.resolvers";
import { mensagemErroValidacao, esquemaWhatsappChatMarkRead } from "@/lib/validacoes";

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const payload = await request.json().catch(() => null);
  const validacao = esquemaWhatsappChatMarkRead.safeParse(payload);

  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const lead = await buscarLeadComAcesso(auth.sessao, validacao.data.leadId);
  if (!lead) {
    return NextResponse.json({ erro: "Lead nao encontrado." }, { status: 404 });
  }

  const resultado = await prisma.whatsappMensagem.updateMany({
    where: {
      id_empresa: auth.sessao.id_empresa,
      id_lead: lead.id,
      from_me: false,
      lida_no_crm_em: null,
    },
    data: {
      lida_no_crm_em: new Date(),
    },
  });

  return NextResponse.json({ unreadCount: 0, updated: resultado.count });
}
