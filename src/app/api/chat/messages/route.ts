import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, whereLeadsPorPerfil } from "@/lib/permissoes";
import { enviarMensagemTexto, enviarMidiaWhatsapp } from "@/lib/evolution-api.instances";
import { buscarMensagensPorContato } from "@/lib/evolution-api.chat";
import { listarMensagensInstagramPorEmpresa, enviarMensagemInstagram } from "@/lib/integracoes/instagram-inbox";
import { mensagemErroValidacao, esquemaChatUnificadoMessagesQuery, esquemaChatUnificadoSendMessage } from "@/lib/validacoes";
import { prisma } from "@/lib/prisma";
import { instagramErrorToResponse } from "@/lib/api/instagram-errors";
import type { SessaoToken } from "@/lib/tipos";
import { extrairTelefoneDeRemoteJid, extrairLookupParaMensagens, resolverDestinoConversaWhatsapp } from "@/lib/chat-remote-jid";
import { chatLogger, criarContextoChat } from "@/lib/chat-logger";
import { inferirTipoMidiaArquivo } from "@/lib/chat-media";

function ehInstagram(instanceName: string): boolean {
  return instanceName === "instagram";
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
  const ctx = criarContextoChat({ idEmpresa: auth.sessao.id_empresa, instanceName, remoteJid, pagina: page, limite });

  chatLogger.log("CARREGAR_MENSAGENS_REQ", ctx, {
    raw: { instanceName, remoteJid, page, limite, strategy: "evolution-api-first" },
    rawCompleto: {
      entrada: {
        instanceName,
        remoteJid,
        page,
        limite,
      },
      usuario: {
        idEmpresa: auth.sessao.id_empresa,
        idUsuario: auth.sessao.id_usuario,
        perfil: auth.sessao.perfil,
      },
    },
  });

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
      chatLogger.log("CARREGAR_MENSAGENS_INSTAGRAM_REQ", ctx);

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

      chatLogger.log("CARREGAR_MENSAGENS_INSTAGRAM_OK", ctx, { normalizado: { total: messages.length } });

      return NextResponse.json({ messages, hasMore: false });
    } catch (error) {
      chatLogger.erro("CARREGAR_MENSAGENS_INSTAGRAM_ERRO", criarContextoChat({ instanceName, remoteJid }), error);
      return NextResponse.json(
        { erro: error instanceof Error ? error.message : "Erro ao carregar mensagens do Instagram." },
        { status: 500 },
      );
    }
  }

  const lookupRemoteJid = extrairLookupParaMensagens(remoteJid, destinoWhatsapp?.lookupRemoteJid ?? null);
  const result = await buscarMensagensPorContato(instanceName, lookupRemoteJid, page, limite);

  chatLogger.log("CARREGAR_MENSAGENS_OK", ctx, {
    normalizado: { total: result.messages.length, hasMore: result.hasMore },
    normalizadoCompleto: {
      snapshot: {
        primeiraMensagemId: result.messages[0]?.id ?? null,
        ultimaMensagemId: result.messages[result.messages.length - 1]?.id ?? null,
        lookupRemoteJid: destinoWhatsapp?.lookupRemoteJid ?? remoteJid,
      },
    },
  });

  return NextResponse.json({ messages: result.messages, hasMore: result.hasMore });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ erro: "Formulario de midia invalido." }, { status: 400 });
    }

    const instanceName = String(formData.get("instanceName") ?? "");
    const remoteJid = String(formData.get("remoteJid") ?? "");
    const caption = String(formData.get("text") ?? "");
    const arquivo = formData.get("arquivo");

    if (!instanceName || !remoteJid || !(arquivo instanceof File)) {
      return NextResponse.json({ erro: "Dados de midia invalidos." }, { status: 400 });
    }

    if (ehInstagram(instanceName)) {
      return NextResponse.json({ erro: "Envio de midia indisponivel para Instagram." }, { status: 400 });
    }

    const destinoWhatsapp = await resolverDestinoConversaWhatsapp(instanceName, remoteJid);
    if (!destinoWhatsapp) {
      return NextResponse.json({ erro: "Nao foi possivel resolver a conversa informada. Tente novamente mais tarde." }, { status: 400 });
    }

    const telefone = destinoWhatsapp.telefone ?? extrairTelefoneDeRemoteJid(remoteJid);
    const acessoPermitido = await verificarAcessoConversa(auth.sessao, telefone);
    if (!acessoPermitido) {
      return NextResponse.json({ erro: "Sem permissao para acessar esta conversa." }, { status: 403 });
    }

    const mediaType = inferirTipoMidiaArquivo(arquivo);
    const mimetype = arquivo.type || (mediaType === "sticker" ? "image/webp" : mediaType === "image" ? "image/jpeg" : "application/octet-stream");
    const ctx = criarContextoChat({ idEmpresa: auth.sessao.id_empresa, instanceName, remoteJid });

    chatLogger.log("ENVIAR_MIDIA_EVOLUTION_REQ", ctx, {
      raw: { instanceName, remoteJid, mediaType, fileName: arquivo.name, mimetype, size: arquivo.size, caption },
    });

    try {
      await enviarMidiaWhatsapp({
        instanceName,
        telefone,
        media: Buffer.from(await arquivo.arrayBuffer()).toString("base64"),
        mimetype,
        fileName: arquivo.name,
        mediaType,
        caption,
      });
    } catch (error) {
      chatLogger.erro("ENVIAR_MIDIA_EVOLUTION_ERRO", ctx, error);
      return NextResponse.json({ erro: error instanceof Error ? error.message : "Erro ao enviar midia." }, { status: 500 });
    }

    chatLogger.log("ENVIAR_MIDIA_EVOLUTION_OK", ctx, { normalizado: { fileName: arquivo.name, mediaType, mimetype } });
    return NextResponse.json({ ok: true });
  }

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
      chatLogger.log("ENVIAR_MENSAGEM_INSTAGRAM", criarContextoChat({ instanceName: validacao.data.instanceName, remoteJid: validacao.data.remoteJid }));

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
    chatLogger.log("ENVIAR_MENSAGEM_EVOLUTION_REQ", criarContextoChat({ instanceName: validacao.data.instanceName, telefone }));
    await enviarMensagemTexto({
      instanceName: validacao.data.instanceName,
      telefone,
      mensagem: validacao.data.text,
    });
  } catch (error) {
    chatLogger.erro("ENVIAR_MENSAGEM_EVOLUTION_ERRO", criarContextoChat({ instanceName: validacao.data.instanceName, telefone }), error);

    return NextResponse.json(
      { erro: error instanceof Error ? error.message : "Erro ao enviar mensagem." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
