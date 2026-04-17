import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { unificarChatsComLeads } from "@/lib/chat-unificado";
import { serverError } from "@/lib/api/http";
import { chatLogger, criarContextoChat } from "@/lib/chat-logger";

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

    chatLogger.log("LISTAR_CONVERSAS_REQ", criarContextoChat({ pagina, limite, busca }));

    const resultado = await unificarChatsComLeads({
      sessao: auth.sessao,
      pagina,
      limite,
      busca,
    });

    const semUltimaMensagem = resultado.chats.filter((chat) => !chat.ultimaMensagem).length;
    chatLogger.log("LISTAR_CONVERSAS_OK", criarContextoChat({ idEmpresa: auth.sessao.id_empresa, pagina, limite, busca, telefone: resultado.chats[0]?.telefone }), {
      normalizado: {
        retornadas: resultado.chats.length,
        total: resultado.total,
        semUltimaMensagem,
        fonte: "evolution-api",
      },
    });

    return NextResponse.json({
      chats: resultado.chats,
      total: resultado.total,
      temMais: resultado.temMais,
    });
  } catch (error) {
    chatLogger.erro("LISTAR_CONVERSAS_ERRO", criarContextoChat({ idEmpresa: auth.sessao.id_empresa }), error);
    return serverError("Erro ao carregar chats.");
  }
}
