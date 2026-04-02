import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { enviarMensagemTexto } from "@/lib/evolution-api.instances";
import { buscarMensagensPorContato } from "@/lib/evolution-api.chat";
import { mensagemErroValidacao, esquemaChatUnificadoMessagesQuery, esquemaChatUnificadoSendMessage } from "@/lib/validacoes";

function extrairTelefoneDeRemoteJid(remoteJid: string): string {
  return remoteJid.replace(/@.*/, "").replace(/\D/g, "");
}

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const { searchParams } = new URL(request.url);
  const validacao = esquemaChatUnificadoMessagesQuery.safeParse({
    instanceName: searchParams.get("instanceName") ?? undefined,
    remoteJid: searchParams.get("remoteJid") ?? undefined,
    limite: searchParams.get("limite") ?? undefined,
  });

  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const { instanceName, remoteJid, limite } = validacao.data;

  const result = await buscarMensagensPorContato(instanceName, remoteJid, 1, limite);

  return NextResponse.json({ messages: result.messages, hasMore: result.hasMore });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const payload = await request.json().catch(() => null);
  const validacao = esquemaChatUnificadoSendMessage.safeParse(payload);

  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const telefone = extrairTelefoneDeRemoteJid(validacao.data.remoteJid);
  if (!telefone) {
    return NextResponse.json({ erro: "remoteJid invalido." }, { status: 400 });
  }

  await enviarMensagemTexto({
    instanceName: validacao.data.instanceName,
    telefone,
    mensagem: validacao.data.text,
  });

  return NextResponse.json({ ok: true });
}
