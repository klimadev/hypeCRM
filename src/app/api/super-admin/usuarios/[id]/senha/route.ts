import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoNoServidor, validarSuperAdmin } from "@/lib/autenticacao";
import bcrypt from "bcryptjs";
import { z } from "zod";

const esquemaSenha = z.object({
  novaSenha: z.string().min(6),
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
  const validacao = esquemaSenha.safeParse(body);

  if (!validacao.success) {
    return NextResponse.json({ erro: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 });
  }

  const { novaSenha, tipo } = validacao.data;
  const senhaHash = await bcrypt.hash(novaSenha, 10);

  if (tipo === "empresa") {
    await prisma.empresa.update({
      where: { id },
      data: { senha_hash: senhaHash, atualizado_em: new Date() },
    });
  } else {
    await prisma.funcionario.update({
      where: { id },
      data: { senha_hash: senhaHash, atualizado_em: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}