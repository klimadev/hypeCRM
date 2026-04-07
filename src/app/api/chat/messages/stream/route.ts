import { NextRequest } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { criarRespostaSse } from "@/lib/whatsapp-chat-realtime.sse";
import type { ChatMessagesStreamParams } from "@/lib/whatsapp-chat-realtime.state";
import { buscarMensagensPorContato } from "@/lib/evolution-api.chat";
import { listarMensagensInstagramPorEmpresa } from "@/lib/integracoes/instagram-inbox";
import { obterSnapshotCacheado } from "@/lib/chat-snapshot-cache";

const CHAT_MESSAGES_TTL_MS = 5_000;

function ehInstagram(instanceName: string) {
  return instanceName === "instagram";
}

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
      if (ehInstagram(instanceName)) {
        const mensagensIg = await obterSnapshotCacheado({
          key: `chat:messages:${auth.sessao.id_empresa}:instagram:${remoteJid}:${limite}`,
          ttlMs: CHAT_MESSAGES_TTL_MS,
          loader: () => listarMensagensInstagramPorEmpresa(auth.sessao.id_empresa, remoteJid, limite),
        });

        return {
          messages: mensagensIg.map((msg) => ({
            id: msg.id,
            remoteJid,
            fromMe: msg.from_me,
            text: msg.text ?? "",
            kind: msg.attachments[0]?.type ?? "text",
            timestamp: Math.floor(new Date(msg.created_at).getTime() / 1000),
            pushName: msg.from_name ?? null,
            status: "SENT",
            hasMedia: msg.attachments.length > 0,
            mediaUrl: msg.attachments[0]?.url ?? null,
            optimistic: false,
            error: null,
          })),
          hasMore: false,
        };
      }

      const result = await obterSnapshotCacheado({
        key: `chat:messages:${auth.sessao.id_empresa}:${instanceName}:${remoteJid}:${limite}`,
        ttlMs: CHAT_MESSAGES_TTL_MS,
        loader: () => buscarMensagensPorContato(instanceName, remoteJid, 1, limite),
      });
      return {
        messages: result.messages,
        hasMore: result.hasMore,
      };
    },
  };

  return criarRespostaSse(params, request);
}
