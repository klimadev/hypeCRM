import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    return respostaSemPermissao();
  }

  const idEmpresa = auth.sessao.id_empresa;

  const config = await prisma.metaLeadAdsConfig.findUnique({
    where: { id_empresa: idEmpresa },
  });

  let pageTokens: unknown[] = [];
  if (config?.page_tokens) {
    try { pageTokens = JSON.parse(config.page_tokens); } catch { pageTokens = []; }
  }

  // ponytail: campo_mapping via raw query pq o campo n ta no schema source
  let campoMapping: Record<string, unknown> = {};
  if (config) {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ campo_mapping: string | null }>>(
        `SELECT campo_mapping FROM MetaLeadAdsConfig WHERE id_empresa = ?`,
        idEmpresa,
      );
      if (rows?.[0]?.campo_mapping) campoMapping = JSON.parse(rows[0].campo_mapping);
    } catch { campoMapping = {}; }
  }

  return NextResponse.json({
    pageTokens,
    ativo: config?.ativo ?? false,
    intervaloMin: config?.intervalo_min ?? 5,
    ultimaSync: config?.ultima_sync?.toISOString() ?? null,
    campoMapping,
  });
}
