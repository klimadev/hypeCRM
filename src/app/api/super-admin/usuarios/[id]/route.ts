import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoNoServidor, validarSuperAdmin } from "@/lib/autenticacao";
import { z } from "zod";

const esquemaEditar = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional(),
  tipo: z.enum(["empresa", "funcionario"]),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoNoServidor();
  const eSuperAdmin = await validarSuperAdmin(sessao);
  if (!sessao || !eSuperAdmin) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const validacao = esquemaEditar.safeParse(body);

  if (!validacao.success) {
    return NextResponse.json({ erro: "Dados invalidos" }, { status: 400 });
  }

  const { nome, email, tipo } = validacao.data;

  if (tipo === "empresa") {
    const existente = await prisma.empresa.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json({ erro: "Usuario nao encontrado" }, { status: 404 });
    }

    if (email && email !== existente.email) {
      const emUso = await prisma.empresa.findUnique({ where: { email } });
      if (emUso) {
        return NextResponse.json({ erro: "Email ja em uso" }, { status: 400 });
      }
    }

    const usuario = await prisma.empresa.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(email && { email }),
        atualizado_em: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      usuario: {
        id: usuario.id,
        tipo: "empresa",
        nome: usuario.nome,
        email: usuario.email,
        isSuperAdmin: usuario.isSuperAdmin,
        status: usuario.status_assinatura,
      },
    });
  } else {
    const existente = await prisma.funcionario.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json({ erro: "Usuario nao encontrado" }, { status: 404 });
    }

    if (email && email !== existente.email) {
      const emUso = await prisma.funcionario.findUnique({ where: { email } });
      if (emUso) {
        return NextResponse.json({ erro: "Email ja em uso" }, { status: 400 });
      }
    }

    const usuario = await prisma.funcionario.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(email && { email }),
        atualizado_em: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      usuario: {
        id: usuario.id,
        tipo: "funcionario",
        nome: usuario.nome,
        email: usuario.email,
        ativo: usuario.ativo,
      },
    });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoNoServidor();
  const eSuperAdmin = await validarSuperAdmin(sessao);
  if (!sessao || !eSuperAdmin) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");

  if (tipo === "empresa") {
    if (id === sessao.id_usuario) {
      return NextResponse.json({ erro: "Nao pode excluir a si mesmo" }, { status: 400 });
    }

    await prisma.empresa.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } else if (tipo === "funcionario") {
    await prisma.funcionario.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ erro: "Tipo invalido" }, { status: 400 });
}