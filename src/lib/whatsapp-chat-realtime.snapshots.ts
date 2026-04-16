import { prisma } from "@/lib/prisma";
import type { SessaoToken } from "@/lib/tipos";
import { buscarConversas, buscarConversasEvolution } from "@/lib/evolution-api";
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
import type { ConversasResponse } from "@/modules/whatsapp/types";
import { type MensagensSnapshot } from "./whatsapp-chat-realtime.state";
import {
  criarWhereLeadMensagensRealtime,
  mapearConversaResumoRealtime,
  normalizarLimiteConversasRealtime,
} from "./whatsapp-chat-realtime.utils";

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

async function sincronizarMensagensSemLead(params: {
  idEmpresa: string;
  idInstancia: string;
  mensagens: ReturnType<typeof normalizarMensagensEvolution>;
}) {
  for (const msg of params.mensagens) {
    try {
      await prisma.whatsappMensagem.upsert({
        where: {
          id_whatsapp_instancia_mensagem_id: {
            id_whatsapp_instancia: params.idInstancia || "temp",
            mensagem_id: msg.messageId,
          },
        },
        create: {
          id: `msg-${msg.messageId.slice(0, 20)}-${Date.now()}`,
          id_empresa: params.idEmpresa,
          id_lead: null,
          id_whatsapp_instancia: params.idInstancia || "temp",
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

export async function obterSnapshotMensagens(
  sessao: SessaoToken,
  params: SnapshotParams,
): Promise<MensagensSnapshot> {
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

    let instanciaEncontrada = await resolverInstanciaDoLead(sessao.id_empresa, lead.id);
    if (!instanciaEncontrada) {
      instanciaEncontrada = await resolverInstanciaPorTelefone(sessao.id_empresa, lead.telefone);
    }

    if (!instanciaEncontrada) {
      throw new Error("Nenhuma instância WhatsApp conectada.");
    }
    instancia = instanciaEncontrada;
  } else {
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

  return await (async () => {
    const whereLead = criarWhereLeadMensagensRealtime(leadId, phoneNumber);

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

    let connectionStatus: MensagensSnapshot["connectionStatus"] = "offline";

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
            await upsertMensagensNoBanco(prisma, {
              idEmpresa: sessao.id_empresa,
              idLead: leadId,
              idWhatsappInstancia: instancia.id,
              mensagens: mensagensNormalizadas,
            });
          } else {
            await sincronizarMensagensSemLead({
              idEmpresa: sessao.id_empresa,
              idInstancia: instancia.id,
              mensagens: mensagensNormalizadas,
            });
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
      messages: (mensagensAtualizadas.length > 0 ? mensagensAtualizadas : mensagensCache).map(mapearMensagemDbParaCanonica),
      connectionStatus,
      unreadCount: mensagensAtualizadas.length > 0 ? unreadAtualizado : unreadCount,
    };

    return snapshot;
  })();
}

export async function obterSnapshotConversas(
  sessao: SessaoToken,
  params: { busca?: string; cursor?: string | null; limite?: number; naoLidas?: boolean },
): Promise<ConversasResponse> {
  const busca = params.busca?.trim() ?? "";
  const cursor = params.cursor?.trim() ?? null;
  const limite = normalizarLimiteConversasRealtime(params.limite);
  const apenasNaoLidas = params.naoLidas === true;

  const instancia = await prisma.whatsappInstancia.findFirst({
    where: { id_empresa: sessao.id_empresa, status: "open" },
    orderBy: { criado_em: "asc" },
    select: { id: true, instance_name: true },
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

  const conversasFiltradas = conversasResolvidas.filter(({ conversa }) => {
    if (!apenasNaoLidas) return true;
    return conversa.lastMessage?.key?.fromMe === false;
  });

  const fatia = busca ? conversasFiltradas : conversasFiltradas.slice((paginaAtual - 1) * limite, paginaAtual * limite + 1);
  const temMais = fatia.length > limite;
  const conversasPaginadas = fatia.slice(0, limite);

  return {
    conversas: conversasPaginadas.map(({ conversa, lead }) =>
      mapearConversaResumoRealtime({ conversa, lead, agoraMs: Date.now() }),
    ),
    cursor: temMais ? String(paginaAtual + 1) : null,
    temMais,
  };
}
