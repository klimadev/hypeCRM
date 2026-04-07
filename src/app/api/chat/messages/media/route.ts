import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { buscarMediaBase64 } from "@/lib/whatsapp-chat.evolution";
import { mensagemErroValidacao, esquemaChatUnificadoMedia } from "@/lib/validacoes";
import { prisma } from "@/lib/prisma";

async function verificarInstanciaPertenceEmpresa(idEmpresa: string, instanceName: string): Promise<boolean> {
  const instancia = await prisma.whatsappInstancia.findFirst({
    where: { instance_name: instanceName, id_empresa: idEmpresa },
    select: { id: true },
  });
  return !!instancia;
}

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const { searchParams } = new URL(request.url);
  const validacao = esquemaChatUnificadoMedia.safeParse({
    instanceName: searchParams.get("instanceName") ?? undefined,
    messageId: searchParams.get("messageId") ?? undefined,
  });

  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const instanciaPermitida = await verificarInstanciaPertenceEmpresa(auth.sessao.id_empresa, validacao.data.instanceName);
  if (!instanciaPermitida) {
    return NextResponse.json({ erro: "Instancia nao encontrada nesta empresa." }, { status: 403 });
  }

  const media = await buscarMediaBase64(validacao.data.instanceName, validacao.data.messageId);
  if (!media) {
    return NextResponse.json({ erro: "Midia nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({ media });
}
