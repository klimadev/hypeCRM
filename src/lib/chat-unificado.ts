import { prisma } from "@/lib/prisma";
import { whereLeadsPorPerfil } from "@/lib/permissoes";
import { normalizarTelefoneParaWhatsapp } from "@/lib/phone";
import { listarInstancias } from "@/lib/evolution-api.instances";
import { buscarConversasPaginado, buscarConversasEvolution } from "@/lib/evolution-api.chat";
import type { EvolutionConversa } from "@/lib/evolution-api.types";
import type { SessaoToken } from "@/lib/tipos";
import type { ChatUnificado } from "@/modules/chat/types";
import { listarConversasInstagram, listarPreviewsMensagensInstagramPorEmpresa } from "@/lib/integracoes/instagram-inbox";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? "";
const CHAT_DEBUG_ENABLED = process.env.CHAT_DEBUG === "1";
const MAX_PAGINAS_POR_INSTANCIA = 40;

function logChat(evento: string, detalhes?: Record<string, unknown>) {
  if (detalhes) {
    console.info(`[Chat] ${evento}`, detalhes);
    return;
  }
  console.info(`[Chat] ${evento}`);
}

type LeadInfo = {
  id: string;
  nome: string;
  telefone: string;
  id_funcionario: string;
  id_pdv: string | null;
  id_estagio: string;
  id_negocio: string | null;
  nome_funcionario: string | null;
  nome_pdv: string | null;
  nome_estagio: string | null;
  origem: string | null;
  fonte: string | null;
  empresa_origem: string | null;
  negocio: NegocioInfo | null;
};

type NegocioInfo = {
  id: string;
  titulo: string;
  status: string;
  id_funcionario: string;
  id_estagio: string;
};

type DebugInfo = {
  url: string;
  keySet: boolean;
  dbInstances: string[];
  evolutionInstances: Array<{ name: string; status: string }>;
  validInstances: string[];
  chatsPerInstance: Record<string, number>;
  rawFindChatsSample: Record<string, unknown>;
  errors: string[];
  leadsCount: number;
  leadsMapSize: number;
  instagramThreads: number;
  timingsMs: {
    leads: number;
    instances: number;
    whatsapp: number;
    instagram: number;
    enrichment: number;
    total: number;
  };
};

export type ResultadoUnificacao = {
  chats: ChatUnificado[];
  total: number;
  pagina: number;
  limite: number;
  temMais: boolean;
  debug: DebugInfo;
};

type UnificarChatsParams = {
  sessao: SessaoToken;
  pagina?: number;
  limite?: number;
  busca?: string;
};

function extrairTelefoneDeRemoteJid(remoteJid: string): string {
  return remoteJid.replace(/@.*/, "").replace(/\D/g, "");
}

function extrairConteudoMensagem(lastMessage: {
  key?: { fromMe?: boolean };
  pushName?: string;
  kind?: string;
  text?: string;
  message?: {
    conversation?: string;
    extendedTextMessage?: { text?: string };
    imageMessage?: { caption?: string; fileName?: string };
    videoMessage?: { caption?: string; fileName?: string };
    audioMessage?: Record<string, unknown>;
    documentMessage?: { caption?: string; fileName?: string };
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
}): string {
  if (!lastMessage) return "";

  const texto =
    lastMessage.text ??
    lastMessage.message?.conversation ??
    lastMessage.message?.extendedTextMessage?.text ??
    lastMessage.message?.imageMessage?.caption ??
    lastMessage.message?.videoMessage?.caption ??
    lastMessage.message?.documentMessage?.caption ??
    lastMessage.message?.reactionMessage?.text ??
    "";

  if (texto.trim()) return texto.trim();

  const fallback: Record<string, string> = {
    imageMessage: "Foto",
    videoMessage: "Vídeo",
    audioMessage: "Áudio",
    documentMessage: "Documento",
    stickerMessage: "Sticker",
    locationMessage: "Localização",
    liveLocationMessage: "Localização ao vivo",
    contactMessage: "Contato",
    listMessage: "Lista",
    buttonsMessage: "Botões",
    templateMessage: "Mensagem template",
    orderMessage: "Pedido",
    reactionMessage: "Reação",
    protocolMessage: "Mensagem de sistema",
  };

  return fallback[lastMessage.kind ?? ""] ?? "Mensagem";
}

function extrairTimestamp(conv: { messageTimestamp?: number }): number {
  return conv.messageTimestamp ?? 0;
}

/**
 * Verifica se o remoteJidAlt é válido (deve ser @s.whatsapp.net).
 * Se o remoteJid for @lid e o remoteJidAlt não for @s.whatsapp.net, ignorar.
 */
function jidEhValido(remoteJid: string, remoteJidAlt: string | null): boolean {
  if (remoteJid.includes("@lid")) {
    return !!remoteJidAlt && remoteJidAlt.includes("@s.whatsapp.net");
  }
  return true;
}

/**
 * Seleciona o JID correto para extrair telefone:
 * - Se remoteJidAlt existe e é @s.whatsapp.net, usa ele (caso @lid)
 * - Senão, usa remoteJid
 */
function selecionarJidParaTelefone(remoteJid: string, remoteJidAlt: string | null): string {
  if (remoteJidAlt && remoteJidAlt.includes("@s.whatsapp.net")) {
    return remoteJidAlt;
  }
  return remoteJid;
}

async function fetchFindChatsRaw(instanceName: string): Promise<unknown> {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/chat/findChats/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({}),
    });
    return await res.json().catch(() => ({ error: "invalid_json", status: res.status }));
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

