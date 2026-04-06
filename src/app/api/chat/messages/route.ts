import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { enviarMensagemTexto } from "@/lib/evolution-api.instances";
import { buscarMensagensPorContato } from "@/lib/evolution-api.chat";
import { listarMensagensInstagramPorEmpresa, enviarMensagemInstagram } from "@/lib/integracoes/instagram-inbox";
import { ErroInstagramApi } from "@/lib/integracoes/instagram-client";
import { mensagemErroValidacao, esquemaChatUnificadoMessagesQuery, esquemaChatUnificadoSendMessage } from "@/lib/validacoes";

function extrairTelefoneDeRemoteJid(remoteJid: string): string {
  return remoteJid.replace(/@.*/, "").replace(/\D/g, "");
}

function ehInstagram(instanceName: string): boolean {
  return instanceName === "instagram";
}

function logChat(evento: string, detalhes?: Record<string, unknown>) {
  if (detalhes) {
    console.info(`[Chat] ${evento}`, detalhes);
    return;
  }

  console.info(`[Chat] ${evento}`);
}

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const { searchParams } = new URL(request.url);
  const validacao = esquemaChatUnificadoMessagesQuery.safeParse({
    instanceName: searchParams.get("instanceName") ?? undefined,
    remoteJid: searchParams.get("remoteJid") ?? undefined,
    limite: searchParams.get("limite") ?? undefined,
  });

  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const { instanceName, remoteJid, limite } = validacao.data;

  if (ehInstagram(instanceName)) {
    try {
      logChat("Carregando mensagens da conversa do Instagram", {
        instanceName,
        remoteJid,
        limite,
      });

      const mensagensIg = await listarMensagensInstagramPorEmpresa(auth.sessao.id_empresa, remoteJid, limite);
      const messages = mensagensIg.map((msg: { id: string; text: string | null; created_at: string; from_name: string | null; from_me: boolean; attachments?: Array<{ type: string; url: string | null }> }) => ({
        id: msg.id,
        remoteJid,
        fromMe: msg.from_me,
        text: msg.text ?? "",
        kind: msg.attachments?.[0]?.type ?? "text",
        timestamp: Math.floor(new Date(msg.created_at).getTime() / 1000),
        pushName: msg.from_name ?? null,
        status: "SENT",
        hasMedia: !!msg.attachments?.length,
        mediaUrl: msg.attachments?.[0]?.url ?? null,
        optimistic: false,
        error: null,
      }));

      logChat("Mensagens do Instagram carregadas", {
        remoteJid,
        total: messages.length,
      });

      return NextResponse.json({ messages, hasMore: false });
    } catch (error) {
      console.error(`[Chat] Erro ao carregar conversa do Instagram ${remoteJid}`, error);
      return NextResponse.json(
        { erro: error instanceof Error ? error.message : "Erro ao carregar mensagens do Instagram." },
        { status: 500 },
      );
    }
  }

  const result = await buscarMensagensPorContato(instanceName, remoteJid, 1, limite);

  return NextResponse.json({ messages: result.messages, hasMore: result.hasMore });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const payload = await request.json().catch(() => null);
  const validacao = esquemaChatUnificadoSendMessage.safeParse(payload);

  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  if (ehInstagram(validacao.data.instanceName)) {
    try {
      logChat("Enviando mensagem no Instagram", {
        instanceName: validacao.data.instanceName,
        remoteJid: validacao.data.remoteJid,
      });

      const resultado = await enviarMensagemInstagram(
        auth.sessao.id_empresa,
        validacao.data.remoteJid,
        validacao.data.text,
      );

      return NextResponse.json({ ok: true, messageId: resultado.message_id });
    } catch (error) {
      if (error instanceof ErroInstagramApi && error.categoria === "janela_expirada") {
        logChat("Envio bloqueado por janela de 24h", {
          remoteJid: validacao.data.remoteJid,
          code: error.code,
          subcode: error.subcode,
        });
        return NextResponse.json(
          { erro: "Nao foi possivel enviar a mensagem porque esta conversa esta fora da janela permitida pela plataforma.", codigo: "JANELA_EXPIRADA" },
          { status: 403 },
        );
      }

      if (error instanceof ErroInstagramApi && error.categoria === "token_invalido") {
        logChat("Envio falhou: token invalido", {
          remoteJid: validacao.data.remoteJid,
          code: error.code,
        });
        return NextResponse.json(
          { erro: "A conexao com o Instagram esta invalida ou sem permissao. Reconecte sua conta nas configuracoes.", codigo: "TOKEN_INVALIDO" },
          { status: 401 },
        );
      }

      if (error instanceof ErroInstagramApi && error.categoria === "erro_rede") {
        logChat("Erro de rede ao enviar mensagem no Instagram", {
          remoteJid: validacao.data.remoteJid,
          mensagem: error.message,
        });
        return NextResponse.json(
          { erro: "Nao foi possivel conectar ao Instagram. Verifique sua conexao e tente novamente.", codigo: "ERRO_REDE" },
          { status: 502 },
        );
      }

      if (error instanceof ErroInstagramApi && error.categoria === "endpoint_invalido") {
        logChat("Erro de endpoint ao enviar mensagem no Instagram", {
          remoteJid: validacao.data.remoteJid,
          code: error.code,
          mensagem: error.message,
        });
        return NextResponse.json(
          { erro: "Nao foi possivel enviar a mensagem. A conversa pode ter sido encerrada ou nao existe mais na plataforma.", codigo: "CONVERSA_INVALIDA" },
          { status: 400 },
        );
      }

      if (error instanceof ErroInstagramApi && error.categoria === "sem_permissao") {
        logChat("Permissao negada ao enviar mensagem no Instagram", {
          remoteJid: validacao.data.remoteJid,
          code: error.code,
        });
        return NextResponse.json(
          { erro: "Nao foi possivel enviar a mensagem porque a conta nao tem permissao para esta operacao.", codigo: "PERMISSAO_NEGADA" },
          { status: 403 },
        );
      }

      if (error instanceof ErroInstagramApi && error.categoria === "limite_excedido") {
        logChat("Limite de requisicoes atingido no Instagram", {
          remoteJid: validacao.data.remoteJid,
          code: error.code,
          subcode: error.subcode,
        });
        return NextResponse.json(
          { erro: "O Instagram atingiu o limite de requisoes. Aguarde alguns instantes e tente novamente.", codigo: "LIMITE_EXCEDIDO" },
          { status: 429 },
        );
      }

      // Fallback: log completo do erro real para debug
      console.error("[Chat] Erro nao classificado ao enviar mensagem no Instagram", {
        remoteJid: validacao.data.remoteJid,
        tipo: error instanceof ErroInstagramApi ? "ErroInstagramApi" : typeof error,
        categoria: error instanceof ErroInstagramApi ? error.categoria : undefined,
        status: error instanceof ErroInstagramApi ? error.status : undefined,
        code: error instanceof ErroInstagramApi ? error.code : undefined,
        subcode: error instanceof ErroInstagramApi ? error.subcode : undefined,
        mensagem: error instanceof Error ? error.message : String(error),
      });

      return NextResponse.json(
        { erro: "Nao foi possivel enviar a mensagem agora.", codigo: "ERRO_DESCONHECIDO" },
        { status: 500 },
      );
    }
  }

  const telefone = extrairTelefoneDeRemoteJid(validacao.data.remoteJid);
  if (!telefone) {
    return NextResponse.json({ erro: "remoteJid invalido." }, { status: 400 });
  }

  await enviarMensagemTexto({
    instanceName: validacao.data.instanceName,
    telefone,
    mensagem: validacao.data.text,
  });

  return NextResponse.json({ ok: true });
}
