import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { buscarMediaBase64 } from "@/lib/whatsapp-chat.evolution";
import { mensagemErroValidacao, esquemaChatUnificadoMedia } from "@/lib/validacoes";

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

  const media = await buscarMediaBase64(validacao.data.instanceName, validacao.data.messageId);
  if (!media) {
    return NextResponse.json({ erro: "Midia nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({ media });
}
