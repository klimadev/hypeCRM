import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export type FollowUpTemplateDTO = {
  id: string;
  nome: string;
  descricao: string | null;
  canal: "whatsapp";
  ativo: boolean;
  permiteRepeticao: boolean;
  maxCiclos: number;
  pausarSeResponder: boolean;
  etapas: Array<{
    id: string;
    ordem: number;
    delayMinutos: number;
    conteudo: string;
    ativo: boolean;
  }>;
  criadoEm: string;
  atualizadoEm: string;
};

export function mapTemplate(item: {
  id: string;
  nome: string;
  descricao: string | null;
  canal: string;
  ativo: boolean;
  permite_repeticao: boolean;
  max_ciclos: number;
  pausar_se_responder: boolean;
  criado_em: Date;
  atualizado_em: Date;
  etapas: Array<{
    id: string;
    ordem: number;
    delay_minutos: number;
    conteudo: string;
    ativo: boolean;
  }>;
}): FollowUpTemplateDTO {
  return {
    id: item.id,
    nome: item.nome,
    descricao: item.descricao,
    canal: "whatsapp",
    ativo: item.ativo,
    permiteRepeticao: item.permite_repeticao,
    maxCiclos: item.max_ciclos,
    pausarSeResponder: item.pausar_se_responder,
    etapas: item.etapas
      .sort((a, b) => a.ordem - b.ordem)
      .map((etapa) => ({
        id: etapa.id,
        ordem: etapa.ordem,
        delayMinutos: etapa.delay_minutos,
        conteudo: etapa.conteudo,
        ativo: etapa.ativo,
      })),
    criadoEm: item.criado_em.toISOString(),
    atualizadoEm: item.atualizado_em.toISOString(),
  };
}

function proximaEtapa(params: {
  etapas: Array<{ ordem: number; delay_minutos: number; conteudo: string; ativo: boolean }>;
  etapaAtual: number;
  cicloAtual: number;
  permiteRepeticao: boolean;
  maxCiclos: number;
}) {
  const etapasAtivas = params.etapas.filter((etapa) => etapa.ativo).sort((a, b) => a.ordem - b.ordem);
  if (!etapasAtivas.length) return null;

  const indiceAtual = etapasAtivas.findIndex((etapa) => etapa.ordem === params.etapaAtual);
  const proximoIndice = indiceAtual + 1;

  if (indiceAtual === -1) {
    const etapa = etapasAtivas[0];
    return { etapaOrdem: etapa.ordem, ciclo: params.cicloAtual, delayMinutos: etapa.delay_minutos, conteudo: etapa.conteudo };
  }

  if (proximoIndice < etapasAtivas.length) {
    const etapa = etapasAtivas[proximoIndice];
    return { etapaOrdem: etapa.ordem, ciclo: params.cicloAtual, delayMinutos: etapa.delay_minutos, conteudo: etapa.conteudo };
  }

  if (!params.permiteRepeticao || params.cicloAtual >= params.maxCiclos) {
    return null;
  }

  const primeira = etapasAtivas[0];
  return { etapaOrdem: primeira.ordem, ciclo: params.cicloAtual + 1, delayMinutos: primeira.delay_minutos, conteudo: primeira.conteudo };
}

export async function agendarProximoFollowUp(conversaId: string) {
  const conversa = await prisma.followUpConversa.findUnique({
    where: { id: conversaId },
    include: {
      template: {
        include: {
          etapas: true,
        },
      },
    },
  });

  if (!conversa || conversa.status !== "ATIVO") return null;

  const proxima = proximaEtapa({
    etapas: conversa.template.etapas,
    etapaAtual: conversa.etapa_atual,
    cicloAtual: conversa.ciclo_atual,
    permiteRepeticao: conversa.template.permite_repeticao,
    maxCiclos: conversa.template.max_ciclos,
  });

  if (!proxima) {
    await prisma.followUpConversa.update({
      where: { id: conversa.id },
      data: {
        status: "ENCERRADO",
        motivo_encerramento: "Fluxo concluido",
        proximo_disparo_em: null,
        atualizado_em: new Date(),
      },
    });
    return null;
  }

  const agendadoPara = new Date(Date.now() + proxima.delayMinutos * 60 * 1000);

  const mensagem = await prisma.mensagemAgendada.create({
    data: {
      id: randomUUID(),
      id_empresa: conversa.id_empresa,
      id_lead: conversa.id_lead,
      id_followup_conversa: conversa.id,
      instance_name: conversa.instance_name,
      remote_jid: conversa.remote_jid,
      conteudo: proxima.conteudo,
      tipo: "text",
      followup_etapa: proxima.etapaOrdem,
      followup_ciclo: proxima.ciclo,
      agendado_para: agendadoPara,
      status: "PENDENTE",
      criado_por: conversa.criado_por,
    },
  });

  await prisma.followUpConversa.update({
    where: { id: conversa.id },
    data: {
      etapa_atual: proxima.etapaOrdem,
      ciclo_atual: proxima.ciclo,
      proximo_disparo_em: agendadoPara,
      atualizado_em: new Date(),
    },
  });

  return mensagem;
}

