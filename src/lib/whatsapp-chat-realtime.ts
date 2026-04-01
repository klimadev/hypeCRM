import { prisma } from "@/lib/prisma";
import { buscarConversas, buscarConversasEvolution } from "@/lib/evolution-api";
import type { SessaoToken } from "@/lib/tipos";
import {
  buscarConnectionStatus,
  buscarLeadComAcesso,
  buscarLeadPorTelefoneComAcesso,
  buscarMensagensEvolution,
  mapearMensagemDbParaCanonica,
  normalizarMensagensEvolution,
  normalizarRemoteJidParaLead,
  resolverInstanciaDoLead,
  resolverInstanciaPorTelefone,
  upsertMensagensNoBanco,
  type InstanciaResolvida,
} from "@/lib/whatsapp-chat";
import type { ChatConnectionStatus, ConversaResumo, ConversasResponse, WhatsappChatMessage } from "@/modules/whatsapp/types";

const encoder = new TextEncoder();
const CHAT_SYNC_TTL_MS = 30_000;
const HEARTBEAT_MS = 15000;
const DEFAULT_MESSAGES_POLL_MS = 10000;
const DEFAULT_CONVERSATIONS_POLL_MS = 10000;

type MensagensSnapshot = {
  messages: WhatsappChatMessage[];
  connectionStatus: ChatConnectionStatus;
  unreadCount: number;
};

type ChatStreamParams = {
  tipo: "chat";
  chave: string;
  pollMs?: number;
  carregarSnapshot: () => Promise<MensagensSnapshot>;
};

type ConversationsStreamParams = {
  tipo: "conversations";
  chave: string;
  pollMs?: number;
  carregarSnapshot: () => Promise<ConversasResponse>;
};

type StreamChannelParams = ChatStreamParams | ConversationsStreamParams;

type StreamEventPayload = {
  connectedAt?: string;
  erro?: string;
  unreadCount?: number;
  connectionStatus?: ChatConnectionStatus;
  messages?: WhatsappChatMessage[];
  conversas?: ConversaResumo[];
  cursor?: string | null;
  temMais?: boolean;
  ts?: string;
};

