import { NextRequest } from "next/server";
import { exigirSessao, whereLeadsPorPerfil } from "@/lib/permissoes";
import { criarRespostaSse } from "@/lib/whatsapp-chat-realtime.sse";
import type { ChatMessagesStreamParams } from "@/lib/whatsapp-chat-realtime.state";
import { buscarMensagensPorContato } from "@/lib/evolution-api.chat";
import { listarMensagensInstagramPorEmpresa } from "@/lib/integracoes/instagram-inbox";
import { prisma } from "@/lib/prisma";
import type { SessaoToken } from "@/lib/tipos";
import { extrairTelefoneDeRemoteJid, resolverDestinoConversaWhatsapp } from "@/lib/chat-remote-jid";
import { chatLogger, criarContextoChat } from "@/lib/chat-logger";

function ehInstagram(instanceName: string) {
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
  const startedAt = Date.now();
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const { searchParams } = new URL(request.url);
  const instanceName = searchParams.get("instanceName");
  const remoteJid = searchParams.get("remoteJid");
  const limite = parseInt(searchParams.get("limite") ?? "50", 10);

  if (!instanceName || !remoteJid) {
    return new Response(
      JSON.stringify({ erro: "instanceName e remoteJid sao obrigatorios." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const destinoWhatsapp = ehInstagram(instanceName)
    ? null
    : await resolverDestinoConversaWhatsapp(instanceName, remoteJid);

  if (!ehInstagram(instanceName) && !destinoWhatsapp) {
    return new Response(
      JSON.stringify({ erro: "Nao foi possivel resolver a conversa informada." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const acessoPermitido = await verificarAcessoConversa(
    auth.sessao,
    destinoWhatsapp?.telefone ?? extrairTelefoneDeRemoteJid(remoteJid),
  );
  if (!acessoPermitido) {
    return new Response(
      JSON.stringify({ erro: "Sem permissao para acessar esta conversa." }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  const lookupRemoteJid = destinoWhatsapp?.lookupRemoteJid ?? remoteJid;
  const chave = `messages:${auth.sessao.id_empresa}:${instanceName}:${lookupRemoteJid}`;
  const ctx = criarContextoChat({ idEmpresa: auth.sessao.id_empresa, instanceName, remoteJid, telefone: destinoWhatsapp?.telefone, limite });

  chatLogger.log("STREAM_MENSAGENS_REQ", ctx, {
    raw: { instanceName, remoteJid, limite, strategy: "evolution-api-first" },
    rawCompleto: {
      etapa: "entrada_stream",
      request: {
        instanceName,
        remoteJid,
        limite,
      },
      contexto: {
        idEmpresa: auth.sessao.id_empresa,
        idUsuario: auth.sessao.id_usuario,
        perfil: auth.sessao.perfil,
        lookupRemoteJid,
        destinoWhatsapp,
      },
    },
  });

  const params: ChatMessagesStreamParams = {
    tipo: "messages",
    chave,
    pollMs: 10000,
    carregarSnapshot: async () => {
      if (ehInstagram(instanceName)) {
        const mensagensIg = await listarMensagensInstagramPorEmpresa(auth.sessao.id_empresa, remoteJid, limite);

        return {
          messages: mensagensIg.map((msg) => ({
            id: msg.id,
            remoteJid,
            fromMe: msg.from_me,
            text: msg.text ?? "",
            kind: msg.attachments[0]?.type ?? "text",
            timestamp: Math.floor(new Date(msg.created_at).getTime() / 1000),
            pushName: msg.from_name ?? null,
            status: "SENT",
            hasMedia: msg.attachments.length > 0,
            mediaUrl: msg.attachments[0]?.url ?? null,
            optimistic: false,
            error: null,
          })),
          hasMore: false,
        };
      }

      const result = await buscarMensagensPorContato(instanceName, lookupRemoteJid, 1, limite);
      chatLogger.log("STREAM_MENSAGENS_SNAPSHOT_OK", ctx, {
        duracaoMs: Date.now() - startedAt,
        normalizado: { total: result.messages.length, hasMore: result.hasMore },
        normalizadoCompleto: {
          etapa: "carregar_snapshot",
          strategy: "evolution-api-first",
          response: {
            total: result.messages.length,
            hasMore: result.hasMore,
            primeiraMensagemId: result.messages[0]?.id ?? null,
            ultimaMensagemId: result.messages[result.messages.length - 1]?.id ?? null,
          },
        },
      });
      return {
        messages: result.messages,
        hasMore: result.hasMore,
      };
    },
  };

  return criarRespostaSse(params, request);
}
