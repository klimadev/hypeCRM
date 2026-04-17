import { NextRequest } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { criarRespostaSse } from "@/lib/whatsapp-chat-realtime";
import { unificarChatsComLeads } from "@/lib/chat-unificado";
import type { UnifiedChatsStreamParams } from "@/lib/whatsapp-chat-realtime.state";
import { chatLogger, criarContextoChat } from "@/lib/chat-logger";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const chave = `chat-unificado:empresa:${auth.sessao.id_empresa}`;

  chatLogger.log("STREAM_CONVERSAS_REQ", criarContextoChat({ idEmpresa: auth.sessao.id_empresa }));

  const params: UnifiedChatsStreamParams = {
    tipo: "unified",
    chave,
    pollMs: 10000,
    carregarSnapshot: async () => {
      const resultado = await unificarChatsComLeads({ sessao: auth.sessao, pagina: 1, limite: 10 });
      return { chats: resultado.chats, total: resultado.total, temMais: resultado.temMais };
    },
  };

  return criarRespostaSse(params, request);
}
