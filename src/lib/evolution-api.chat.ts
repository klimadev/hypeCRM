import type { EvolutionContato, EvolutionConversa, EvolutionMensagem } from "./evolution-api.types";
import {
  agruparConversasPorBuscaEvolution,
  deduplicarMensagensPorContatoEvolution,
  mapearContatoEvolution,
  mapearConversaEvolution,
} from "./evolution-api.utils";
import { selecionarRemoteJidPreferencial } from "./chat-remote-jid";
import { normalizarMensagensEvolution } from "./whatsapp-chat.normalization";
import { chatLogger, criarContextoChat } from "./chat-logger";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? "";
const EVOLUTION_FETCH_TIMEOUT_MS = 20_000;

const headers = {
  "Content-Type": "application/json",
  apikey: EVOLUTION_API_KEY,
};

async function lerJsonErro(resposta: Response) {
  return await resposta.json().catch(() => ({}));
}

async function fetchEvolution(path: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EVOLUTION_FETCH_TIMEOUT_MS);

  try {
    return await fetch(`${EVOLUTION_API_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tempo limite ao consultar Evolution API.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

type MensagemContatoLookup = {
  key?: {
    fromMe?: boolean;
    remoteJid?: string;
    remoteJidAlt?: string;
  };
  pushName?: string | null;
};

export function extrairContatoCanonicalDeMensagens(registros: MensagemContatoLookup[]) {
  let pushName: string | null = null;
  let remoteJidCanonico: string | null = null;

  for (const msg of registros) {
    if (!pushName && msg.key?.fromMe === false && msg.pushName && msg.pushName.trim().length > 0) {
      pushName = msg.pushName.trim();
    }

    const jidPreferencial = selecionarRemoteJidPreferencial(
      msg.key?.remoteJid ?? "",
      msg.key?.remoteJidAlt,
    );

    if (jidPreferencial.includes("@s.whatsapp.net")) {
      remoteJidCanonico = jidPreferencial;
    }
  }

  return { pushName, remoteJidCanonico };
}

export async function buscarContatos(instanceName: string): Promise<EvolutionContato[]> {
  const ctx = criarContextoChat({ instanceName });
  chatLogger.log("EVOLUTION_FIND_CHATS_REQ", ctx, { raw: { path: `/chat/findChats/${instanceName}` } });
  const resposta = await fetchEvolution(`/chat/findChats/${instanceName}`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });

  if (!resposta.ok) {
    const erro = await lerJsonErro(resposta);
    chatLogger.erro("EVOLUTION_FIND_CHATS_ERRO", ctx, erro, { rawResponse: erro });
    throw new Error(erro.message ?? "Erro ao buscar conversas na Evolution");
  }

  const json = (await resposta.json().catch(() => ({}))) as Array<{
    remoteJid?: string;
    remoteJidAlt?: string | null;
    pushName?: string | null;
    isGroup?: boolean;
    lastMessage?: { key?: { remoteJidAlt?: string }; pushName?: string };
  }>;

  const resultado = json.map(mapearContatoEvolution).filter((item): item is EvolutionContato => item !== null);
  chatLogger.log("EVOLUTION_FIND_CHATS_OK", ctx, { normalizado: { total: resultado.length } });
  return resultado;
}

export async function buscarConversas(instanceName: string): Promise<EvolutionConversa[]> {
  const ctx = criarContextoChat({ instanceName });
  chatLogger.log("EVOLUTION_FIND_CHATS_REQ", ctx, { raw: { path: `/chat/findChats/${instanceName}` } });
  const resposta = await fetchEvolution(`/chat/findChats/${instanceName}`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });

  if (!resposta.ok) {
    const erro = await lerJsonErro(resposta);
    chatLogger.erro("EVOLUTION_FIND_CHATS_ERRO", ctx, erro, { rawResponse: erro });
    throw new Error(erro.message ?? "Erro ao buscar conversas na Evolution");
  }

  const raw = await resposta.json().catch(() => ({}));
  const json = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.chats)
      ? raw.chats
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.messages)
          ? raw.messages
          : Array.isArray(raw?.records)
            ? raw.records
            : [];

  type ConversaRaw = {
    remoteJid?: string;
    remoteJidAlt?: string;
    pushName?: string | null;
    isGroup?: boolean;
    lastMessage?: { key?: { remoteJid?: string; remoteJidAlt?: string; fromMe?: boolean }; pushName?: string };
    messageTimestamp?: number;
  };

  const mapped: (EvolutionConversa | null)[] = json.map((item: ConversaRaw) => {
    const mapped = mapearConversaEvolution(item);
    if (mapped && item.messageTimestamp) {
      mapped.messageTimestamp = item.messageTimestamp;
    }
    return mapped;
  });

  const resultado = mapped.filter((item): item is EvolutionConversa => item !== null);
  chatLogger.log("EVOLUTION_FIND_CHATS_OK", ctx, { normalizado: { total: resultado.length } });
  return resultado;
}

export type ConversasPaginadoResult = {
  conversas: EvolutionConversa[];
  temMais: boolean;
};

export async function buscarConversasPaginado(
  instanceName: string,
  pagina: number = 1,
  limite: number = 100,
): Promise<ConversasPaginadoResult> {
  const ctx = criarContextoChat({ instanceName, pagina, limite });
  chatLogger.log("EVOLUTION_FIND_CHATS_PAGINADO_REQ", ctx, { raw: { path: `/chat/findChats/${instanceName}`, take: limite, skip: (pagina - 1) * limite } });
  const resposta = await fetchEvolution(`/chat/findChats/${instanceName}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      take: limite,
      skip: (pagina - 1) * limite,
    }),
  });

  if (!resposta.ok) {
    const erro = await lerJsonErro(resposta);
    chatLogger.erro("EVOLUTION_FIND_CHATS_PAGINADO_ERRO", ctx, erro, { rawResponse: erro });
    throw new Error(erro.message ?? "Erro ao buscar conversas na Evolution");
  }

  const raw = await resposta.json().catch(() => ({}));
  const json = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.chats)
      ? raw.chats
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.messages)
          ? raw.messages
          : Array.isArray(raw?.records)
            ? raw.records
            : [];

  // Detectar se tem mais paginas
  const totalPaginas = raw?.pages ?? raw?.totalPages ?? raw?.total_pages ?? undefined;
  const temMais = typeof totalPaginas === "number" ? pagina < totalPaginas : json.length >= limite;

  type ConversaRaw = {
    remoteJid?: string;
    remoteJidAlt?: string;
    pushName?: string | null;
    isGroup?: boolean;
    lastMessage?: { key?: { remoteJid?: string; remoteJidAlt?: string; fromMe?: boolean }; pushName?: string };
    messageTimestamp?: number;
  };

  const mapped: (EvolutionConversa | null)[] = json.map((item: ConversaRaw) => {
    const mapped = mapearConversaEvolution(item);
    if (mapped && item.messageTimestamp) {
      mapped.messageTimestamp = item.messageTimestamp;
    }
    return mapped;
  });

  const baseConversas = mapped.filter((item): item is EvolutionConversa => item !== null);

  const conversasEnriquecidas = await Promise.all(
    baseConversas.map(async (conv) => {
      if (conv.isGroup) return conv;

      try {
        const jidParaBusca = (conv.remoteJidAlt ?? conv.remoteJid).trim();
        const msgRes = await fetchEvolution(`/chat/findMessages/${instanceName}`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            where: { key: { remoteJid: jidParaBusca, remoteJidAlt: jidParaBusca } },
            page: 1,
            offset: 0,
            take: 20,
          }),
        });

        if (msgRes.ok) {
          const msgJson = await msgRes.json().catch(() => ({}));
          const registros = msgJson.messages?.records ?? [];

          const { pushName, remoteJidCanonico } = extrairContatoCanonicalDeMensagens(registros);

          if (pushName) {
            conv.pushName = pushName;
          }

          if (remoteJidCanonico) {
            conv.remoteJid = remoteJidCanonico;
            conv.remoteJidAlt = remoteJidCanonico;
            conv.lookupRemoteJid = remoteJidCanonico;

            if (conv.lastMessage?.key) {
              conv.lastMessage.key.remoteJid = remoteJidCanonico;
              conv.lastMessage.key.remoteJidAlt = remoteJidCanonico;
            }
          }
        }
      } catch (e) {
        // Ignora erro
      }
      return conv;
    })
  );

  const resultado = {
    conversas: conversasEnriquecidas,
    temMais,
  };
  chatLogger.log("EVOLUTION_FIND_CHATS_PAGINADO_OK", ctx, { normalizado: { total: resultado.conversas.length, temMais: resultado.temMais } });
  return resultado;
}

