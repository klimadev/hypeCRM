import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { unificarChatsComLeads } from "@/lib/chat-unificado";
import { serverError } from "@/lib/api/http";
import { obterSnapshotCacheado } from "@/lib/chat-snapshot-cache";

const CHAT_LIST_TTL_MS = 8_000;

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

    console.info("[Chat] Listando conversas...", {
      empresaId: auth.sessao.id_empresa,
      pagina,
      limite,
      temBusca: !!busca,
    });

    const cacheKey = `chat:list:${auth.sessao.id_empresa}:${auth.sessao.perfil}:${auth.sessao.id_usuario}:${auth.sessao.id_pdv ?? ""}:${pagina}:${limite}:${busca?.trim() ?? ""}`;
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

    const semUltimaMensagem = resultado.chats.filter((chat) => !chat.ultimaMensagem).length;
    console.info("[Chat] Conversas carregadas", {
      pagina,
      retornadas: resultado.chats.length,
      total: resultado.total,
      semUltimaMensagem,
    });

    return NextResponse.json(resultado, {
      headers: {
        "Server-Timing": [
          `leads;dur=${resultado.debug.timingsMs.leads}`,
          `instances;dur=${resultado.debug.timingsMs.instances}`,
          `evolution;dur=${resultado.debug.timingsMs.whatsapp}`,
          `instagram;dur=${resultado.debug.timingsMs.instagram}`,
          `enrichment;dur=${resultado.debug.timingsMs.enrichment}`,
          `total;dur=${resultado.debug.timingsMs.total}`,
        ].join(", "),
      },
    });
  } catch (error) {
    console.error("[Chat] Erro ao listar conversas", error);
    return serverError("Erro ao carregar chats.");
  }
}
