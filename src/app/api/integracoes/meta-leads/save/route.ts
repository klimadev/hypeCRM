import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    return respostaSemPermissao();
  }

  const idEmpresa = auth.sessao.id_empresa;

  try {
    const body = await request.json();
    const { pageTokens, ativo, campoMapping } = body;

    const tokensJson = JSON.stringify(pageTokens ?? []);

    await prisma.metaLeadAdsConfig.upsert({
      where: { id_empresa: idEmpresa },
      update: {
        page_tokens: tokensJson,
        ativo: ativo ?? false,
        atualizado_em: new Date(),
        ...(ativo ? { ultima_sync: new Date() } : {}),
      },
      create: {
        id: crypto.randomUUID(),
        id_empresa: idEmpresa,
        page_tokens: tokensJson,
        ativo: ativo ?? false,
        ...(ativo ? { ultima_sync: new Date() } : {}),
      },
    });

    // ponytail: campo_mapping via raw query pq o campo n ta no schema source
    if (campoMapping !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE MetaLeadAdsConfig SET campo_mapping = ? WHERE id_empresa = ?`,
        JSON.stringify(campoMapping),
        idEmpresa,
      );
    }

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    return NextResponse.json({ sucesso: false, erro: "Erro ao salvar configuracao." }, { status: 500 });
  }
}
