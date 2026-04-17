import { prisma } from "@/lib/prisma";
import { whereLeadsPorPerfil } from "@/lib/permissoes";
import { normalizarTelefoneParaWhatsapp } from "@/lib/phone";
import type { SessaoToken } from "@/lib/tipos";
import type { ChatUnificado } from "@/modules/chat/types";

type ConversaBase = {
  instanceName: string;
  remoteJid: string;
  telefone: string;
  pushName: string | null;
  ultimaMensagem: {
    conteudo: string;
    fromMe: boolean;
    timestamp: number;
    kind?: string | null;
    hasMedia?: boolean | null;
    mediaUrl?: string | null;
  };
  unreadCount: number;
};

function extrairTelefone(remoteJid: string, remoteJidAlt: string | null) {
  const fonte = remoteJidAlt && remoteJidAlt.includes("@s.whatsapp.net") ? remoteJidAlt : remoteJid;
  return fonte.replace(/@.*/, "").replace(/\D/g, "");
}

function previewMensagem(tipo: string, conteudo: string | null) {
  const texto = (conteudo ?? "").trim();
  if (texto) return texto;
  const fallback: Record<string, string> = {
    imageMessage: "Foto",
    videoMessage: "Video",
    audioMessage: "Audio",
    documentMessage: "Documento",
    stickerMessage: "Sticker",
    reactionMessage: "Reacao",
    locationMessage: "Localizacao",
  };
  return fallback[tipo] ?? "Mensagem";
}

export async function listarChatsWhatsappPersistidos(params: {
  sessao: SessaoToken;
  pagina: number;
  limite: number;
  busca?: string;
}): Promise<{ chats: ChatUnificado[]; total: number; temMais: boolean }> {
  const { sessao, pagina, limite, busca } = params;

  const mensagens = await prisma.whatsappMensagem.findMany({
    where: {
      id_empresa: sessao.id_empresa,
      remote_jid: { not: { contains: "@g.us" } },
      NOT: { remote_jid: "status@broadcast" },
    },
    orderBy: [{ timestamp: "desc" }, { criado_em: "desc" }],
    select: {
      id_whatsapp_instancia: true,
      remote_jid: true,
      remote_jid_alt: true,
      from_me: true,
      conteudo: true,
      tipo: true,
      timestamp: true,
      push_name: true,
      id_lead: true,
      WhatsappInstancia: { select: { instance_name: true } },
    },
    take: 4000,
  });

  const mapa = new Map<string, ConversaBase>();
  for (const msg of mensagens) {
    const instanceName = msg.WhatsappInstancia.instance_name;
    const telefone = extrairTelefone(msg.remote_jid, msg.remote_jid_alt);
    if (!telefone) continue;
    const chave = `${instanceName}:${telefone}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        instanceName,
        remoteJid: msg.remote_jid_alt && msg.remote_jid_alt.includes("@s.whatsapp.net") ? msg.remote_jid_alt : msg.remote_jid,
        telefone,
        pushName: msg.push_name,
        ultimaMensagem: {
          conteudo: previewMensagem(msg.tipo, msg.conteudo),
          fromMe: msg.from_me,
          timestamp: msg.timestamp,
          kind: msg.tipo,
          hasMedia: ["imageMessage", "videoMessage", "audioMessage", "documentMessage", "stickerMessage"].includes(msg.tipo),
          mediaUrl: null,
        },
        unreadCount: 0,
      });
    }

    if (!msg.from_me) {
      const atual = mapa.get(chave);
      if (atual) atual.unreadCount += 1;
    }
  }

  let conversas = Array.from(mapa.values());

  const wherePerfil = await whereLeadsPorPerfil(sessao);
  const telefones = conversas.map((c) => c.telefone);
  const leads = telefones.length
    ? await prisma.lead.findMany({
        where: {
          ...wherePerfil,
          telefone: { in: telefones },
        },
        select: {
          id: true,
          nome: true,
          telefone: true,
          id_funcionario: true,
          id_pdv: true,
          id_estagio: true,
          id_negocio: true,
          origem: true,
          fonte: true,
          empresa_origem: true,
        },
      })
    : [];

  const funcionariosIds = leads.map((l) => l.id_funcionario).filter(Boolean);
  const estagiosIds = leads.map((l) => l.id_estagio).filter(Boolean);
  const pdvsIds = leads.map((l) => l.id_pdv).filter(Boolean) as string[];

  const [funcionarios, estagios, pdvs] = await Promise.all([
    funcionariosIds.length
      ? prisma.funcionario.findMany({ where: { id: { in: funcionariosIds } }, select: { id: true, nome: true } })
      : [],
    estagiosIds.length
      ? prisma.estagioFunil.findMany({ where: { id: { in: estagiosIds } }, select: { id: true, nome: true } })
      : [],
    pdvsIds.length ? prisma.pdv.findMany({ where: { id: { in: pdvsIds } }, select: { id: true, nome: true } }) : [],
  ]);

  const leadPorTelefone = new Map(
    leads.map((lead) => {
      const tel = normalizarTelefoneParaWhatsapp(lead.telefone).waNumber ?? lead.telefone;
      return [tel, lead] as const;
    }),
  );

  if (sessao.perfil !== "EMPRESA") {
    conversas = conversas.filter((c) => leadPorTelefone.has(c.telefone));
  }

  if (busca?.trim()) {
    const termo = busca.trim().toLowerCase();
    conversas = conversas.filter((c) => {
      const lead = leadPorTelefone.get(c.telefone);
      return (
        c.telefone.includes(termo.replace(/\D/g, "")) ||
        (c.pushName ?? "").toLowerCase().includes(termo) ||
        (lead?.nome ?? "").toLowerCase().includes(termo)
      );
    });
  }

  const chats = conversas
    .map((c): ChatUnificado => {
      const lead = leadPorTelefone.get(c.telefone) ?? null;
      return {
        instanceName: c.instanceName,
        remoteJid: c.remoteJid,
        telefone: c.telefone,
        pushName: c.pushName ?? lead?.nome ?? null,
        isGroup: false,
        canal: "whatsapp",
        ultimaMensagem: c.ultimaMensagem,
        unreadCount: c.unreadCount,
        instancias: [
          {
            instanceName: c.instanceName,
            remoteJid: c.remoteJid,
            ultimaMensagemTimestamp: c.ultimaMensagem.timestamp,
          },
        ],
        isDuplicado: false,
        instanciaSelecionada: c.instanceName,
        leadMatch: lead
          ? {
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
            }
          : null,
        semMatch: !lead,
      };
    })
    .sort((a, b) => (b.ultimaMensagem?.timestamp ?? 0) - (a.ultimaMensagem?.timestamp ?? 0));

  const total = chats.length;
  const skip = Math.max(0, (pagina - 1) * limite);
  const paginados = chats.slice(skip, skip + limite);
  const temMais = skip + paginados.length < total;

  return {
    chats: paginados,
    total,
    temMais,
  };
}
