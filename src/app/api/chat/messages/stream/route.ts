import { NextRequest } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { criarRespostaSse } from "@/lib/whatsapp-chat-realtime.sse";
import type { ChatMessagesStreamParams } from "@/lib/whatsapp-chat-realtime.state";
import { buscarMensagensPorContato } from "@/lib/evolution-api.chat";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const { searchParams } = new URL(request.url);
  const instanceName = searchParams.get("instanceName");
  const remoteJid = searchParams.get("remoteJid");
  const limite = parseInt(searchParams.get("limite") ?? "50", 10);

  if (!instanceName || !remoteJid) {
    return new Response(
      JSON.stringify({ erro: "instanceName e remoteJid sao obrigatorios." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const chave = `messages:${auth.sessao.id_empresa}:${instanceName}:${remoteJid}`;

  const params: ChatMessagesStreamParams = {
    tipo: "messages",
    chave,
    pollMs: 10000,
    carregarSnapshot: async () => {
      const result = await buscarMensagensPorContato(instanceName, remoteJid, 1, limite);
      return {
        messages: result.messages,
        hasMore: result.hasMore,
      };
    },
  };

  return criarRespostaSse(params, request);
}
