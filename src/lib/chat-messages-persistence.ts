import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { buscarMensagensPorContato } from "@/lib/evolution-api.chat";
import { extrairTelefoneDeRemoteJid, resolverDestinoConversaWhatsapp } from "@/lib/chat-remote-jid";
import { chatLogger, criarContextoChat } from "@/lib/chat-logger";

export type ChatMessagePersisted = {
  id: string;
  remoteJid: string;
  fromMe: boolean;
  text: string;
  kind: string;
  timestamp: number;
  pushName: string | null;
  status: string;
  hasMedia: boolean;
  mediaUrl: string | null;
};

function whereMensagemPorTelefone(telefone: string) {
  return {
    OR: [
      { remote_jid: { contains: telefone } },
      { remote_jid_alt: { contains: telefone } },
    ],
  };
}

function mensagemPertenceAoTelefone(
  mensagem: { remoteJid: string; remoteJidAlt?: string | null },
  telefone: string,
) {
  const candidatos = [mensagem.remoteJid, mensagem.remoteJidAlt ?? null].filter(
    (jid): jid is string => typeof jid === "string" && jid.trim().length > 0,
  );

  return candidatos.some((jid) => extrairTelefoneDeRemoteJid(jid).includes(telefone));
}

async function sincronizarMensagensWhatsapp(params: {
  idEmpresa: string;
  instanceName: string;
  remoteJid: string;
  limite: number;
}) {
  const startedAt = Date.now();
  const destino = await resolverDestinoConversaWhatsapp(params.instanceName, params.remoteJid);
  if (!destino) {
    chatLogger.erro(
      "CHAT_PERSIST_SYNC_DESTINO_ERRO",
      criarContextoChat({ idEmpresa: params.idEmpresa, instanceName: params.instanceName, remoteJid: params.remoteJid }),
      new Error("Destino nao resolvido"),
    );
    return;
  }

  chatLogger.log("CHAT_PERSIST_SYNC_REQ", criarContextoChat({ idEmpresa: params.idEmpresa, instanceName: params.instanceName, remoteJid: params.remoteJid, telefone: destino.telefone }), {
    raw: { limite: params.limite },
    rawCompleto: {
      etapa: "resolver_destino",
      request: {
        idEmpresa: params.idEmpresa,
        instanceName: params.instanceName,
        remoteJidOriginal: params.remoteJid,
        limiteSolicitado: params.limite,
      },
      destinoResolvido: destino,
    },
  });

  const instancia = await prisma.whatsappInstancia.findFirst({
    where: {
      id_empresa: params.idEmpresa,
      instance_name: params.instanceName,
      status: { in: ["ATIVO", "open", "connecting"] },
    },
    select: { id: true },
  });

  if (!instancia) {
    chatLogger.erro(
      "CHAT_PERSIST_SYNC_INSTANCIA_ERRO",
      criarContextoChat({ idEmpresa: params.idEmpresa, instanceName: params.instanceName, remoteJid: params.remoteJid, telefone: destino.telefone }),
      new Error("Instancia ativa nao encontrada"),
      { rawResponse: { idEmpresa: params.idEmpresa, instanceName: params.instanceName } },
    );
    return;
  }

  const resposta = await buscarMensagensPorContato(params.instanceName, destino.lookupRemoteJid, 1, params.limite);
  chatLogger.log("CHAT_PERSIST_SYNC_EVOLUTION_RES", criarContextoChat({ idEmpresa: params.idEmpresa, instanceName: params.instanceName, remoteJid: params.remoteJid, telefone: destino.telefone }), {
    normalizado: { totalMensagens: resposta.messages.length, hasMore: resposta.hasMore },
    normalizadoCompleto: {
      etapa: "buscar_mensagens_contato",
      request: {
        instanceName: params.instanceName,
        lookupRemoteJid: destino.lookupRemoteJid,
        pagina: 1,
        limite: params.limite,
      },
      response: resposta,
    },
  });

  if (resposta.messages.length === 0) {
    chatLogger.log("CHAT_PERSIST_SYNC_VAZIO", criarContextoChat({ idEmpresa: params.idEmpresa, instanceName: params.instanceName, remoteJid: params.remoteJid, telefone: destino.telefone }), {
      duracaoMs: Date.now() - startedAt,
      normalizado: { totalPersistidas: 0, motivo: "Evolution retornou zero mensagens" },
    });
    return;
  }

  chatLogger.log("CHAT_PERSIST_SYNC_OK", criarContextoChat({ idEmpresa: params.idEmpresa, instanceName: params.instanceName, remoteJid: params.remoteJid, telefone: destino.telefone }), {
    normalizado: { total: resposta.messages.length },
  });

  const telefone = destino.telefone;

  let totalPersistidas = 0;
  let totalIgnoradasPorTelefone = 0;
  for (const mensagem of resposta.messages) {
    if (!mensagemPertenceAoTelefone(mensagem, telefone)) {
      totalIgnoradasPorTelefone += 1;
      continue;
    }

    await prisma.whatsappMensagem.upsert({
      where: {
        id_whatsapp_instancia_mensagem_id: {
          id_whatsapp_instancia: instancia.id,
          mensagem_id: mensagem.id,
        },
      },
      create: {
        id: randomUUID(),
        id_empresa: params.idEmpresa,
        id_whatsapp_instancia: instancia.id,
        id_lead: null,
        mensagem_id: mensagem.id,
        remote_jid: mensagem.remoteJid,
        remote_jid_alt: null,
        from_me: mensagem.fromMe,
        tipo: mensagem.kind,
        conteudo: mensagem.text,
        push_name: mensagem.pushName,
        status: mensagem.status,
        timestamp: mensagem.timestamp,
        erro: null,
        payload_json: JSON.stringify(mensagem),
      },
      update: {
        remote_jid: mensagem.remoteJid,
        remote_jid_alt: null,
        from_me: mensagem.fromMe,
        tipo: mensagem.kind,
        conteudo: mensagem.text,
        push_name: mensagem.pushName,
        status: mensagem.status,
        timestamp: mensagem.timestamp,
        erro: null,
        payload_json: JSON.stringify(mensagem),
      },
    });
    totalPersistidas += 1;
  }

  chatLogger.log("CHAT_PERSIST_SYNC_DB_OK", criarContextoChat({ idEmpresa: params.idEmpresa, instanceName: params.instanceName, remoteJid: params.remoteJid, telefone: destino.telefone }), {
    duracaoMs: Date.now() - startedAt,
    normalizado: { totalRecebidas: resposta.messages.length, totalPersistidas, totalIgnoradasPorTelefone },
    normalizadoCompleto: {
      etapa: "persistencia_finalizada",
      request: {
        idWhatsappInstancia: instancia.id,
        filtroTelefone: telefone,
      },
      response: {
        totalRecebidas: resposta.messages.length,
        totalPersistidas,
        totalIgnoradasPorTelefone,
      },
    },
  });
}