export async function buscarConversasEvolution(
  instanceName: string,
  termo: string,
  page: number = 1,
  offset: number = 30,
): Promise<EvolutionConversa[]> {
  const ctx = criarContextoChat({ instanceName, busca: termo, pagina: page, limite: offset });
  chatLogger.log("EVOLUTION_FIND_CHATS_REQ", ctx, {
    raw: { termo, page, offset },
    rawCompleto: {
      path: `/chat/findMessages/${instanceName}`,
      method: "POST",
      body: {
        where: {
          key: {
            remoteJid: termo,
            remoteJidAlt: termo,
            senderPn: termo,
          },
          pushName: termo,
        },
        page,
        offset,
      },
    },
  });
  const resposta = await fetchEvolution(`/chat/findMessages/${instanceName}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      where: {
        key: {
          remoteJid: termo,
          remoteJidAlt: termo,
          senderPn: termo,
        },
        pushName: termo,
      },
      page,
      offset,
    }),
  });

  if (!resposta.ok) {
    const erro = await lerJsonErro(resposta);
    throw new Error(erro.message ?? "Erro ao buscar conversas na Evolution");
  }

  const json = (await resposta.json().catch(() => ({}))) as {
    messages?: {
      records?: Array<{
        key?: { remoteJid?: string; remoteJidAlt?: string; fromMe?: boolean };
        pushName?: string | null;
        messageTimestamp?: number;
      }>;
      pages?: number;
    };
  };

  chatLogger.log("EVOLUTION_FIND_CHATS_RAW_RESPONSE", ctx, {
    rawResponse: {
      status: resposta.status,
      ok: resposta.ok,
      totalRegistrosBrutos: json.messages?.records?.length ?? 0,
      totalPaginas: json.messages?.pages ?? null,
    },
    rawResponseCompleta: {
      status: resposta.status,
      statusText: resposta.statusText,
      response: json,
    },
  });

  return agruparConversasPorBuscaEvolution(json.messages?.records ?? []);
}

export async function buscarMensagens(
  instanceName: string,
  limitePorPagina: number = 1000,
): Promise<EvolutionMensagem[]> {
  const todasMensagens: EvolutionMensagem[] = [];
  let pagina = 1;
  let temMaisPaginas = true;

  while (temMaisPaginas) {
    const resposta = await fetchEvolution(`/chat/findMessages/${instanceName}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ limit: limitePorPagina, page: pagina }),
    });

    if (!resposta.ok) {
      const erro = await lerJsonErro(resposta);
      chatLogger.erro("EVOLUTION_FIND_MESSAGES_ERRO", criarContextoChat({ instanceName, pagina, limite: limitePorPagina }), erro, { rawResponse: erro });
      throw new Error(erro.message ?? "Erro ao buscar mensagens na Evolution");
    }

    const json = (await resposta.json().catch(() => ({}))) as {
      messages?: {
        records?: Array<{
          key?: { remoteJid?: string; remoteJidAlt?: string };
          lastMessage?: { key?: { remoteJidAlt?: string } };
          pushName?: string | null;
          messageTimestamp?: number;
        }>;
        pages?: number;
      };
    };

    const registros = json.messages?.records ?? [];
    if (registros.length === 0) {
      temMaisPaginas = false;
      break;
    }

    for (const msg of registros) {
      const remoteJid = msg.key?.remoteJid ?? "";
      if (!remoteJid || remoteJid.includes("@g.us") || remoteJid === "status@broadcast") {
        continue;
      }

      todasMensagens.push({
        remoteJid,
        remoteJidAlt: msg.key?.remoteJidAlt ?? null,
        remoteJidAltLastMessage: msg.lastMessage?.key?.remoteJidAlt ?? null,
        pushName: msg.pushName ?? null,
        messageTimestamp: msg.messageTimestamp ?? 0,
      });
    }

    const totalPaginas = json.messages?.pages ?? 1;
    if (pagina >= totalPaginas) {
      temMaisPaginas = false;
    } else {
      pagina += 1;
    }
  }

  return deduplicarMensagensPorContatoEvolution(todasMensagens);
}

