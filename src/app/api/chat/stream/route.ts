import { NextRequest } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { criarRespostaSse } from "@/lib/whatsapp-chat-realtime";
import { unificarChatsComLeads } from "@/lib/chat-unificado";
import { listarChatsWhatsappPersistidos } from "@/lib/chat-whatsapp-persistence";
import type { UnifiedChatsStreamParams } from "@/lib/whatsapp-chat-realtime.state";
import { obterSnapshotCacheado } from "@/lib/chat-snapshot-cache";

const CHAT_LIST_TTL_MS = 8_000;
const CHAT_PERSISTENCE_FIRST = process.env.CHAT_PERSISTENCE_FIRST !== "0";

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
        key: `chat:list:${auth.sessao.id_empresa}:${auth.sessao.perfil}:${auth.sessao.id_usuario}:${auth.sessao.id_pdv ?? ""}:1:10:`,
        ttlMs: CHAT_LIST_TTL_MS,
        loader: () => unificarChatsComLeads({ sessao: auth.sessao, pagina: 1, limite: 10 }),
      });
      let chatsSse: typeof resultado.chats;
    let totalSse: number;
    let temMaisSse: boolean;

    // Se persistence-first ativo E tem chats persistidos, usa eles + instagram
    if (CHAT_PERSISTENCE_FIRST) {
      const whats = await listarChatsWhatsappPersistidos({
        sessao: auth.sessao,
        pagina: 1,
        limite: 10,
      });
      if (whats.chats.length > 0) {
        const instagram = resultado.chats.filter((chat) => chat.canal === "instagram");
        chatsSse = [...whats.chats, ...instagram]
          .sort((a, b) => (b.ultimaMensagem?.timestamp ?? 0) - (a.ultimaMensagem?.timestamp ?? 0))
          .slice(0, 10);
        totalSse = Math.max(resultado.total, whats.total);
        temMaisSse = resultado.temMais || whats.temMais;
      } else {
        // Persistido vazio → usar live
        chatsSse = resultado.chats;
        totalSse = resultado.total;
        temMaisSse = resultado.temMais;
      }
    } else {
      chatsSse = resultado.chats;
      totalSse = resultado.total;
      temMaisSse = resultado.temMais;
    }

    return { chats: chatsSse, total: totalSse, temMais: temMaisSse };
    },
  };

  return criarRespostaSse(params, request);
}
