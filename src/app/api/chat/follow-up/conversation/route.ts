import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/permissoes";
import {
  esquemaFollowUpConversaAcao,
  esquemaFollowUpConversaAtivar,
  esquemaFollowUpConversaGet,
  mensagemErroValidacao,
} from "@/lib/validacoes";
import { agendarProximoFollowUp } from "@/lib/chat/follow-up";

function mapConversa(item: {
  id: string;
  status: string;
  etapa_atual: number;
  ciclo_atual: number;
  proximo_disparo_em: Date | null;
  ultima_saida_em: Date | null;
  ultima_resposta_em: Date | null;
  motivo_pausa: string | null;
  motivo_encerramento: string | null;
  template: { id: string; nome: string; max_ciclos: number; permite_repeticao: boolean };
}) {
  return {
    id: item.id,
    status: item.status,
    etapaAtual: item.etapa_atual,
    cicloAtual: item.ciclo_atual,
    proximoDisparoEm: item.proximo_disparo_em?.toISOString() ?? null,
    ultimaSaidaEm: item.ultima_saida_em?.toISOString() ?? null,
    ultimaRespostaEm: item.ultima_resposta_em?.toISOString() ?? null,
    motivoPausa: item.motivo_pausa,
    motivoEncerramento: item.motivo_encerramento,
    template: {
      id: item.template.id,
      nome: item.template.nome,
      maxCiclos: item.template.max_ciclos,
      permiteRepeticao: item.template.permite_repeticao,
    },
  };
}

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const searchParams = new URL(request.url).searchParams;
  const validacao = esquemaFollowUpConversaGet.safeParse({
    instanceName: searchParams.get("instanceName") ?? undefined,
    remoteJid: searchParams.get("remoteJid") ?? undefined,
  });
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const conversa = await prisma.followUpConversa.findFirst({
    where: {
      id_empresa: auth.sessao.id_empresa,
      instance_name: validacao.data.instanceName,
      remote_jid: validacao.data.remoteJid,
      status: { in: ["ATIVO", "PAUSADO", "ENCERRADO"] },
    },
    include: {
      template: {
        select: { id: true, nome: true, max_ciclos: true, permite_repeticao: true },
      },
    },
    orderBy: { atualizado_em: "desc" },
  });

  return NextResponse.json({ conversa: conversa ? mapConversa(conversa) : null });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const payload = await request.json().catch(() => null);
  const validacao = esquemaFollowUpConversaAtivar.safeParse(payload);
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const { instanceName, remoteJid, idLead, templateId } = validacao.data;

  const instanciaPermitida = await prisma.whatsappInstancia.findFirst({
    where: { id_empresa: auth.sessao.id_empresa, instance_name: instanceName },
    select: { id: true },
  });
  if (!instanciaPermitida) {
    return NextResponse.json({ erro: "Instancia nao encontrada nesta empresa." }, { status: 403 });
  }

  const template = await prisma.followUpTemplate.findFirst({
    where: {
      id: templateId,
      id_empresa: auth.sessao.id_empresa,
      ativo: true,
      canal: "whatsapp",
    },
    select: { id: true },
  });

  if (!template) {
    return NextResponse.json({ erro: "Template de follow-up invalido." }, { status: 404 });
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: idLead,
      id_empresa: auth.sessao.id_empresa,
    },
    select: { id: true },
  });
  if (!lead) {
    return NextResponse.json({ erro: "Lead nao encontrado nesta empresa." }, { status: 404 });
  }

  const ativo = await prisma.followUpConversa.findFirst({
    where: {
      id_empresa: auth.sessao.id_empresa,
      instance_name: instanceName,
      remote_jid: remoteJid,
      status: "ATIVO",
    },
    select: { id: true },
  });

  if (ativo) {
    return NextResponse.json({ erro: "Ja existe follow-up ativo para esta conversa." }, { status: 409 });
  }

  const conversa = await prisma.followUpConversa.create({
    data: {
      id: randomUUID(),
      id_empresa: auth.sessao.id_empresa,
      id_template: templateId,
      id_lead: idLead,
      instance_name: instanceName,
      remote_jid: remoteJid,
      status: "ATIVO",
      etapa_atual: 0,
      ciclo_atual: 1,
      criado_por: auth.sessao.id_usuario,
    },
    include: {
      template: {
        select: { id: true, nome: true, max_ciclos: true, permite_repeticao: true },
      },
    },
  });

  await agendarProximoFollowUp(conversa.id);
  const atualizada = await prisma.followUpConversa.findUnique({
    where: { id: conversa.id },
    include: {
      template: { select: { id: true, nome: true, max_ciclos: true, permite_repeticao: true } },
    },
  });

  return NextResponse.json({ conversa: atualizada ? mapConversa(atualizada) : mapConversa(conversa) }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const payload = await request.json().catch(() => null);
  const validacao = esquemaFollowUpConversaAcao.safeParse(payload);
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const conversa = await prisma.followUpConversa.findUnique({
    where: { id: validacao.data.conversaId },
    include: {
      template: { select: { id: true, nome: true, max_ciclos: true, permite_repeticao: true } },
    },
  });

  if (!conversa || conversa.id_empresa !== auth.sessao.id_empresa) {
    return NextResponse.json({ erro: "Follow-up nao encontrado." }, { status: 404 });
  }

  if (validacao.data.acao === "PAUSAR") {
    await prisma.$transaction([
      prisma.followUpConversa.update({
        where: { id: conversa.id },
        data: {
          status: "PAUSADO",
          motivo_pausa: "Pausado manualmente",
          proximo_disparo_em: null,
          atualizado_em: new Date(),
        },
      }),
      prisma.mensagemAgendada.updateMany({
        where: {
          id_followup_conversa: conversa.id,
          status: { in: ["PENDENTE", "PROCESSANDO", "FALHA"] },
        },
        data: { status: "CANCELADO", atualizado_em: new Date() },
      }),
    ]);
  }

  if (validacao.data.acao === "RETOMAR") {
    await prisma.followUpConversa.update({
      where: { id: conversa.id },
      data: {
        status: "ATIVO",
        motivo_pausa: null,
        atualizado_em: new Date(),
      },
    });
    await agendarProximoFollowUp(conversa.id);
  }

  if (validacao.data.acao === "ENCERRAR") {
    await prisma.$transaction([
      prisma.followUpConversa.update({
        where: { id: conversa.id },
        data: {
          status: "ENCERRADO",
          motivo_encerramento: "Encerrado manualmente",
          proximo_disparo_em: null,
          atualizado_em: new Date(),
        },
      }),
      prisma.mensagemAgendada.updateMany({
        where: {
          id_followup_conversa: conversa.id,
          status: { in: ["PENDENTE", "PROCESSANDO", "FALHA"] },
        },
        data: { status: "CANCELADO", atualizado_em: new Date() },
      }),
    ]);
  }

  const atualizada = await prisma.followUpConversa.findUnique({
    where: { id: conversa.id },
    include: {
      template: { select: { id: true, nome: true, max_ciclos: true, permite_repeticao: true } },
    },
  });

  return NextResponse.json({ conversa: atualizada ? mapConversa(atualizada) : mapConversa(conversa) });
}