type Subscriber = {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

type StreamChannel = {
  tipo: StreamChannelParams["tipo"];
  chave: string;
  pollMs: number;
  subscribers: Map<string, Subscriber>;
  heartbeat: ReturnType<typeof setInterval> | null;
  polling: ReturnType<typeof setTimeout> | null;
  inFlight: Promise<void> | null;
  carregarSnapshot: () => Promise<MensagensSnapshot | ConversasResponse>;
  ultimoHash: string | null;
};

type ChatSnapshotCache = {
  promise: Promise<MensagensSnapshot> | null;
  snapshot: MensagensSnapshot | null;
  expiresAt: number;
};

type GlobalRealtimeState = {
  channels: Map<string, StreamChannel>;
  chatCache: Map<string, ChatSnapshotCache>;
};

declare global {
  var __whatsappChatRealtimeState: GlobalRealtimeState | undefined;
}

function obterEstadoGlobal(): GlobalRealtimeState {
  if (!globalThis.__whatsappChatRealtimeState) {
    globalThis.__whatsappChatRealtimeState = {
      channels: new Map(),
      chatCache: new Map(),
    };
  }

  return globalThis.__whatsappChatRealtimeState;
}

function serializarEvento(event: string, data: StreamEventPayload) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function publicar(channel: StreamChannel, event: string, data: StreamEventPayload) {
  for (const [subscriberId, subscriber] of channel.subscribers.entries()) {
    try {
      subscriber.controller.enqueue(serializarEvento(event, data));
    } catch {
      channel.subscribers.delete(subscriberId);
    }
  }
}

function limparCanal(chave: string) {
  const estado = obterEstadoGlobal();
  const channel = estado.channels.get(chave);
  if (!channel) {
    return;
  }

  if (channel.heartbeat) {
    clearInterval(channel.heartbeat);
  }

  if (channel.polling) {
    clearTimeout(channel.polling);
  }

  estado.channels.delete(chave);
}

function agendarPolling(channel: StreamChannel) {
  if (channel.polling) {
    clearTimeout(channel.polling);
  }

  if (channel.subscribers.size === 0) {
    limparCanal(channel.chave);
    return;
  }

  channel.polling = setTimeout(() => {
    void executarPolling(channel);
  }, channel.pollMs);
}

async function executarPolling(channel: StreamChannel) {
  if (channel.inFlight || channel.subscribers.size === 0) {
    agendarPolling(channel);
    return;
  }

  const tarefa = (async () => {
    try {
      const snapshot = await channel.carregarSnapshot();
      const hash = JSON.stringify(snapshot);

      if (hash !== channel.ultimoHash) {
        channel.ultimoHash = hash;

        if (channel.tipo === "chat") {
          const dados = snapshot as MensagensSnapshot;
          publicar(channel, "snapshot", {
            messages: dados.messages,
            unreadCount: dados.unreadCount,
            connectionStatus: dados.connectionStatus,
          });
        } else {
          const dados = snapshot as ConversasResponse;
          publicar(channel, "snapshot", {
            conversas: dados.conversas,
            cursor: dados.cursor,
            temMais: dados.temMais,
          });
        }
      }
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro ao sincronizar stream.";
      publicar(channel, "error", {
        erro: mensagem,
        ts: new Date().toISOString(),
      });
    } finally {
      channel.inFlight = null;
      agendarPolling(channel);
    }
  })();

  channel.inFlight = tarefa;
  await tarefa;
}

function criarCanal(params: StreamChannelParams): StreamChannel {
  const channel: StreamChannel = {
    tipo: params.tipo,
    chave: params.chave,
    pollMs:
      params.pollMs ??
      (params.tipo === "chat" ? DEFAULT_MESSAGES_POLL_MS : DEFAULT_CONVERSATIONS_POLL_MS),
    subscribers: new Map(),
    heartbeat: null,
    polling: null,
    inFlight: null,
    carregarSnapshot: params.carregarSnapshot,
    ultimoHash: null,
  };

  channel.heartbeat = setInterval(() => {
    if (channel.subscribers.size === 0) {
      limparCanal(channel.chave);
      return;
    }

    publicar(channel, "heartbeat", { ts: new Date().toISOString() });
  }, HEARTBEAT_MS);

  return channel;
}

export function criarRespostaSse(params: StreamChannelParams, request: Request) {
  const estado = obterEstadoGlobal();
  const channel = estado.channels.get(params.chave) ?? criarCanal(params);
  estado.channels.set(params.chave, channel);

  const subscriberId = `${params.chave}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      channel.subscribers.set(subscriberId, { id: subscriberId, controller });
      controller.enqueue(serializarEvento("connected", { connectedAt: new Date().toISOString() }));
      void executarPolling(channel);

      request.signal.addEventListener(
        "abort",
        () => {
          channel.subscribers.delete(subscriberId);
          if (channel.subscribers.size === 0) {
            limparCanal(channel.chave);
          }
        },
        { once: true },
      );
    },
    cancel() {
      channel.subscribers.delete(subscriberId);
      if (channel.subscribers.size === 0) {
        limparCanal(channel.chave);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

type SnapshotParamsLead = {
  tipo: "lead";
  leadId: string;
};

type SnapshotParamsTelefone = {
  tipo: "telefone";
  phoneNumber: string;
  instanceName: string;
};

type SnapshotParams = SnapshotParamsLead | SnapshotParamsTelefone;

export async function obterSnapshotMensagens(
  sessao: SessaoToken,
  params: SnapshotParams,
): Promise<MensagensSnapshot> {
  // Resolve lead/telefone e instância
  let leadId: string;
  let phoneNumber: string;
  let instancia: InstanciaResolvida;

  if (params.tipo === "lead") {
    const lead = await buscarLeadComAcesso(sessao, params.leadId);
    if (!lead) {
      throw new Error("Lead nao encontrado.");
    }
    leadId = lead.id;
    phoneNumber = lead.telefone;
    
    // Primeiro tenta resolver via PDV do lead
    let instanciaEncontrada = await resolverInstanciaDoLead(sessao.id_empresa, lead.id);
    
    // Fallback: se não tem PDV ou instância, busca qualquer instância conectada
    if (!instanciaEncontrada) {
      instanciaEncontrada = await resolverInstanciaPorTelefone(sessao.id_empresa, lead.telefone);
    }

    if (!instanciaEncontrada) {
      throw new Error("Nenhuma instância WhatsApp conectada.");
    }
    instancia = instanciaEncontrada;
  } else {
    // tipo === "telefone" - não requer lead no CRM
    leadId = "";
    phoneNumber = params.phoneNumber;
    instancia = {
      pdvId: "",
      pdvNome: "",
      id: "",
      instanceName: params.instanceName,
    };
  }

  const remoteJidInfo = normalizarRemoteJidParaLead(phoneNumber);
  if (!remoteJidInfo.ok) {
    throw new Error(remoteJidInfo.erro);
  }

  const cacheKey = `${sessao.id_empresa}:${instancia.id}:${leadId || phoneNumber}`;
  const estado = obterEstadoGlobal();
  const agora = Date.now();
  const cache = estado.chatCache.get(cacheKey);

  if (cache?.promise) {
    return cache.promise;
  }

  if (cache?.snapshot && cache.expiresAt > agora) {
    return cache.snapshot;
  }

  const promise = (async () => {
    // Se não tem leadId, busca por remote_jid ao invés de id_lead
    const whereLead = leadId
      ? { id_lead: leadId }
      : { remote_jid: { contains: phoneNumber.replace(/\D/g, "") } };

    const [mensagensCache, unreadCount] = await Promise.all([
      prisma.whatsappMensagem.findMany({
        where: { id_empresa: sessao.id_empresa, ...whereLead },
        orderBy: { timestamp: "asc" },
      }),
      prisma.whatsappMensagem.count({
        where: {
          id_empresa: sessao.id_empresa,
          ...whereLead,
          from_me: false,
          lida_no_crm_em: null,
        },
      }),
    ]);

    let connectionStatus: ChatConnectionStatus = "offline";

    // Só busca da Evolution API se tiver instância válida
    if (instancia.instanceName) {
      try {
        connectionStatus = await buscarConnectionStatus(instancia.instanceName);
        const payload = await buscarMensagensEvolution(instancia.instanceName, remoteJidInfo.remoteJid);
        const targetNumber = remoteJidInfo.waNumber.replace(/\D/g, "");

        const mensagensNormalizadas = normalizarMensagensEvolution(payload).filter((mensagem) => {
          const jidComparacao = mensagem.remoteJidAlt ?? mensagem.remoteJid;
          const msgNumber = jidComparacao.replace(/\D/g, "");
          return msgNumber.includes(targetNumber) || targetNumber.includes(msgNumber);
        });

        if (mensagensNormalizadas.length > 0) {
          if (leadId) {
            // Se tem lead, usa o fluxo normal com upsert
            await upsertMensagensNoBanco(prisma, {
              idEmpresa: sessao.id_empresa,
              idLead: leadId,
              idWhatsappInstancia: instancia.id,
              mensagens: mensagensNormalizadas,
            });
          } else {
            // Se não tem lead, sincroniza mensagens com id_lead placeholder
            // Usa ID gerado automaticamente pelo Prisma se possível
            for (const msg of mensagensNormalizadas) {
              try {
                await prisma.whatsappMensagem.upsert({
                  where: {
                    id_whatsapp_instancia_mensagem_id: {
                      id_whatsapp_instancia: instancia.id || "temp",
                      mensagem_id: msg.messageId,
                    },
                  },
                  create: {
                    id: `msg-${msg.messageId.slice(0, 20)}-${Date.now()}`,
                    id_empresa: sessao.id_empresa,
                    id_lead: "sem-lead",
                    id_whatsapp_instancia: instancia.id || "temp",
                    mensagem_id: msg.messageId,
                    remote_jid: msg.remoteJid,
                    from_me: msg.fromMe,
                    tipo: msg.kind,
                    conteudo: msg.conteudo,
                    timestamp: msg.timestamp,
                  },
                  update: {
                    from_me: msg.fromMe,
                    tipo: msg.kind,
                    conteudo: msg.conteudo,
                  },
                });
              } catch (err) {
                console.warn("[chat-realtime] Erro ao sincronizar mensagem sem lead:", err);
              }
            }
          }
        }
      } catch (error) {
        console.error("[chat-realtime] Erro ao sincronizar mensagens:", error);
        connectionStatus = "offline";
      }
    }

    const mensagensAtualizadas = await prisma.whatsappMensagem.findMany({
      where: { id_empresa: sessao.id_empresa, ...whereLead },
      orderBy: { timestamp: "asc" },
    });

    const unreadAtualizado = await prisma.whatsappMensagem.count({
      where: {
        id_empresa: sessao.id_empresa,
        ...whereLead,
        from_me: false,
        lida_no_crm_em: null,
      },
    });

    const snapshot: MensagensSnapshot = {
      messages: (mensagensAtualizadas.length > 0 ? mensagensAtualizadas : mensagensCache).map(
        mapearMensagemDbParaCanonica,
      ),
      connectionStatus,
      unreadCount: mensagensAtualizadas.length > 0 ? unreadAtualizado : unreadCount,
    };

    estado.chatCache.set(cacheKey, {
      promise: null,
      snapshot,
      expiresAt: Date.now() + CHAT_SYNC_TTL_MS,
    });

    return snapshot;
  })();

  estado.chatCache.set(cacheKey, {
    promise,
    snapshot: cache?.snapshot ?? null,
    expiresAt: agora + CHAT_SYNC_TTL_MS,
  });

  try {
    return await promise;
  } catch (error) {
    estado.chatCache.delete(cacheKey);
    throw error;
  } finally {
    const atualizado = estado.chatCache.get(cacheKey);
    if (atualizado?.promise === promise) {
      estado.chatCache.set(cacheKey, {
        promise: null,
        snapshot: atualizado.snapshot,
        expiresAt: atualizado.expiresAt,
      });
    }
  }
}

export async function obterSnapshotConversas(
  sessao: SessaoToken,
  params: { busca?: string; cursor?: string | null; limite?: number; naoLidas?: boolean },
): Promise<ConversasResponse> {
  const busca = params.busca?.trim() ?? "";
  const cursor = params.cursor?.trim() ?? null;
  const limite = Math.min(params.limite ?? 30, 50);
  const apenasNaoLidas = params.naoLidas === true;

  const instancia = await prisma.whatsappInstancia.findFirst({
    where: {
      id_empresa: sessao.id_empresa,
      status: "open",
    },
    orderBy: {
      criado_em: "asc",
    },
    select: {
      id: true,
      instance_name: true,
    },
  });

  if (!instancia) {
    return { conversas: [], cursor: null, temMais: false };
  }

  const pagina = cursor ? Number.parseInt(cursor, 10) : 1;
  const paginaAtual = Number.isFinite(pagina) && pagina > 0 ? pagina : 1;

  const conversasBrutas = busca
    ? await buscarConversasEvolution(instancia.instance_name, busca, paginaAtual, limite + 1)
    : await buscarConversas(instancia.instance_name);

  const conversasResolvidas = await Promise.all(
    conversasBrutas.map(async (conversa) => {
      const chave = conversa.remoteJidAlt ?? conversa.remoteJid;
      const lead = await buscarLeadPorTelefoneComAcesso(sessao, chave);
      return { conversa, lead };
    }),
  );

  // Permite conversas sem lead associado (ainda não sincronizado no CRM)
  const conversasFiltradas = conversasResolvidas.filter(({ conversa }) => {
    if (!apenasNaoLidas) return true;
    return conversa.lastMessage?.key?.fromMe === false;
  });

  const fatia = busca
    ? conversasFiltradas
    : conversasFiltradas.slice((paginaAtual - 1) * limite, paginaAtual * limite + 1);
  const temMais = fatia.length > limite;
  const conversasPaginadas = fatia.slice(0, limite);

  return {
    conversas: conversasPaginadas.map(({ conversa, lead }) => {
      const chave = conversa.remoteJidAlt ?? conversa.remoteJid;
      const telefoneSemFormato = chave.replace("@s.whatsapp.net", "").replace("@g.us", "");

      const isFromMe = conversa.lastMessage?.key?.fromMe ?? false;
      const mensagemPreview = isFromMe ? "Você: mensagem enviada" : "Nova mensagem";

      if (lead) {
        return {
          leadId: lead.id,
          leadNome: conversa.pushName?.trim() || lead.nome,
          leadTelefone: lead.telefone,
          leadOrigem: (lead.origem ?? "SINCRONIZACAO_WHATSAPP") as ConversaResumo["leadOrigem"],
          estagioNome: lead.estagioNome,
          ultimaMensagem: conversa.lastMessage
            ? {
                conteudo: mensagemPreview,
                fromMe: isFromMe,
                timestamp: Date.now(),
              }
            : null,
          naoLidas: isFromMe ? 0 : 1,
        } satisfies ConversaResumo;
      }

      return {
        leadId: `novo-${telefoneSemFormato}`,
        leadNome: conversa.pushName?.trim() || telefoneSemFormato,
        leadTelefone: telefoneSemFormato,
        leadOrigem: "SINCRONIZACAO_WHATSAPP" as ConversaResumo["leadOrigem"],
        estagioNome: null,
        ultimaMensagem: conversa.lastMessage
          ? {
              conteudo: mensagemPreview,
              fromMe: isFromMe,
              timestamp: Date.now(),
            }
          : null,
        naoLidas: isFromMe ? 0 : 1,
      } satisfies ConversaResumo;
    }),
    cursor: temMais ? String(paginaAtual + 1) : null,
    temMais,
  };
}

export function criarChaveChatStream(idEmpresa: string, idInstancia: string, leadId: string) {
  return `chat:${idEmpresa}:${idInstancia}:${leadId}`;
}

export function criarChaveConversasStream(
  idEmpresa: string,
  busca: string,
  naoLidas: boolean,
  limite: number,
) {
  return `conversation-list:${idEmpresa}:${busca || "_"}:${naoLidas ? "unread" : "all"}:${limite}`;
}
