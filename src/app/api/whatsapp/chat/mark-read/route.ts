import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirSessao } from "@/lib/permissoes";
import { buscarMensagensPorContato } from "@/lib/evolution-api.chat";
import { buscarConnectionStatus, marcarMensagensComoLidasEvolution } from "@/lib/whatsapp-chat.evolution";
import { resolverDestinoConversaWhatsapp } from "@/lib/chat-remote-jid";

const esquemaMarcarComoLidaConversa = z.object({
  instanceName: z.string().trim().min(1, "Nome da instancia obrigatorio."),
  remoteJid: z.string().trim().min(1, "Remote JID obrigatorio."),
});

const LIMITE_MENSAGENS_MARCAR_COMO_LIDAS = 100;

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const payload = await request.json().catch(() => null);
  const validacao = esquemaMarcarComoLidaConversa.safeParse(payload);

  if (!validacao.success) {
    return NextResponse.json({ erro: "Payload invalido: instanceName e remoteJid sao obrigatorios." }, { status: 400 });
  }

  const { instanceName, remoteJid } = validacao.data;
  const destinoWhatsapp = await resolverDestinoConversaWhatsapp(instanceName, remoteJid);

  if (!destinoWhatsapp) {
    return NextResponse.json({ erro: "Nao foi possivel resolver a conversa informada." }, { status: 400 });
  }

  const connectionStatus = await buscarConnectionStatus(instanceName);
  if (connectionStatus === "offline") {
    return NextResponse.json({ erro: "Instancia offline. Tente novamente quando a conexao estiver disponivel." }, { status: 409 });
  }

  try {
    const snapshot = await buscarMensagensPorContato(
      instanceName,
      destinoWhatsapp.lookupRemoteJid,
      1,
      LIMITE_MENSAGENS_MARCAR_COMO_LIDAS,
    );

    const mensagensParaMarcar = snapshot.messages
      .filter((mensagem) => mensagem.fromMe === false)
      .map((mensagem) => ({
        remoteJid: mensagem.remoteJidAlt ?? mensagem.remoteJid,
        id: mensagem.id,
      }))
      .filter((mensagem) => mensagem.remoteJid.trim().length > 0 && mensagem.id.trim().length > 0);

    if (mensagensParaMarcar.length === 0) {
      return NextResponse.json({ ok: true, marked: 0, message: "Nenhuma mensagem nao lida encontrada." });
    }

    await marcarMensagensComoLidasEvolution(instanceName, mensagensParaMarcar);

    return NextResponse.json({ ok: true, marked: mensagensParaMarcar.length });
  } catch (error) {
    console.error("[mark-read] Erro ao marcar mensagens como lidas na Evolution:", error);
    return NextResponse.json({ erro: "Falha ao marcar mensagens como lidas no WhatsApp." }, { status: 500 });
  }
}
