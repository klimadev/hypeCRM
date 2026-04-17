import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { unificarChatsComLeads } from "@/lib/chat-unificado";
import { listarChatsWhatsappPersistidos } from "@/lib/chat-whatsapp-persistence";
import { serverError } from "@/lib/api/http";
import { obterSnapshotCacheado } from "@/lib/chat-snapshot-cache";
import { chatLogger, criarContextoChat } from "@/lib/chat-logger";

const CHAT_LIST_TTL_MS = 30_000;
const CHAT_PERSISTENCE_FIRST = process.env.CHAT_PERSISTENCE_FIRST !== "0";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  try {
    const { searchParams } = new URL(request.url);
    const pagina = parseInt(searchParams.get("pagina") ?? "1", 10);
    const limite = parseInt(searchParams.get("limite") ?? "50", 10);
    const busca = searchParams.get("busca") ?? undefined;

    chatLogger.log("LISTAR_CONVERSAS_REQ", criarContextoChat({ idEmpresa: auth.sessao.id_empresa, pagina, limite, busca }));

    const cacheKey = `chat:list:${auth.sessao.id_empresa}:${auth.sessao.perfil}:${auth.sessao.id_usuario}:${auth.sessao.id_pdv ?? ""}:${pagina}:${limite}:${busca?.trim() ?? ""}`;

    chatLogger.log("LISTAR_CONVERSAS_REQ", criarContextoChat({ pagina, limite, busca }));

    const resultado = await obterSnapshotCacheado({
      key: cacheKey,
      ttlMs: CHAT_LIST_TTL_MS,
      loader: () =>
        unificarChatsComLeads({
          sessao: auth.sessao,
          pagina,
          limite,
          busca,
        }),
    });

    const persistido = CHAT_PERSISTENCE_FIRST
      ? await listarChatsWhatsappPersistidos({
          sessao: auth.sessao,
          pagina,
          limite,
          busca,
        })
      : null;

    // Se persistence-first ativo E tem chats persistidos, usa eles + instagram
    // Senão, usa os chats live do Evolution
    let chatsFinais: typeof resultado.chats;
    let totalFinal: number;
    let temMaisFinal: boolean;

    if (persistido && persistido.chats.length > 0) {
      // Merge: persistidos + instagram (se existirem)
      const chatsInstagram = resultado.chats.filter((chat) => chat.canal === "instagram");
      chatsFinais = [...persistido.chats, ...chatsInstagram]
        .sort((a, b) => (b.ultimaMensagem?.timestamp ?? 0) - (a.ultimaMensagem?.timestamp ?? 0))
        .slice(0, limite);
      totalFinal = Math.max(resultado.total, persistido.total);
      temMaisFinal = persistido.temMais || resultado.temMais;
    } else {
      // Persistido vazio/unavailable → usar chats live do Evolution
      chatsFinais = resultado.chats;
      totalFinal = resultado.total;
      temMaisFinal = resultado.temMais;
    }

    const semUltimaMensagem = chatsFinais.filter((chat) => !chat.ultimaMensagem).length;
    chatLogger.log("LISTAR_CONVERSAS_OK", criarContextoChat({ idEmpresa: auth.sessao.id_empresa, pagina, limite, busca, telefone: chatsFinais[0]?.telefone }), {
      normalizado: {
        retornadas: chatsFinais.length,
        total: totalFinal,
        semUltimaMensagem,
        fonte: persistido?.chats.length ? "persistido" : "evolution",
      },
    });

    return NextResponse.json({
      chats: chatsFinais,
      total: totalFinal,
      temMais: temMaisFinal,
    });
  } catch (error) {
    chatLogger.erro("LISTAR_CONVERSAS_ERRO", criarContextoChat({ idEmpresa: auth.sessao.id_empresa }), error);
    return serverError("Erro ao carregar chats.");
  }
}
