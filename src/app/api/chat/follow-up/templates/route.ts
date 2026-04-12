import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/permissoes";
import {
  esquemaFollowUpTemplateAtualizar,
  esquemaFollowUpTemplateExcluir,
  esquemaFollowUpTemplatePayload,
  mensagemErroValidacao,
} from "@/lib/validacoes";
import { mapTemplate } from "@/lib/chat/follow-up";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const templates = await prisma.followUpTemplate.findMany({
    where: { id_empresa: auth.sessao.id_empresa },
    include: { etapas: true },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  return NextResponse.json({ templates: templates.map(mapTemplate) });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;
  if (auth.sessao.perfil === "COLABORADOR") {
    return NextResponse.json({ erro: "Sem permissao para criar cadencias." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const validacao = esquemaFollowUpTemplatePayload.safeParse(payload);
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const dados = validacao.data;
  const template = await prisma.followUpTemplate.create({
    data: {
      id: randomUUID(),
      id_empresa: auth.sessao.id_empresa,
      nome: dados.nome,
      descricao: dados.descricao ?? null,
      canal: "whatsapp",
      ativo: dados.ativo,
      permite_repeticao: dados.permiteRepeticao,
      max_ciclos: dados.maxCiclos,
      pausar_se_responder: dados.pausarSeResponder,
      criado_por: auth.sessao.id_usuario,
      etapas: {
        create: dados.etapas.map((etapa) => ({
          id: randomUUID(),
          ordem: etapa.ordem,
          delay_minutos: etapa.delayMinutos,
          conteudo: etapa.conteudo,
          ativo: etapa.ativo,
        })),
      },
    },
    include: { etapas: true },
  });

  return NextResponse.json({ template: mapTemplate(template) }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;
  if (auth.sessao.perfil === "COLABORADOR") {
    return NextResponse.json({ erro: "Sem permissao para editar cadencias." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const validacao = esquemaFollowUpTemplateAtualizar.safeParse(payload);
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const { id, ...dados } = validacao.data;
  const existente = await prisma.followUpTemplate.findUnique({ where: { id }, select: { id_empresa: true } });
  if (!existente || existente.id_empresa !== auth.sessao.id_empresa) {
    return NextResponse.json({ erro: "Template nao encontrado." }, { status: 404 });
  }

  const template = await prisma.$transaction(async (tx) => {
    await tx.followUpTemplateEtapa.deleteMany({ where: { id_template: id } });

    return tx.followUpTemplate.update({
      where: { id },
      data: {
        nome: dados.nome,
        descricao: dados.descricao ?? null,
        ativo: dados.ativo,
        permite_repeticao: dados.permiteRepeticao,
        max_ciclos: dados.maxCiclos,
        pausar_se_responder: dados.pausarSeResponder,
        atualizado_em: new Date(),
        etapas: {
          create: dados.etapas.map((etapa) => ({
            id: randomUUID(),
            ordem: etapa.ordem,
            delay_minutos: etapa.delayMinutos,
            conteudo: etapa.conteudo,
            ativo: etapa.ativo,
          })),
        },
      },
      include: { etapas: true },
    });
  });

  return NextResponse.json({ template: mapTemplate(template) });
}

export async function DELETE(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;
  if (auth.sessao.perfil === "COLABORADOR") {
    return NextResponse.json({ erro: "Sem permissao para excluir cadencias." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const validacao = esquemaFollowUpTemplateExcluir.safeParse(payload);
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const usoAtivo = await prisma.followUpConversa.findFirst({
    where: {
      id_template: validacao.data.id,
      id_empresa: auth.sessao.id_empresa,
      status: "ATIVO",
    },
    select: { id: true },
  });

  if (usoAtivo) {
    return NextResponse.json({ erro: "Existe follow-up ativo usando este template." }, { status: 409 });
  }

  const existente = await prisma.followUpTemplate.findUnique({ where: { id: validacao.data.id }, select: { id_empresa: true } });
  if (!existente || existente.id_empresa !== auth.sessao.id_empresa) {
    return NextResponse.json({ erro: "Template nao encontrado." }, { status: 404 });
  }

  await prisma.followUpTemplate.delete({ where: { id: validacao.data.id } });
  return NextResponse.json({ ok: true });
}
