import { NextRequest } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { criarRespostaSse } from "@/lib/whatsapp-chat-realtime";
import { unificarChatsComLeads } from "@/lib/chat-unificado";
import type { UnifiedChatsStreamParams } from "@/lib/whatsapp-chat-realtime.state";
import { obterSnapshotCacheado } from "@/lib/chat-snapshot-cache";

const CHAT_LIST_TTL_MS = 8_000;

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const chave = `chat-unificado:empresa:${auth.sessao.id_empresa}`;

  const params: UnifiedChatsStreamParams = {
    tipo: "unified",
    chave,
    pollMs: 10000,
    carregarSnapshot: async () => {
      const resultado = await obterSnapshotCacheado({
        key: `chat:list:${auth.sessao.id_empresa}:${auth.sessao.perfil}:${auth.sessao.id_usuario}:${auth.sessao.id_pdv ?? ""}:1:50:`,
        ttlMs: CHAT_LIST_TTL_MS,
        loader: () => unificarChatsComLeads({ sessao: auth.sessao, pagina: 1, limite: 50 }),
      });
      return { chats: resultado.chats, total: resultado.total, temMais: resultado.temMais };
    },
  };

  return criarRespostaSse(params, request);
}
