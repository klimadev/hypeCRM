import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/permissoes";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const { id } = await params;

  const instancia = await prisma.calComInstancia.findFirst({
    where: { id, id_empresa: auth.sessao.id_empresa },
    select: {
      id: true,
      nome: true,
      status: true,
      profile_name: true,
      profile_email: true,
      criado_em: true,
      atualizado_em: true,
    },
  });

  if (!instancia) {
    return NextResponse.json({ erro: "Instancia nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    instancia: {
      ...instancia,
      criado_em: instancia.criado_em.toISOString(),
      atualizado_em: instancia.atualizado_em.toISOString(),
    },
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil !== "EMPRESA") {
    return NextResponse.json({ erro: "Apenas EMPRESA pode excluir." }, { status: 403 });
  }

  const { id } = await params;

  const instancia = await prisma.calComInstancia.findFirst({
    where: { id, id_empresa: auth.sessao.id_empresa },
  });

  if (!instancia) {
    return NextResponse.json({ erro: "Instancia nao encontrada." }, { status: 404 });
  }

  await prisma.calComInstancia.delete({ where: { id } });

  return NextResponse.json({ sucesso: true });
}
