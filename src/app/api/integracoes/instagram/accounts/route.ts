import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    return respostaSemPermissao();
  }

  const contas = await prisma.instagramConta.findMany({
    where: { id_empresa: auth.sessao.id_empresa },
    orderBy: { criado_em: "desc" },
    select: {
      id: true,
      nome: true,
      instagram_user_id: true,
      username: true,
      account_type: true,
      profile_picture_url: true,
      status: true,
      criado_em: true,
      atualizado_em: true,
      expires_at: true,
    },
  });

  return NextResponse.json({
    contas: contas.map((conta) => ({
      ...conta,
      criado_em: conta.criado_em.toISOString(),
      atualizado_em: conta.atualizado_em.toISOString(),
      expires_at: conta.expires_at?.toISOString() ?? null,
    })),
  });
}
