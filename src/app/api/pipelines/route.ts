import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, podeGerenciarEmpresa, respostaSemPermissao } from "@/lib/permissoes";
import { EsquemaCriarPipeline } from "@/lib/validacoes.crm";
import { badRequest } from "@/lib/api/http";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function gerarSlugUnico(idEmpresa: string, nome: string, tentativa = 0): Promise<string> {
  const baseSlug = slugify(nome);
  const slug = tentativa === 0 ? baseSlug : `${baseSlug}-${tentativa}`;
  
  const existente = await prisma.funil.findFirst({
    where: { id_empresa: idEmpresa, slug },
  });
  
  if (existente) {
    return gerarSlugUnico(idEmpresa, nome, tentativa + 1);
  }
  
  return slug;
}

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id_empresa } = auth.sessao;

  const pipelines = await prisma.funil.findMany({
    where: { id_empresa, ativo: true },
    orderBy: { ordem: "asc" },
    select: {
      id: true,
      nome: true,
      slug: true,
      descricao: true,
      padrao: true,
      ordem: true,
    },
  });

  return NextResponse.json({ pipelines });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  if (!podeGerenciarEmpresa(auth.sessao)) {
    return respostaSemPermissao();
  }

  const body = await request.json();
  const resultado = EsquemaCriarPipeline.safeParse(body);
  
  if (!resultado.success) {
    const primeiroErro = resultado.error.issues[0];
    const mensagem = primeiroErro?.message || "Dados inválidos.";
    return badRequest(mensagem);
  }

  const { nome, descricao, ordem } = resultado.data;
  const { id_empresa } = auth.sessao;

  const slug = await gerarSlugUnico(id_empresa, nome);

  const maxOrdem = await prisma.funil.aggregate({
    where: { id_empresa },
    _max: { ordem: true },
  });

  const novaOrdem = ordem ?? (maxOrdem._max?.ordem ?? 0) + 1;

  const pipeline = await prisma.funil.create({
    data: {
      id: randomUUID(),
      id_empresa,
      nome,
      slug,
      descricao: descricao ?? null,
      ordem: novaOrdem,
      padrao: false,
      ativo: true,
    },
  });

  const estagiosIniciais = [
    { nome: "Novo Lead", tipo: "ABERTO", ordem: 1 },
    { nome: "Em Contato", tipo: "PROGRESSO", ordem: 2 },
    { nome: "Qualificação", tipo: "PROGRESSO", ordem: 3 },
    { nome: "Proposta Enviada", tipo: "PROGRESSO", ordem: 4 },
    { nome: "Fechado com Sucesso", tipo: "SUCCESS", ordem: 5 },
    { nome: "Fechado sem Sucesso", tipo: "FALHA", ordem: 6 },
  ];

  for (const estagio of estagiosIniciais) {
    await prisma.estagioFunil.create({
      data: {
        id: randomUUID(),
        id_empresa,
        id_funil: pipeline.id,
        nome: estagio.nome,
        tipo: estagio.tipo,
        ordem: BigInt(estagio.ordem),
      },
    });
  }

  return NextResponse.json({ pipeline });
}