export async function obterSnapshotMensagensPersistente(params: {
  idEmpresa: string;
  instanceName: string;
  remoteJid: string;
  page: number;
  limite: number;
}): Promise<{ messages: ChatMessagePersisted[]; hasMore: boolean }> {
  const startedAt = Date.now();
  const destino = await resolverDestinoConversaWhatsapp(params.instanceName, params.remoteJid);
  if (!destino) {
    chatLogger.erro("CHAT_PERSIST_SNAPSHOT_ERRO", criarContextoChat({ idEmpresa: params.idEmpresa, instanceName: params.instanceName, remoteJid: params.remoteJid }), new Error("Destino nao resolvido"));
    return { messages: [], hasMore: false };
  }

  await sincronizarMensagensWhatsapp({
    idEmpresa: params.idEmpresa,
    instanceName: params.instanceName,
    remoteJid: params.remoteJid,
    limite: Math.max(params.limite, 100),
  }).catch((error) => {
    console.warn("[ChatPersistence] Falha ao sincronizar mensagens da Evolution", {
      instanceName: params.instanceName,
      remoteJid: params.remoteJid,
      erro: error instanceof Error ? error.message : String(error),
    });
  });

  const instancia = await prisma.whatsappInstancia.findFirst({
    where: {
      id_empresa: params.idEmpresa,
      instance_name: params.instanceName,
    },
    select: { id: true },
  });

  if (!instancia) {
    chatLogger.erro("CHAT_PERSIST_INSTANCIA_ERRO", criarContextoChat({ idEmpresa: params.idEmpresa, instanceName: params.instanceName, remoteJid: params.remoteJid }), new Error("Instancia nao encontrada"));
    return { messages: [], hasMore: false };
  }

  const skip = Math.max(0, (params.page - 1) * params.limite);
  const take = Math.max(1, params.limite);

  const where = {
    id_empresa: params.idEmpresa,
    id_whatsapp_instancia: instancia.id,
    ...whereMensagemPorTelefone(destino.telefone),
  };

  const [total, registros] = await Promise.all([
    prisma.whatsappMensagem.count({ where }),
    prisma.whatsappMensagem.findMany({
      where,
      orderBy: [
        { timestamp: "desc" },
        { criado_em: "desc" },
      ],
      skip,
      take,
      select: {
        id: true,
        remote_jid: true,
        from_me: true,
        conteudo: true,
        tipo: true,
        timestamp: true,
        push_name: true,
        status: true,
      },
    }),
  ]);

  const ordered = [...registros].reverse();
  const messages = ordered.map((registro) => ({
    id: registro.id,
    remoteJid: registro.remote_jid,
    fromMe: registro.from_me,
    text: registro.conteudo ?? "",
    kind: registro.tipo,
    timestamp: registro.timestamp,
    pushName: registro.push_name,
    status: registro.status,
    hasMedia: ["imageMessage", "videoMessage", "audioMessage", "documentMessage", "stickerMessage"].includes(registro.tipo),
    mediaUrl: null,
  }));

  const resultado = {
    messages,
    hasMore: skip + registros.length < total,
  };
  chatLogger.log("CHAT_PERSIST_SNAPSHOT_OK", criarContextoChat({ idEmpresa: params.idEmpresa, instanceName: params.instanceName, remoteJid: params.remoteJid, telefone: destino.telefone, pagina: params.page, limite: params.limite }), {
    duracaoMs: Date.now() - startedAt,
    normalizado: { total: messages.length, hasMore: resultado.hasMore },
    normalizadoCompleto: {
      etapa: "snapshot_query",
      request: {
        idEmpresa: params.idEmpresa,
        instanceName: params.instanceName,
        remoteJid: params.remoteJid,
        page: params.page,
        limite: params.limite,
        where,
        skip,
        take,
      },
      response: {
        totalBanco: total,
        retornadas: registros.length,
        hasMore: resultado.hasMore,
        primeiraId: messages[0]?.id ?? null,
        ultimaId: messages[messages.length - 1]?.id ?? null,
      },
    },
  });
  return resultado;
}
