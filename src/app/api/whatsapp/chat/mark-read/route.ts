import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/permissoes";
import { listarInstancias } from "@/lib/evolution-api";
import { marcarMensagensComoLidasEvolution } from "@/lib/whatsapp-chat.evolution";
import { normalizarRemoteJidCanonico, extrairTelefoneDeRemoteJid } from "@/lib/chat-remote-jid";
import { z } from "zod";

const esquemaMarcarComoLidaConversa = z.object({
  instanceName: z.string().trim().min(1, "Nome da instancia obrigatorio."),
  remoteJid: z.string().trim().min(1, "Remote JID obrigatorio."),
});

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const payload = await request.json().catch(() => null);
  const validacao = esquemaMarcarComoLidaConversa.safeParse(payload);

  if (!validacao.success) {
    return NextResponse.json({ erro: "Payload invalido: instanceName e remoteJid sao obrigatorios." }, { status: 400 });
  }

  const { instanceName, remoteJid } = validacao.data;

  const jidCanonico = normalizarRemoteJidCanonico(remoteJid);
  const telefone = extrairTelefoneDeRemoteJid(jidCanonico);

  if (!telefone) {
    return NextResponse.json({ erro: "Telefone invalido a partir do remoteJid." }, { status: 400 });
  }

  const instancias = await listarInstancias();
  const instanciaEncontrada = instancias.find(
    (i) => i.instanceName === instanceName && ["open", "connecting"].includes(i.status?.toLowerCase())
  );

  if (!instanciaEncontrada) {
    return NextResponse.json({ erro: "Instancia nao encontrada ou desconectada." }, { status: 404 });
  }

  const mensagensNaoLidas = await prisma.whatsappMensagem.findMany({
    where: {
      id_empresa: auth.sessao.id_empresa,
      remote_jid: { contains: telefone },
      from_me: false,
    },
    select: {
      mensagem_id: true,
      remote_jid: true,
    },
    take: 100,
  });

  if (mensagensNaoLidas.length === 0) {
    return NextResponse.json({ ok: true, marked: 0, message: "Nenhuma mensagem nao lida encontrada." });
  }

  const readMessages = mensagensNaoLidas.map((msg) => ({
    remoteJid: msg.remote_jid,
    id: msg.mensagem_id,
  }));

  try {
    await marcarMensagensComoLidasEvolution(instanceName, readMessages);
    return NextResponse.json({ ok: true, marked: readMessages.length });
  } catch (error) {
    console.error("[mark-read] Erro ao marcar mensagens como lidas na Evolution:", error);
    return NextResponse.json({ erro: "Falha ao marcar mensagens como lidas no WhatsApp." }, { status: 500 });
  }
}