export type EvolutionMensagemDetalhada = {
  id?: string;
  key?: {
    id?: string;
    remoteJid?: string;
    fromMe?: boolean;
  };
  pushName?: string | null;
  messageTimestamp?: number;
  message?: {
    conversation?: string;
    extendedTextMessage?: { text?: string };
    imageMessage?: { caption?: string };
    videoMessage?: { caption?: string };
    documentMessage?: { fileName?: string };
    stickerMessage?: Record<string, unknown>;
    audioMessage?: Record<string, unknown>;
    locationMessage?: Record<string, unknown>;
    contactMessage?: Record<string, unknown>;
    reactionMessage?: { text?: string };
    listMessage?: Record<string, unknown>;
    buttonsMessage?: Record<string, unknown>;
    templateMessage?: Record<string, unknown>;
    liveLocationMessage?: Record<string, unknown>;
    orderMessage?: Record<string, unknown>;
    protocolMessage?: Record<string, unknown>;
  };
  messageType?: string;
};

export async function buscarMensagensPorContato(
  instanceName: string,
  remoteJid: string,
  pagina: number = 1,
  limite: number = 50,
): Promise<{
  messages: Array<{
    id: string;
    remoteJid: string;
    remoteJidAlt: string | null;
    fromMe: boolean;
    text: string;
    kind: string;
    timestamp: number;
    timestampIso: string;
    pushName: string | null;
    status: string;
    hasMedia: boolean;
    mediaUrl: string | null;
    dadosAd?: {
      titulo: string | null;
      corpo: string | null;
      urlOrigem: string | null;
      idConversao: string | null;
      urlThumbnail: string | null;
      tipoOrigem: string | null;
      appOrigem: string | null;
      formato: "ctwa" | null;
    } | null;
  }>;
  hasMore: boolean;
}> {
  const startedAt = Date.now();
  const ctx = criarContextoChat({ instanceName, remoteJid, pagina, limite });
  const lookupRemoteJid = remoteJid.trim();
  const payload = {
    where: {
      key: { remoteJid: lookupRemoteJid, remoteJidAlt: lookupRemoteJid },
    },
    page: pagina,
    offset: limite,
  };

  chatLogger.log("EVOLUTION_FIND_MESSAGES_REQ", ctx, {
    raw: payload,
    rawCompleto: {
      path: `/chat/findMessages/${instanceName}`,
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY ? "[MASKED]" : "" },
      body: payload,
    },
  });
  type MensagemRaw = {
    key?: { id?: string; remoteJid?: string; remoteJidAlt?: string; fromMe?: boolean };
    lastMessage?: { key?: { remoteJidAlt?: string } };
    pushName?: string | null;
    messageTimestamp?: number;
    messageType?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
      imageMessage?: { caption?: string };
      videoMessage?: { caption?: string };
      audioMessage?: Record<string, unknown>;
      documentMessage?: { fileName?: string };
      stickerMessage?: Record<string, unknown>;
      reactionMessage?: { text?: string };
      locationMessage?: Record<string, unknown>;
      contactMessage?: Record<string, unknown>;
      listMessage?: Record<string, unknown>;
      buttonsMessage?: Record<string, unknown>;
      templateMessage?: Record<string, unknown>;
      liveLocationMessage?: Record<string, unknown>;
      orderMessage?: Record<string, unknown>;
      protocolMessage?: Record<string, unknown>;
    };
  };

  const resposta = await fetchEvolution(`/chat/findMessages/${instanceName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!resposta.ok) {
    const erro = await lerJsonErro(resposta);
    chatLogger.erro("EVOLUTION_FIND_MESSAGES_ERRO", ctx, erro, { rawResponse: erro });
    throw new Error(erro.message ?? "Erro ao buscar mensagens na Evolution");
  }

  const json = (await resposta.json().catch(() => ({}))) as {
    messages?: {
      records?: MensagemRaw[];
      pages?: number;
      total?: number;
    };
  };

  const registros = json.messages?.records ?? [];
  const totalPaginas = json.messages?.pages ?? 1;
  const hasMore = pagina < totalPaginas;

  const amostra = registros.slice(0, 5).map((msg, index) => ({
    index,
    id: msg.key?.id ?? null,
    fromMe: msg.key?.fromMe ?? null,
    remoteJid: msg.key?.remoteJid ?? null,
    remoteJidAlt: msg.key?.remoteJidAlt ?? null,
    lastMessageRemoteJidAlt: msg.lastMessage?.key?.remoteJidAlt ?? null,
    pushName: msg.pushName ?? null,
      messageTimestamp: msg.messageTimestamp ?? null,
    }));

  chatLogger.log("EVOLUTION_FIND_MESSAGES_RAW_RESPONSE", ctx, {
    duracaoMs: Date.now() - startedAt,
    rawResponse: {
      status: resposta.status,
      ok: resposta.ok,
      totalRegistrosBrutos: registros.length,
      totalPaginas,
      hasMore,
      totalInformado: json.messages?.total ?? null,
    },
    rawResponseCompleta: {
      status: resposta.status,
      statusText: resposta.statusText,
      headers: {
        contentType: resposta.headers.get("content-type"),
        contentLength: resposta.headers.get("content-length"),
      },
      request: payload,
      response: json,
    },
    meta: {
      amostra,
    },
  });

  const mensagensNormalizadas = normalizarMensagensEvolution(json).filter(
    (msg) => !msg.remoteJid.includes("@g.us") && msg.remoteJid !== "status@broadcast",
  );
  const tiposComMedia = new Set(["imageMessage", "videoMessage", "audioMessage", "documentMessage", "stickerMessage"]);
  const mensagens = mensagensNormalizadas.map((msg) => {
    const hasMedia = tiposComMedia.has(msg.kind);
    const text = msg.text || msg.conteudo;
    const pushName = msg.fromMe ? null : msg.pushName;

    if (remoteJid.includes("@lid") || msg.remoteJidAlt?.includes("@lid") || msg.remoteJid.includes("@lid")) {
      chatLogger.log("EVOLUTION_FIND_MESSAGES_LID_TRACE", ctx, {
        raw: {
          id: msg.messageId,
          fromMe: msg.fromMe,
          remoteJid: msg.remoteJid,
          remoteJidAlt: msg.remoteJidAlt,
          pushName,
          messageTimestamp: msg.timestamp,
        },
        rawCompleto: {
          message: msg,
          interpretacao: {
            remoteJid: msg.remoteJid,
            remoteJidAlt: msg.remoteJidAlt,
            fromMe: msg.fromMe,
            pushName,
            kind: msg.kind,
            text,
            hasMedia,
            status: msg.status,
          },
        },
      });
    }

    return {
      id: msg.messageId,
      remoteJid: msg.remoteJid,
      remoteJidAlt: msg.remoteJidAlt,
      fromMe: msg.fromMe,
      text,
      kind: msg.kind,
      timestamp: msg.timestamp,
      timestampIso: msg.timestampIso,
      pushName,
      status: msg.status,
      hasMedia,
      mediaUrl: null,
      dadosAd: msg.dadosAd ?? null,
    };
  });

  const resultado = { messages: mensagens, hasMore };
  chatLogger.log("EVOLUTION_FIND_MESSAGES_OK", ctx, {
    duracaoMs: Date.now() - startedAt,
    normalizado: { total: mensagens.length, hasMore },
    normalizadoCompleto: {
      filtragem: {
        totalBruto: registros.length,
        totalNormalizado: mensagens.length,
        removidasPorGrupoOuStatus: Math.max(registros.length - mensagens.length, 0),
      },
      previewIds: mensagens.slice(0, 10).map((msg) => msg.id),
    },
  });
  return resultado;
}
