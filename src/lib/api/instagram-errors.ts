import { NextResponse } from "next/server";
import { ErroInstagramApi, type CategoriaFalhaInstagram } from "@/lib/integracoes/instagram-client";

type ErroInstagramResponse = {
  erro: string;
  codigo: string;
};

const INSTAGRAM_ERROR_MESSAGES: Record<CategoriaFalhaInstagram, { erro: string; codigo: string; status: number }> = {
  janela_expirada: {
    erro: "Nao foi possivel enviar a mensagem porque esta conversa esta fora da janela permitida pela plataforma.",
    codigo: "JANELA_EXPIRADA",
    status: 403,
  },
  token_invalido: {
    erro: "A conexao com o Instagram esta invalida ou sem permissao. Reconecte sua conta nas configuracoes.",
    codigo: "TOKEN_INVALIDO",
    status: 401,
  },
  erro_rede: {
    erro: "Nao foi possivel conectar ao Instagram. Verifique sua conexao e tente novamente.",
    codigo: "ERRO_REDE",
    status: 502,
  },
  endpoint_invalido: {
    erro: "Nao foi possivel enviar a mensagem. A conversa pode ter sido encerrada ou nao existe mais na plataforma.",
    codigo: "CONVERSA_INVALIDA",
    status: 400,
  },
  sem_permissao: {
    erro: "Nao foi possivel enviar a mensagem porque a conta nao tem permissao para esta operacao.",
    codigo: "PERMISSAO_NEGADA",
    status: 403,
  },
  limite_excedido: {
    erro: "O Instagram atingiu o limite de requisoes. Aguarde alguns instantes e tente novamente.",
    codigo: "LIMITE_EXCEDIDO",
    status: 429,
  },
  resposta_invalida: {
    erro: "Nao foi possivel processar a resposta do Instagram.",
    codigo: "RESPOSTA_INVALIDA",
    status: 500,
  },
  api: {
    erro: "Nao foi possivel processar a solicitacao no Instagram.",
    codigo: "ERRO_API",
    status: 500,
  },
};

function logInstagramError(context: string, remoteJid: string, error: ErroInstagramApi) {
  console.error(`[Chat] ${context} ${remoteJid}`, {
    tipo: error.name,
    categoria: error.categoria,
    status: error.status,
    code: error.code,
    subcode: error.subcode,
    mensagem: error.message,
  });
}

/**
 * Converte erro da API Instagram em NextResponse padronizada.
 * Elimina ramificação manual de 6+ categorias em rotas.
 */
export function instagramErrorToResponse(error: unknown, remoteJid: string): NextResponse<ErroInstagramResponse> {
  if (!(error instanceof ErroInstagramApi)) {
    // Erro desconhecido não classificado
    console.error("[Chat] Erro nao classificado ao enviar mensagem no Instagram", {
      remoteJid,
      tipo: error instanceof Error ? "Error" : typeof error,
      mensagem: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { erro: "Nao foi possivel enviar a mensagem agora.", codigo: "ERRO_DESCONHECIDO" },
      { status: 500 },
    );
  }

  const mapping = INSTAGRAM_ERROR_MESSAGES[error.categoria];

  // Log específico por categoria para debug
  logInstagramError("Erro category:", remoteJid, error);

  return NextResponse.json(
    { erro: mapping.erro, codigo: mapping.codigo },
    { status: mapping.status },
  );
}
