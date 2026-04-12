import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import {
  esquemaAtalhoMensagemChatAtualizar,
  esquemaAtalhoMensagemChatExcluir,
  esquemaAtalhoMensagemChatPayload,
  mensagemErroValidacao,
} from "@/lib/validacoes";

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .slice(0, 20);
  } catch {
    return [];
  }
}

function normalizarTags(tags: string[]): string[] {
  const unicas = new Set<string>();
  for (const tag of tags) {
    const valor = tag.trim().toLowerCase();
    if (valor) unicas.add(valor);
  }
  return Array.from(unicas).slice(0, 20);
}

function mapAtalho(item: {
  id: string;
  nome: string;
  slug: string;
  conteudo: string;
  tags_json: string;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}) {
  return {
    id: item.id,
    nome: item.nome,
    slug: item.slug,
    conteudo: item.conteudo,
    tags: parseTags(item.tags_json),
    ativo: item.ativo,
    criadoEm: item.criado_em.toISOString(),
    atualizadoEm: item.atualizado_em.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const atalhos = await prisma.mensagemAtalho.findMany({
    where: {
      id_empresa: auth.sessao.id_empresa,
      ...(auth.sessao.perfil === "COLABORADOR" ? { ativo: true } : {}),
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      slug: true,
      conteudo: true,
      tags_json: true,
      ativo: true,
      criado_em: true,
      atualizado_em: true,
    },
  });

  return NextResponse.json({ atalhos: atalhos.map(mapAtalho) });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil === "COLABORADOR") {
    return NextResponse.json({ erro: "Sem permissao para criar atalhos." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const validacao = esquemaAtalhoMensagemChatPayload.safeParse(payload);
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const dados = validacao.data;
  const slug = dados.slug.trim().toLowerCase();

  const existente = await prisma.mensagemAtalho.findFirst({
    where: { id_empresa: auth.sessao.id_empresa, slug },
    select: { id: true },
  });

  if (existente) {
    return NextResponse.json({ erro: "Ja existe um atalho com esse nome." }, { status: 409 });
  }

  const criado = await prisma.mensagemAtalho.create({
    data: {
      id: randomUUID(),
      id_empresa: auth.sessao.id_empresa,
      nome: dados.nome,
      slug,
      conteudo: dados.conteudo,
      tags_json: JSON.stringify(normalizarTags(dados.tags)),
      ativo: dados.ativo,
      criado_por: auth.sessao.id_usuario,
    },
    select: {
      id: true,
      nome: true,
      slug: true,
      conteudo: true,
      tags_json: true,
      ativo: true,
      criado_em: true,
      atualizado_em: true,
    },
  });

  return NextResponse.json({ atalho: mapAtalho(criado) }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil === "COLABORADOR") {
    return NextResponse.json({ erro: "Sem permissao para editar atalhos." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const validacao = esquemaAtalhoMensagemChatAtualizar.safeParse(payload);
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const { id, ...dados } = validacao.data;
  const slug = dados.slug.trim().toLowerCase();

  const existente = await prisma.mensagemAtalho.findUnique({
    where: { id },
    select: { id_empresa: true },
  });

  if (!existente || existente.id_empresa !== auth.sessao.id_empresa) {
    return NextResponse.json({ erro: "Atalho nao encontrado." }, { status: 404 });
  }

  const conflito = await prisma.mensagemAtalho.findFirst({
    where: {
      id_empresa: auth.sessao.id_empresa,
      slug,
      id: { not: id },
    },
    select: { id: true },
  });

  if (conflito) {
    return NextResponse.json({ erro: "Ja existe um atalho com esse nome." }, { status: 409 });
  }

  const atualizado = await prisma.mensagemAtalho.update({
    where: { id },
    data: {
      nome: dados.nome,
      slug,
      conteudo: dados.conteudo,
      tags_json: JSON.stringify(normalizarTags(dados.tags)),
      ativo: dados.ativo,
      atualizado_em: new Date(),
    },
    select: {
      id: true,
      nome: true,
      slug: true,
      conteudo: true,
      tags_json: true,
      ativo: true,
      criado_em: true,
      atualizado_em: true,
    },
  });

  return NextResponse.json({ atalho: mapAtalho(atualizado) });
}

export async function DELETE(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil === "COLABORADOR") {
    return NextResponse.json({ erro: "Sem permissao para excluir atalhos." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const validacao = esquemaAtalhoMensagemChatExcluir.safeParse(payload);
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const existente = await prisma.mensagemAtalho.findUnique({
    where: { id: validacao.data.id },
    select: { id_empresa: true },
  });

  if (!existente || existente.id_empresa !== auth.sessao.id_empresa) {
    return NextResponse.json({ erro: "Atalho nao encontrado." }, { status: 404 });
  }

  await prisma.mensagemAtalho.delete({
    where: { id: validacao.data.id },
  });

  return NextResponse.json({ ok: true });
}
