import { prisma } from "@/lib/prisma";
import { whereLeadsPorPerfil } from "@/lib/permissoes";
import { normalizarTelefoneParaWhatsapp } from "@/lib/phone";
import { listarInstancias } from "@/lib/evolution-api.instances";
import { buscarConversasPaginado } from "@/lib/evolution-api.chat";
import type { SessaoToken } from "@/lib/tipos";
import type { ChatUnificado } from "@/modules/chat/types";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? "";

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

export async function unificarChatsComLeads({
  sessao,
  pagina = 1,
  limite = 50,
}: UnificarChatsParams): Promise<ResultadoUnificacao> {
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
  };

  const where = await whereLeadsPorPerfil(sessao);
  const leads = await prisma.lead.findMany({
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
  });
  debug.leadsCount = leads.length;

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

  const instanciasEmpresa = await prisma.whatsappInstancia.findMany({
    where: { id_empresa: sessao.id_empresa },
    select: { instance_name: true },
  });
  const instanceNamesEmpresa = new Set(instanciasEmpresa.map((i) => i.instance_name));
  debug.dbInstances = Array.from(instanceNamesEmpresa);

  let todasInstancias: Array<{ instanceName: string; status: string; instanceId: string }> = [];
  try {
    todasInstancias = await listarInstancias();
  } catch (e) {
    debug.errors.push(`listarInstancias: ${e instanceof Error ? e.message : String(e)}`);
  }
  debug.evolutionInstances = todasInstancias.map((i) => ({ name: i.instanceName, status: i.status }));

  const instanciasValidas = todasInstancias.filter(
    (inst) =>
      instanceNamesEmpresa.has(inst.instanceName) &&
      ["open", "connecting"].includes(inst.status?.toLowerCase()),
  );
  debug.validInstances = instanciasValidas.map((i) => i.instanceName);

  // Coletar TODAS as conversas de todas as instâncias (para paginação correta)
  // Usar Set de telefone para deduplicar — mesmo telefone em múltiplas instâncias
  // ou como @lid + @s.whatsapp.net aparece uma vez
  const mapaPorTelefone = new Map<string, ChatUnificado>();

  for (const inst of instanciasValidas) {
    try {
      const raw = await fetchFindChatsRaw(inst.instanceName);
      debug.rawFindChatsSample[inst.instanceName] = raw;

      // Paginação interna: buscar todas as conversas da instância em lotes
      let paginaAtual = 1;
      const limitePagina = 100;
      let temMais = true;

      while (temMais) {
        const resultado = await buscarConversasPaginado(inst.instanceName, paginaAtual, limitePagina);
        const conversas = resultado.conversas;
        temMais = resultado.temMais;
        paginaAtual++;

        for (const conv of conversas) {
          if (conv.isGroup) continue;

          // Regra: se é @lid e remoteJidAlt não é @s.whatsapp.net, ignorar
          if (!jidEhValido(conv.remoteJid, conv.remoteJidAlt)) continue;

          // Selecionar JID correto para extrair telefone
          const jidParaTelefone = selecionarJidParaTelefone(conv.remoteJid, conv.remoteJidAlt);
          const telefone = extrairTelefoneDeRemoteJid(jidParaTelefone);

          // Deduplicação por telefone: se já existe, manter o que tem remoteJidAlt válido
          const existente = mapaPorTelefone.get(telefone);
          if (existente) {
            // Preferir versão com remoteJidAlt (@s.whatsapp.net) sobre @lid
            if (conv.remoteJidAlt?.includes("@s.whatsapp.net") && existente.remoteJid.includes("@lid")) {
              // Substituir pela versão mais limpa
            } else {
              continue; // Manter existente
            }
          }

          const leadMatch = mapaLeads.get(telefone) ?? null;

          mapaPorTelefone.set(telefone, {
            instanceName: inst.instanceName,
            remoteJid: conv.remoteJid,
            telefone,
            pushName: conv.pushName ?? null,
            isGroup: false,
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

      debug.chatsPerInstance[inst.instanceName] = mapaPorTelefone.size;
    } catch (error) {
      const msg = `Erro ao buscar conversas da instancia ${inst.instanceName}: ${error instanceof Error ? error.message : String(error)}`;
      debug.errors.push(msg);
      console.error(msg);
    }
  }

  // Ordenar por timestamp DESC
  const todasOrdenadas = Array.from(mapaPorTelefone.values()).sort((a, b) => {
    const tsA = a.ultimaMensagem?.timestamp ?? 0;
    const tsB = b.ultimaMensagem?.timestamp ?? 0;
    return tsB - tsA;
  });

  const idsLeadsVinculados = todasOrdenadas
    .map((chat) => chat.leadMatch?.id)
    .filter((id): id is string => Boolean(id));

  const idsNegociosVinculados = todasOrdenadas
    .map((chat) => chat.leadMatch?.id_negocio)
    .filter((id): id is string => Boolean(id));

  const negociosPorId = new Map<string, NegocioInfo>();
  if (idsNegociosVinculados.length > 0) {
    const negocios = await prisma.negocio.findMany({
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
    });

    for (const negocio of negocios) {
      negociosPorId.set(negocio.id, negocio);
    }
  }

  const unreadPorLead = new Map<string, number>();
  if (idsLeadsVinculados.length > 0) {
    const contagens = await prisma.whatsappMensagem.groupBy({
      by: ["id_lead"],
      where: {
        id_empresa: sessao.id_empresa,
        id_lead: { in: idsLeadsVinculados },
        from_me: false,
        lida_no_crm_em: null,
      },
      _count: { _all: true },
    });

    for (const item of contagens) {
      unreadPorLead.set(item.id_lead, item._count._all);
    }
  }

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
    debug,
  };
}
