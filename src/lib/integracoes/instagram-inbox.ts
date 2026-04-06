import { prisma } from "@/lib/prisma";
import { ErroInstagramApi, chamarGraphInstagram, classificarFalhaInstagram, logInstagram } from "./instagram-client";
import {
  mapearMensagemInstagramNormalizadaParaInbox,
  normalizarMensagemInstagramApi,
  type InstagramMensagemApi,
} from "./instagram-normalization";
import {
  erroTabelaInstagramMensagemAusente,
  listarMensagensInstagramDoBanco,
  listarUltimasMensagensInstagramDoBanco,
  type InstagramMensagemPreviewPersistida,
  upsertMensagensInstagramNoBanco,
} from "./instagram-persistence";

const INSTAGRAM_GRAPH_API_VERSION = process.env.INSTAGRAM_GRAPH_API_VERSION ?? "v25.0";
const FOLGA_TOKEN_MS = 5 * 60 * 1000;

export function criarUrlGraphInstagram(path: string, accessToken: string, body?: string) {
  const url = new URL(`https://graph.instagram.com/${INSTAGRAM_GRAPH_API_VERSION}/${path.replace(/^\//, "")}`);

  if (body) {
    const params = new URLSearchParams(body);
    for (const [key, value] of params.entries()) {
      url.searchParams.set(key, value);
    }
  }

  url.searchParams.set("access_token", accessToken);

  return url;
}

type InstagramContaAtiva = {
  id: string;
  id_empresa: string;
  instagram_user_id: string;
  access_token: string;
  username: string;
  nome: string;
  expires_at: Date | null;
};

export type InstagramInboxConversation = {
  id: string;
  updated_at: string;
  unread_count: number;
  participant_id: string | null;
  participant_name: string | null;
  participant_username: string | null;
  last_message_text: string | null;
  message_count: number;
};

export type InstagramInboxMessage = {
  id: string;
  from_id: string | null;
  from_name: string | null;
  from_username: string | null;
  from_me: boolean;
  text: string | null;
  created_at: string;
  attachments: Array<{
    type: string;
    url: string | null;
  }>;
};

export type InstagramInboxSnapshot = {
  account: {
    id: string;
    nome: string;
    username: string;
    instagram_user_id: string;
  } | null;
  conversations: InstagramInboxConversation[];
  selectedConversationId: string | null;
  messages: InstagramInboxMessage[];
};

type InstagramParticipant = { id?: string; name?: string; username?: string };

export function identificarParticipante(
  participantes: InstagramParticipant[] | undefined,
  instagramUserId: string,
  accountUsername?: string,
): InstagramParticipant | null {
  if (!participantes || participantes.length === 0) return null;

  const outro = participantes.find((p) => {
    if (accountUsername && p.username) {
      return p.username !== accountUsername;
    }
    if (p.id && p.id !== instagramUserId) return true;
    return false;
  });
  if (outro) return outro;

  return participantes[0] ?? null;
}

export function calcularFromMe(fromUsername: string | null, accountUsername: string): boolean {
  if (!fromUsername || !accountUsername) return false;
  return fromUsername === accountUsername;
}

export function resolverConversationIdSelecionada<T extends { id: string }>(conversations: T[], conversationId?: string | null) {
  if (conversationId && conversations.some((item) => item.id === conversationId)) {
    return conversationId;
  }

  return conversations[0]?.id ?? null;
}

