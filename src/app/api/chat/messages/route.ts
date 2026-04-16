import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, whereLeadsPorPerfil } from "@/lib/permissoes";
import { enviarMensagemTexto } from "@/lib/evolution-api.instances";
import { buscarMensagensPorContato } from "@/lib/evolution-api.chat";
import { listarMensagensInstagramPorEmpresa, enviarMensagemInstagram } from "@/lib/integracoes/instagram-inbox";
import { mensagemErroValidacao, esquemaChatUnificadoMessagesQuery, esquemaChatUnificadoSendMessage } from "@/lib/validacoes";
import { obterSnapshotCacheado } from "@/lib/chat-snapshot-cache";
import { prisma } from "@/lib/prisma";
import { instagramErrorToResponse } from "@/lib/api/instagram-errors";
import type { SessaoToken } from "@/lib/tipos";
import { extrairTelefoneDeRemoteJid, resolverDestinoConversaWhatsapp } from "@/lib/chat-remote-jid";

const CHAT_MESSAGES_TTL_MS = 5_000;

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

async function verificarAcessoConversa(
  sessao: SessaoToken,
  telefone: string,
): Promise<boolean> {
  if (!telefone) return false;

  const whereLeads = await whereLeadsPorPerfil(sessao);

  const lead = await prisma.lead.findFirst({
    where: {
      ...whereLeads,
      telefone: { contains: telefone },
    },
    select: { id: true },
  });

  if (lead) return true;

  if (sessao.perfil === "EMPRESA") {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const { searchParams } = new URL(request.url);
  const validacao = esquemaChatUnificadoMessagesQuery.safeParse({
    instanceName: searchParams.get("instanceName") ?? undefined,
    remoteJid: searchParams.get("remoteJid") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limite: searchParams.get("limite") ?? undefined,
  });

  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const { instanceName, remoteJid, page, limite } = validacao.data;

  const destinoWhatsapp = ehInstagram(instanceName)
    ? null
    : await resolverDestinoConversaWhatsapp(instanceName, remoteJid);

  if (!ehInstagram(instanceName) && !destinoWhatsapp) {
    return NextResponse.json({ erro: "Nao foi possivel resolver a conversa informada." }, { status: 400 });
  }

  const acessoPermitido = await verificarAcessoConversa(
    auth.sessao,
    destinoWhatsapp?.telefone ?? extrairTelefoneDeRemoteJid(remoteJid),
  );
  if (!acessoPermitido) {
    return NextResponse.json({ erro: "Sem permissao para acessar esta conversa." }, { status: 403 });
  }

  if (ehInstagram(instanceName)) {
    try {
      logChat("Carregando mensagens da conversa do Instagram", {
        instanceName,
        remoteJid,
        limite,
      });

      const mensagensIg = await obterSnapshotCacheado({
        key: `chat:messages:${auth.sessao.id_empresa}:${auth.sessao.perfil}:${auth.sessao.id_usuario}:instagram:${remoteJid}:${limite}`,
        ttlMs: CHAT_MESSAGES_TTL_MS,
        loader: () => listarMensagensInstagramPorEmpresa(auth.sessao.id_empresa, remoteJid, limite),
      });
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

  const result = await obterSnapshotCacheado({
    key: `chat:messages:${auth.sessao.id_empresa}:${auth.sessao.perfil}:${auth.sessao.id_usuario}:${instanceName}:${destinoWhatsapp?.lookupRemoteJid ?? remoteJid}:${page}:${limite}`,
    ttlMs: CHAT_MESSAGES_TTL_MS,
    loader: () => buscarMensagensPorContato(instanceName, destinoWhatsapp?.lookupRemoteJid ?? remoteJid, page, limite),
  });

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

  const destinoWhatsapp = ehInstagram(validacao.data.instanceName)
    ? null
    : await resolverDestinoConversaWhatsapp(validacao.data.instanceName, validacao.data.remoteJid);

  if (!ehInstagram(validacao.data.instanceName) && !destinoWhatsapp) {
    return NextResponse.json(
      { erro: "Nao foi possivel resolver a conversa informada. Tente novamente mais tarde." },
      { status: 400 },
    );
  }

  const acessoPermitido = await verificarAcessoConversa(
    auth.sessao,
    destinoWhatsapp?.telefone ?? extrairTelefoneDeRemoteJid(validacao.data.remoteJid),
  );
  if (!acessoPermitido) {
    return NextResponse.json({ erro: "Sem permissao para acessar esta conversa." }, { status: 403 });
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
      return instagramErrorToResponse(error, validacao.data.remoteJid);
    }
  }

  const telefone = destinoWhatsapp?.telefone ?? extrairTelefoneDeRemoteJid(validacao.data.remoteJid);

  if (!telefone) {
    return NextResponse.json({ erro: "remoteJid invalido." }, { status: 400 });
  }

  try {
    await enviarMensagemTexto({
      instanceName: validacao.data.instanceName,
      telefone,
      mensagem: validacao.data.text,
    });
  } catch (error) {
    console.error("[Chat] Erro ao enviar mensagem via Evolution", {
      instanceName: validacao.data.instanceName,
      telefone,
      erro: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { erro: error instanceof Error ? error.message : "Erro ao enviar mensagem." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
