import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    return respostaSemPermissao();
  }

  const idEmpresa = auth.sessao.id_empresa;

  await prisma.metaLeadAdsConfig.updateMany({
    where: { id_empresa: idEmpresa },
    data: { ativo: false, atualizado_em: new Date() },
  });

  return NextResponse.json({ sucesso: true });
}