export function deduplicarMensagensInstagram<T extends { id: string; created_at: string }>(messages: T[]) {
  const porId = new Map<string, T>();

  for (const message of messages) {
    const existente = porId.get(message.id);
    if (!existente || new Date(message.created_at).getTime() >= new Date(existente.created_at).getTime()) {
      porId.set(message.id, message);
    }
  }

  return Array.from(porId.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export { classificarFalhaInstagram };

async function obterContaInstagramAtiva(idEmpresa: string): Promise<InstagramContaAtiva | null> {
  return prisma.instagramConta.findFirst({
    where: { id_empresa: idEmpresa, status: "active" },
    orderBy: { atualizado_em: "desc" },
    select: {
      id: true,
      id_empresa: true,
      instagram_user_id: true,
      access_token: true,
      username: true,
      nome: true,
      expires_at: true,
    },
  });
}

async function marcarContaInstagramComFalha(contaId: string, status: string) {
  await prisma.instagramConta.update({
    where: { id: contaId },
    data: {
      status,
      atualizado_em: new Date(),
    },
  }).catch(() => undefined);
}

function tokenEstaExpirado(expiresAt: Date | null) {
  if (!expiresAt) return false;
  return expiresAt.getTime() <= Date.now() + FOLGA_TOKEN_MS;
}

async function validarContaInstagram(conta: InstagramContaAtiva) {
  if (!tokenEstaExpirado(conta.expires_at)) return;

  await marcarContaInstagramComFalha(conta.id, "token_expirado");
  logInstagram("Token expirado", { contaId: conta.id, username: conta.username });

  throw new ErroInstagramApi(classificarFalhaInstagram({
    status: 401,
    code: 190,
    message: "Token expirado localmente antes da chamada ao Instagram.",
  }));
}

async function buscarConversasInstagram(conta: InstagramContaAtiva) {
  logInstagram("Buscando conversas...", { contaId: conta.id, username: conta.username });

  const url = criarUrlGraphInstagram(
    `${conta.instagram_user_id}/conversations?fields=id,updated_time,unread_count,participants,snippet,message_count&limit=50`,
    conta.access_token,
  );

  const json = await chamarGraphInstagram<{
    data?: Array<{
      id: string;
      updated_time?: string;
      unread_count?: number;
      participants?: { data?: Array<{ id?: string; name?: string; username?: string }> };
      snippet?: string;
      message_count?: number;
    }>;
  }>({
    url,
    operacao: "buscar conversas do Instagram",
  });

  logInstagram(`Resposta recebida (${json.data?.length ?? 0} conversas)`);

  return (json.data ?? []).map<InstagramInboxConversation>((item) => {
    const participant = identificarParticipante(item.participants?.data, conta.instagram_user_id, conta.username);
    return {
      id: item.id,
      updated_at: item.updated_time ?? new Date().toISOString(),
      unread_count: item.unread_count ?? 0,
      participant_id: participant?.id ?? null,
      participant_name: participant?.name ?? null,
      participant_username: participant?.username ?? null,
      last_message_text: item.snippet ?? null,
      message_count: item.message_count ?? 0,
    };
  });
}

async function buscarMensagensInstagramNaApi(conta: InstagramContaAtiva, conversationId: string, limite: number) {
  logInstagram("Buscando mensagens...", { conversationId, limite });

  const url = criarUrlGraphInstagram(
    `${conversationId}/messages?fields=id,from,message,created_time,attachments&limit=${limite}`,
    conta.access_token,
  );

  const json = await chamarGraphInstagram<{
    data?: InstagramMensagemApi[];
  }>({
    url,
    operacao: "buscar mensagens do Instagram",
  });

  const mensagens = (json.data ?? []).map((mensagem) => normalizarMensagemInstagramApi({
    conversationId,
    contaUsername: conta.username,
    mensagem,
  }));

  logInstagram(`Resposta recebida (${mensagens.length} mensagens)`, { conversationId });

  return mensagens;
}

async function tratarFalhaContaInstagram(conta: InstagramContaAtiva, erro: unknown, contexto: Record<string, unknown>) {
  if (erro instanceof ErroInstagramApi) {
    if (erro.categoria === "token_invalido") {
      await marcarContaInstagramComFalha(conta.id, "token_invalido");
    }

    if (erro.categoria === "sem_permissao") {
      await marcarContaInstagramComFalha(conta.id, "permissao_insuficiente");
    }

    // Rate limit nao deve marcar a conta como falha — e temporario
    if (erro.categoria === "limite_excedido") {
      console.error(`[Instagram] Rate limit atingido (nao desativa conta)`, {
        ...contexto,
        categoria: erro.categoria,
        status: erro.status,
        code: erro.code,
        subcode: erro.subcode,
      });
      return;
    }

    console.error(`[Instagram] ${erro.message}`, {
      ...contexto,
      categoria: erro.categoria,
      status: erro.status,
      code: erro.code,
      subcode: erro.subcode,
    });
    return;
  }

  console.error("[Instagram] Falha inesperada", {
    ...contexto,
    erro: erro instanceof Error ? erro.message : String(erro),
  });
}

export async function listarInboxInstagram(idEmpresa: string, conversationId?: string | null) {
  const conta = await obterContaInstagramAtiva(idEmpresa);
  if (!conta) return { account: null, conversations: [], selectedConversationId: null, messages: [] } satisfies InstagramInboxSnapshot;

  await validarContaInstagram(conta);

  try {
    const conversations = await buscarConversasInstagram(conta);
    const selectedConversationId = resolverConversationIdSelecionada(conversations, conversationId);
    const messages = selectedConversationId
      ? await listarMensagensInstagramPorEmpresa(idEmpresa, selectedConversationId, 50)
      : [];

    if (!selectedConversationId) {
      logInstagram("Nenhuma mensagem encontrada", { motivo: "sem_conversa" });
    }

    return {
      account: {
        id: conta.id,
        nome: conta.nome,
        username: conta.username,
        instagram_user_id: conta.instagram_user_id,
      },
      conversations,
      selectedConversationId,
      messages,
    } satisfies InstagramInboxSnapshot;
  } catch (erro) {
    await tratarFalhaContaInstagram(conta, erro, { idEmpresa, conversationId });
    throw erro;
  }
}

function mapearMensagensNormalizadasParaInbox(mensagens: Array<ReturnType<typeof normalizarMensagemInstagramApi>>) {
  return mensagens.map(mapearMensagemInstagramNormalizadaParaInbox);
}

export async function listarMensagensInstagramPorEmpresa(
  idEmpresa: string,
  conversationId: string,
  limite = 50,
): Promise<InstagramInboxMessage[]> {
  const conta = await obterContaInstagramAtiva(idEmpresa);
  if (!conta) {
    throw new Error("Nenhuma conta do Instagram ativa para esta empresa.");
  }

  await validarContaInstagram(conta);

  let mensagensEmCache: InstagramInboxMessage[] = [];

  try {
    mensagensEmCache = await listarMensagensInstagramDoBanco({
      idInstagramConta: conta.id,
      conversationId,
      limite,
    });
  } catch (erro) {
    if (erroTabelaInstagramMensagemAusente(erro)) {
      console.error("[Instagram] Tabela InstagramMensagem ausente ao consultar cache local", {
        conversationId,
        idEmpresa,
        contaId: conta.id,
      });
    } else {
      console.error("[Instagram] Falha ao consultar cache local", {
        conversationId,
        idEmpresa,
        contaId: conta.id,
        erro: erro instanceof Error ? erro.message : String(erro),
      });
    }
  }

  try {
    const normalizadas = await buscarMensagensInstagramNaApi(conta, conversationId, limite);
    const mensagensUnicas = deduplicarMensagensInstagram(normalizadas.map((mensagem) => ({
      id: mensagem.messageId,
      created_at: mensagem.createdAt,
      payload: mensagem,
    })));

    try {
      const resultado = await upsertMensagensInstagramNoBanco(prisma, {
        idEmpresa: conta.id_empresa,
        idInstagramConta: conta.id,
        mensagens: mensagensUnicas.map((mensagem) => mensagem.payload),
      });

      for (const mensagem of mensagensUnicas) {
        if (resultado.criadasIds.has(mensagem.id)) {
          logInstagram(`Mensagem salva: id=${mensagem.id}`);
          continue;
        }

        logInstagram(`Mensagem duplicada ignorada: id=${mensagem.id}`);
      }

      const mensagensPersistidas = await listarMensagensInstagramDoBanco({
        idInstagramConta: conta.id,
        conversationId,
        limite,
      });

      if (mensagensPersistidas.length === 0) {
        logInstagram("Nenhuma mensagem encontrada", { conversationId });
      }

      return mensagensPersistidas;
    } catch (erroPersistencia) {
      if (erroTabelaInstagramMensagemAusente(erroPersistencia)) {
        console.error("[Instagram] Tabela InstagramMensagem ausente ao persistir mensagens; retornando dados da API", {
          conversationId,
          idEmpresa,
          contaId: conta.id,
        });
      } else {
        console.error("[Instagram] Falha ao persistir mensagens; retornando dados da API", {
          conversationId,
          idEmpresa,
          contaId: conta.id,
          erro: erroPersistencia instanceof Error ? erroPersistencia.message : String(erroPersistencia),
        });
      }

      return mapearMensagensNormalizadasParaInbox(mensagensUnicas.map((mensagem) => mensagem.payload));
    }
  } catch (erro) {
    await tratarFalhaContaInstagram(conta, erro, { idEmpresa, conversationId, limite });

    if (mensagensEmCache.length > 0) {
      logInstagram("Falha no sync, retornando cache local", { conversationId, total: mensagensEmCache.length });
      return mensagensEmCache;
    }

    throw erro;
  }
}

export async function listarPreviewsMensagensInstagramPorEmpresa(
  idEmpresa: string,
  conversationIds: string[],
): Promise<Map<string, InstagramMensagemPreviewPersistida>> {
  const conta = await obterContaInstagramAtiva(idEmpresa);
  if (!conta || conversationIds.length === 0) {
    return new Map<string, InstagramMensagemPreviewPersistida>();
  }

  try {
    return await listarUltimasMensagensInstagramDoBanco({
      idInstagramConta: conta.id,
      conversationIds,
    });
  } catch (erro) {
    if (erroTabelaInstagramMensagemAusente(erro)) {
      console.error("[Instagram] Tabela InstagramMensagem ausente ao montar previews do chat", {
        idEmpresa,
        totalConversas: conversationIds.length,
      });
    } else {
      console.error("[Instagram] Falha ao montar previews do chat", {
        idEmpresa,
        totalConversas: conversationIds.length,
        erro: erro instanceof Error ? erro.message : String(erro),
      });
    }

    return new Map<string, InstagramMensagemPreviewPersistida>();
  }
}

export type InstagramThreadSimplificado = {
  id: string;
  updated_at: string;
  unread_count: number;
  participant_id: string | null;
  participant_name: string | null;
  participant_username: string | null;
  last_message_text: string | null;
  message_count: number;
};

export async function listarConversasInstagram(idEmpresa: string): Promise<InstagramThreadSimplificado[]> {
  const conta = await obterContaInstagramAtiva(idEmpresa);
  if (!conta) return [];

  await validarContaInstagram(conta);

  try {
    return await buscarConversasInstagram(conta);
  } catch (erro) {
    await tratarFalhaContaInstagram(conta, erro, { idEmpresa });
    throw erro;
  }
}

async function buscarParticipantIdDaConversa(
  conta: InstagramContaAtiva,
  threadId: string,
): Promise<string | null> {
  logInstagram("Buscando participant_id da conversa...", { threadId });

  const url = criarUrlGraphInstagram(
    `${threadId}?fields=participants`,
    conta.access_token,
  );

  const json = await chamarGraphInstagram<{
    participants?: { data?: Array<{ id?: string }> };
  }>({
    url,
    operacao: "buscar dados da conversa para envio",
  });

  const participantes = json.participants?.data ?? [];
  const outro = participantes.find((p) => p.id !== conta.instagram_user_id);
  return outro?.id ?? participantes[0]?.id ?? null;
}

export async function enviarMensagemInstagram(
  idEmpresa: string,
  threadId: string,
  texto: string,
  participantId?: string,
) {
  const conta = await obterContaInstagramAtiva(idEmpresa);
  if (!conta) {
    throw new Error("Nenhuma conta do Instagram ativa para esta empresa.");
  }

  await validarContaInstagram(conta);

  let recipientId: string | null = participantId ?? null;

  if (!recipientId) {
    recipientId = await buscarParticipantIdDaConversa(conta, threadId);
    if (!recipientId) {
      logInstagram("Nao foi possivel identificar o destinatario", { threadId });
      throw new Error("Nao foi possivel identificar o destinatario da conversa.");
    }
    logInstagram("Participant_id resolvido", { recipientId });
  }

  const payload = {
    recipient: { id: recipientId },
    message: { text: texto },
    tags: ["human_agent"],
  };

  logInstagram("Enviando mensagem para conversa...", { threadId, recipientId });

  try {
    const url = criarUrlGraphInstagram("me/messages", conta.access_token);
    const json = await chamarGraphInstagram<{
      recipient_id?: string;
      message_id?: string;
    }>({
      url,
      operacao: "enviar mensagem no Instagram",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    });

    logInstagram("Mensagem enviada com sucesso", {
      threadId,
      messageId: json.message_id,
      recipientId: json.recipient_id,
    });

    try {
      const mensagemEnviada = {
        messageId: json.message_id ?? `sent-${Date.now()}`,
        conversationId: threadId,
        participantId: conta.instagram_user_id,
        participantName: conta.nome,
        participantUsername: conta.username,
        fromMe: true,
        kind: "text",
        text: texto,
        createdAt: new Date().toISOString(),
        timestamp: Math.floor(Date.now() / 1000),
        payloadJson: JSON.stringify(payload),
        attachments: [],
      };

      await upsertMensagensInstagramNoBanco(prisma, {
        idEmpresa: conta.id_empresa,
        idInstagramConta: conta.id,
        mensagens: [mensagemEnviada],
      });

      logInstagram("Mensagem enviada persistida no banco", { messageId: mensagemEnviada.messageId });
    } catch (erroPersistencia) {
      console.error("[Instagram] Falha ao persistir mensagem enviada", {
        threadId,
        erro: erroPersistencia instanceof Error ? erroPersistencia.message : String(erroPersistencia),
      });
    }

    return {
      success: true,
      recipient_id: json.recipient_id,
      message_id: json.message_id,
    };
  } catch (erro) {
    await tratarFalhaContaInstagram(conta, erro, { idEmpresa, threadId, recipientId });
    throw erro;
  }
}
