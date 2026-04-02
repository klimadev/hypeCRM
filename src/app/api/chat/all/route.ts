import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { unificarChatsComLeads } from "@/lib/chat-unificado";
import { serverError } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  try {
    const { searchParams } = new URL(request.url);
    const pagina = parseInt(searchParams.get("pagina") ?? "1", 10);
    const limite = parseInt(searchParams.get("limite") ?? "50", 10);

    const resultado = await unificarChatsComLeads({
      sessao: auth.sessao,
      pagina,
      limite,
    });
    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao unificar chats:", error);
    return serverError("Erro ao carregar chats.");
  }
}