export async function verificarRespostaCliente(conversaId: string) {
  const conversa = await prisma.followUpConversa.findUnique({ where: { id: conversaId } });
  if (!conversa) return false;

  let referenciaSaida = conversa.ultima_saida_em;
  if (!referenciaSaida) {
    const ultimaEtapaEnviada = await prisma.mensagemAgendada.findFirst({
      where: {
        id_followup_conversa: conversa.id,
        status: "ENVIADO",
      },
      orderBy: { enviado_em: "desc" },
      select: { enviado_em: true },
    });

    if (!ultimaEtapaEnviada?.enviado_em) {
      return false;
    }

    referenciaSaida = ultimaEtapaEnviada.enviado_em;
  }

  const desde = Math.floor(referenciaSaida.getTime() / 1000);
  const resposta = await prisma.whatsappMensagem.findFirst({
    where: {
      id_empresa: conversa.id_empresa,
      id_lead: conversa.id_lead,
      from_me: false,
      remote_jid: conversa.remote_jid,
      timestamp: { gt: desde },
    },
    orderBy: { timestamp: "desc" },
  });

  if (!resposta) return false;

  await prisma.$transaction([
    prisma.followUpConversa.update({
      where: { id: conversa.id },
      data: {
        status: "ENCERRADO",
        ultima_resposta_em: new Date(resposta.timestamp * 1000),
        motivo_pausa: null,
        motivo_encerramento: "Cliente respondeu",
        proximo_disparo_em: null,
        atualizado_em: new Date(),
      },
    }),
    prisma.mensagemAgendada.updateMany({
      where: {
        id_followup_conversa: conversa.id,
        status: { in: ["PENDENTE", "FALHA", "PROCESSANDO"] },
      },
      data: {
        status: "CANCELADO",
        atualizado_em: new Date(),
      },
    }),
  ]);

  return true;
}

export async function processarFollowUpsPendentes(limite: number) {
  const conversas = await prisma.followUpConversa.findMany({
    where: { status: "ATIVO" },
    include: {
      template: {
        include: {
          etapas: true,
        },
      },
    },
    orderBy: { atualizado_em: "asc" },
    take: limite,
  });

  let pausadasPorResposta = 0;
  let avancadas = 0;

  for (const conversa of conversas) {
    const respondeu = await verificarRespostaCliente(conversa.id);
    if (respondeu) {
      pausadasPorResposta += 1;
      continue;
    }

    const ultimaEnviada = await prisma.mensagemAgendada.findFirst({
      where: {
        id_followup_conversa: conversa.id,
        status: "ENVIADO",
        followup_etapa: conversa.etapa_atual,
        followup_ciclo: conversa.ciclo_atual,
      },
      orderBy: { enviado_em: "desc" },
      select: { id: true, enviado_em: true },
    });

    if (!ultimaEnviada?.enviado_em) continue;
    if (conversa.ultima_saida_em && ultimaEnviada.enviado_em <= conversa.ultima_saida_em) continue;

    await prisma.followUpConversa.update({
      where: { id: conversa.id },
      data: {
        ultima_saida_em: ultimaEnviada.enviado_em,
        atualizado_em: new Date(),
      },
    });

    await agendarProximoFollowUp(conversa.id);
    avancadas += 1;
  }

  return {
    processadas: conversas.length,
    pausadasPorResposta,
    avancadas,
  };
}
