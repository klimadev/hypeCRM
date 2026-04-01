import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    return respostaSemPermissao();
  }

  const { id } = await context.params;

  const resultado = await prisma.instagramConta.deleteMany({
    where: {
      id,
      id_empresa: auth.sessao.id_empresa,
    },
  });

  if (resultado.count === 0) {
    return NextResponse.json({ erro: "Conta nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({ sucesso: true });
}