async function medirDuracao<T>(fn: () => Promise<T>) {
  const inicio = Date.now();
  const resultado = await fn();
  return { resultado, duracaoMs: Date.now() - inicio };
}

export async function unificarChatsComLeads({
  sessao,
  pagina = 1,
  limite = 50,
  busca,
}: UnificarChatsParams): Promise<ResultadoUnificacao> {
  const inicioTotal = Date.now();
  const debug: DebugInfo = {
    url: EVOLUTION_API_URL,
    keySet: !!EVOLUTION_API_KEY,
    dbInstances: [],
    evolutionInstances: [],
    validInstances: [],
    chatsPerInstance: {},
    rawFindChatsSample: {},
    errors: [],
    leadsCount: 0,
    leadsMapSize: 0,
    instagramThreads: 0,
    timingsMs: {
      leads: 0,
      instances: 0,
      whatsapp: 0,
      instagram: 0,
      enrichment: 0,
      total: 0,
    },
  };

  const where = await whereLeadsPorPerfil(sessao);
  const { resultado: leads, duracaoMs: duracaoLeadsMs } = await medirDuracao(() =>
    prisma.lead.findMany({
      where,
      select: {
        id: true,
        nome: true,
        telefone: true,
        id_negocio: true,
        id_funcionario: true,
        id_pdv: true,
        id_estagio: true,
        origem: true,
        fonte: true,
        empresa_origem: true,
      },
    }),
  );
  debug.leadsCount = leads.length;
  debug.timingsMs.leads = duracaoLeadsMs;

  const idsFunc = leads.map((l) => l.id_funcionario).filter(Boolean) as string[];
  const idsEstagio = leads.map((l) => l.id_estagio).filter(Boolean) as string[];
  const idsPdv = leads.map((l) => l.id_pdv).filter(Boolean) as string[];

  const [funcionarios, estagios, pdvs] = await Promise.all([
    idsFunc.length > 0
      ? prisma.funcionario.findMany({
          where: { id: { in: idsFunc } },
          select: { id: true, nome: true },
        })
      : [],
    idsEstagio.length > 0
      ? prisma.estagioFunil.findMany({
          where: { id: { in: idsEstagio } },
          select: { id: true, nome: true },
        })
      : [],
    idsPdv.length > 0
      ? prisma.pdv.findMany({
          where: { id: { in: idsPdv } },
          select: { id: true, nome: true },
        })
      : [],
  ]);

  const mapaLeads = new Map<string, LeadInfo>();
  for (const lead of leads) {
    const telNorm = normalizarTelefoneParaWhatsapp(lead.telefone);
    if (telNorm.waNumber) {
      mapaLeads.set(telNorm.waNumber, {
        id: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        id_funcionario: lead.id_funcionario,
        id_pdv: lead.id_pdv,
        id_estagio: lead.id_estagio,
        id_negocio: lead.id_negocio,
        nome_funcionario: funcionarios.find((f) => f.id === lead.id_funcionario)?.nome ?? null,
        nome_pdv: pdvs.find((p) => p.id === lead.id_pdv)?.nome ?? null,
        nome_estagio: estagios.find((e) => e.id === lead.id_estagio)?.nome ?? null,
        origem: lead.origem ?? null,
        fonte: lead.fonte ?? null,
        empresa_origem: lead.empresa_origem ?? null,
        negocio: null,
      });
    }
  }
  debug.leadsMapSize = mapaLeads.size;

  const instagramThreadsPromise = listarConversasInstagram(sessao.id_empresa)
    .then((threads) => {
      logChat("Conversas do Instagram encontradas", { total: threads.length });
      return threads;
    })
    .catch((error) => {
      const mensagem = `Erro ao buscar conversas do Instagram: ${error instanceof Error ? error.message : String(error)}`;
      debug.errors.push(mensagem);
      console.error(mensagem, { idEmpresa: sessao.id_empresa });
      return [] as Awaited<ReturnType<typeof listarConversasInstagram>>;
    });

  logChat("Buscando conversas do Instagram...", { idEmpresa: sessao.id_empresa });

  const { resultado: [instanciasEmpresa, todasInstancias], duracaoMs: duracaoInstanciasMs } = await medirDuracao(
    () =>
      Promise.all([
        prisma.whatsappInstancia.findMany({
          where: { id_empresa: sessao.id_empresa },
          select: { instance_name: true },
        }),
        listarInstancias().catch((e) => {
          debug.errors.push(`listarInstancias: ${e instanceof Error ? e.message : String(e)}`);
          return [] as Array<{ instanceName: string; status: string; instanceId: string }>;
        }),
      ]),
  );
  const instanceNamesEmpresa = new Set(instanciasEmpresa.map((i) => i.instance_name));
  debug.dbInstances = Array.from(instanceNamesEmpresa);
  debug.timingsMs.instances = duracaoInstanciasMs;
  debug.evolutionInstances = todasInstancias.map((i) => ({ name: i.instanceName, status: i.status }));

  const instanciasValidas = todasInstancias.filter(
    (inst) =>
      instanceNamesEmpresa.has(inst.instanceName) &&
      ["open", "connecting"].includes(inst.status?.toLowerCase()),
  );
  debug.validInstances = instanciasValidas.map((i) => i.instanceName);

  // Coletar conversas - com busca (Evolution) ou sem busca (todas as conversas)
  // Usar Set de telefone para deduplicar — mesmo telefone em múltiplas instâncias
  const mapaPorTelefone = new Map<string, ChatUnificado>();

  // Se há termo de busca, usar busca direta no Evolution (sem paginar tudo)
  if (busca && busca.trim().length > 0) {
    logChat("Executando busca no Evolution", { termo: busca });

    const { resultado: resultadosBusca, duracaoMs: duracaoWhatsappMs } = await medirDuracao(() =>
      Promise.all(
        instanciasValidas.map(async (inst) => {
          try {
            return await buscarConversasEvolution(inst.instanceName, busca.trim(), 1, 50);
          } catch (error) {
            const msg = `Erro ao buscar conversas da instancia ${inst.instanceName}: ${error instanceof Error ? error.message : String(error)}`;
            debug.errors.push(msg);
            console.error(msg);
            return [];
          }
        }),
      ),
    );
    debug.timingsMs.whatsapp = duracaoWhatsappMs;

    for (const [index, conversasEncontradas] of resultadosBusca.entries()) {
      const inst = instanciasValidas[index];
      for (const conv of conversasEncontradas) {
        if (conv.isGroup) continue;
        if (!jidEhValido(conv.remoteJid, conv.remoteJidAlt)) continue;

        const jidParaTelefone = selecionarJidParaTelefone(conv.remoteJid, conv.remoteJidAlt);
        const telefone = extrairTelefoneDeRemoteJid(jidParaTelefone);

        const existente = mapaPorTelefone.get(telefone);
        if (existente) continue;

        const leadMatch = mapaLeads.get(telefone) ?? null;

        mapaPorTelefone.set(telefone, {
          instanceName: inst.instanceName,
          remoteJid: conv.remoteJid,
          telefone,
          pushName: conv.pushName ?? null,
          isGroup: false,
          canal: "whatsapp",
          unreadCount: 0,
          ultimaMensagem: conv.lastMessage
            ? {
                conteudo: extrairConteudoMensagem(conv.lastMessage),
                fromMe: conv.lastMessage.key?.fromMe ?? false,
                timestamp: extrairTimestamp(conv),
              }
            : null,
          leadMatch,
          semMatch: !leadMatch,
        });
      }
    }
  } else {
    // Modo normal: buscar todas as conversas para listagem (sem busca)
    const { resultado: resultadosWhatsapp, duracaoMs: duracaoWhatsappMs } = await medirDuracao(() =>
      Promise.all(
        instanciasValidas.map(async (inst) => {
          try {
            if (CHAT_DEBUG_ENABLED) {
              debug.rawFindChatsSample[inst.instanceName] = await fetchFindChatsRaw(inst.instanceName);
            }

            const conversasInstancia: EvolutionConversa[] = [];
            let paginaAtual = 1;
            const limitePagina = 100;
            let temMais = true;
            const assinaturasPaginas = new Set<string>();

            while (temMais && paginaAtual <= MAX_PAGINAS_POR_INSTANCIA) {
              const resultado = await buscarConversasPaginado(inst.instanceName, paginaAtual, limitePagina);
              if (resultado.conversas.length === 0) {
                break;
              }

              const assinaturaPagina = `${resultado.conversas.length}:${resultado.conversas.at(0)?.remoteJid ?? ""}:${resultado.conversas.at(-1)?.remoteJid ?? ""}`;
              if (assinaturasPaginas.has(assinaturaPagina)) {
                debug.errors.push(`Paginacao repetida detectada na instancia ${inst.instanceName} (pagina ${paginaAtual})`);
                break;
              }
              assinaturasPaginas.add(assinaturaPagina);

              conversasInstancia.push(...resultado.conversas);
              temMais = resultado.temMais;
              paginaAtual += 1;
            }

            if (temMais && paginaAtual > MAX_PAGINAS_POR_INSTANCIA) {
              debug.errors.push(`Paginacao interrompida por limite na instancia ${inst.instanceName}`);
            }

            return { inst, conversas: conversasInstancia };
          } catch (error) {
            const msg = `Erro ao buscar conversas da instancia ${inst.instanceName}: ${error instanceof Error ? error.message : String(error)}`;
            debug.errors.push(msg);
            console.error(msg);
            return { inst, conversas: [] as EvolutionConversa[] };
          }
        }),
      ),
    );
    debug.timingsMs.whatsapp = duracaoWhatsappMs;

    for (const { inst, conversas } of resultadosWhatsapp) {
      for (const conv of conversas) {
        if (conv.isGroup) continue;

        if (!jidEhValido(conv.remoteJid, conv.remoteJidAlt)) continue;

        const jidParaTelefone = selecionarJidParaTelefone(conv.remoteJid, conv.remoteJidAlt);
        const telefone = extrairTelefoneDeRemoteJid(jidParaTelefone);

        const existente = mapaPorTelefone.get(telefone);
        if (existente) {
          if (conv.remoteJidAlt?.includes("@s.whatsapp.net") && existente.remoteJid.includes("@lid")) {
            // Preferir a versão limpa quando a Evolution devolver lid + alt.
          } else {
            continue;
          }
        }

        const leadMatch = mapaLeads.get(telefone) ?? null;

        mapaPorTelefone.set(telefone, {
          instanceName: inst.instanceName,
          remoteJid: conv.remoteJid,
          telefone,
          pushName: conv.pushName ?? null,
          isGroup: false,
          canal: "whatsapp",
          unreadCount: 0,
          ultimaMensagem: conv.lastMessage
            ? {
                conteudo: extrairConteudoMensagem(conv.lastMessage),
                fromMe: conv.lastMessage.key?.fromMe ?? false,
                timestamp: extrairTimestamp(conv),
              }
            : null,
          leadMatch,
          semMatch: !leadMatch,
        });
      }

      debug.chatsPerInstance[inst.instanceName] = conversas.length;
    }
  }

  const { resultado: instagramThreads, duracaoMs: duracaoInstagramMs } = await medirDuracao(
    () => instagramThreadsPromise,
  );
  debug.timingsMs.instagram = duracaoInstagramMs;

  if (instagramThreads.length > 0) {
    logChat("Buscando previews das conversas do Instagram...", { total: instagramThreads.length });
  }

  const previewsInstagram = await listarPreviewsMensagensInstagramPorEmpresa(
    sessao.id_empresa,
    instagramThreads.map((thread) => thread.id),
  );

  if (previewsInstagram.size > 0) {
    logChat("Previews do Instagram carregados do banco", { total: previewsInstagram.size });
  }

  for (const thread of instagramThreads) {
    const previewPersistido = previewsInstagram.get(thread.id);
    const participantUsername = thread.participant_username ?? thread.participant_id ?? thread.id;
    const telefoneIg = participantUsername.replace(/\D/g, "");

    const leadMatch = telefoneIg.length >= 8 ? mapaLeads.get(telefoneIg) ?? null : null;

    const chave = `instagram:${thread.id}`;

    let previewTexto: string | null = null;
    let fromMe = false;
    let kind: string | null = null;
    let hasMedia = false;
    let mediaUrl: string | null = null;

    if (previewPersistido?.conteudo) {
      previewTexto = previewPersistido.conteudo;
      fromMe = previewPersistido.fromMe;
      kind = previewPersistido.kind;
      hasMedia = previewPersistido.hasMedia;
      mediaUrl = previewPersistido.mediaUrl;
    } else if (thread.last_message_text) {
      previewTexto = thread.last_message_text;
    } else if (thread.message_count > 0) {
      previewTexto = `${thread.message_count} mensagem(ns)`;
    }

    if (previewTexto) {
      logChat("Preview da conversa Instagram atualizado", {
        threadId: thread.id,
        preview: previewTexto.slice(0, 50),
        fromDb: !!previewPersistido?.conteudo,
      });
    }

    mapaPorTelefone.set(chave, {
      instanceName: "instagram",
      remoteJid: thread.id,
      telefone: telefoneIg || thread.participant_username || thread.participant_id || thread.id,
      pushName: thread.participant_name ?? thread.participant_username ?? null,
      isGroup: false,
      canal: "instagram",
      unreadCount: thread.unread_count,
      ultimaMensagem: previewTexto
        ? {
            conteudo: previewTexto,
            fromMe,
            timestamp: previewPersistido?.timestamp ?? Math.floor(new Date(thread.updated_at).getTime() / 1000),
            kind,
            hasMedia,
            mediaUrl,
          }
        : null,
      leadMatch,
      semMatch: !leadMatch,
    });
  }

  debug.instagramThreads = instagramThreads.length;

  // Ordenar por timestamp DESC
  const todasOrdenadas = Array.from(mapaPorTelefone.values()).sort((a, b) => {
    const tsA = a.ultimaMensagem?.timestamp ?? 0;
    const tsB = b.ultimaMensagem?.timestamp ?? 0;
    return tsB - tsA;
  });

  const { resultado: { negociosPorId, unreadPorLead }, duracaoMs: duracaoEnrichmentMs } = await medirDuracao(
    async () => {
      const idsLeadsVinculados = todasOrdenadas
        .map((chat) => chat.leadMatch?.id)
        .filter((id): id is string => Boolean(id));

      const idsNegociosVinculados = todasOrdenadas
        .map((chat) => chat.leadMatch?.id_negocio)
        .filter((id): id is string => Boolean(id));

      const [negocios, contagens] = await Promise.all([
        idsNegociosVinculados.length > 0
          ? prisma.negocio.findMany({
              where: {
                id_empresa: sessao.id_empresa,
                id: { in: idsNegociosVinculados },
              },
              select: {
                id: true,
                titulo: true,
                status: true,
                id_funcionario: true,
                id_estagio: true,
              },
            })
          : [],
        idsLeadsVinculados.length > 0
          ? prisma.whatsappMensagem.groupBy({
              by: ["id_lead"],
              where: {
                id_empresa: sessao.id_empresa,
                id_lead: { in: idsLeadsVinculados },
                from_me: false,
                lida_no_crm_em: null,
              },
              _count: { _all: true },
            })
          : [],
      ]);

      const negociosMap = new Map<string, NegocioInfo>();
      for (const negocio of negocios) {
        negociosMap.set(negocio.id, negocio);
      }

      const unreadMap = new Map<string, number>();
      for (const item of contagens) {
        unreadMap.set(item.id_lead, item._count._all);
      }

      return { negociosPorId: negociosMap, unreadPorLead: unreadMap };
    },
  );
  debug.timingsMs.enrichment = duracaoEnrichmentMs;

  for (const chat of todasOrdenadas) {
    chat.unreadCount = chat.leadMatch?.id ? unreadPorLead.get(chat.leadMatch.id) ?? 0 : 0;
    if (chat.leadMatch?.id_negocio) {
      const negocio = negociosPorId.get(chat.leadMatch.id_negocio) ?? null;
      if (chat.leadMatch) {
        chat.leadMatch.negocio = negocio;
      }
    }
  }

  const total = todasOrdenadas.length;
  const inicio = (pagina - 1) * limite;
  const fim = inicio + limite;
  const chatsPaginados = todasOrdenadas.slice(inicio, fim);

  return {
    chats: chatsPaginados,
    total,
    pagina,
    limite,
    temMais: fim < total,
    debug: {
      ...debug,
      timingsMs: {
        ...debug.timingsMs,
        total: Date.now() - inicioTotal,
      },
    },
  };
}
