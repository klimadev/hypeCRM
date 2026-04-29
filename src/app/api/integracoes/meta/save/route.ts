import { NextRequest, NextResponse } from "next/server";
import { META_CAPI_EVENT_NAME } from "@/lib/meta-capi";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  console.log("[META-SAVE] === INICIANDO SAVE ===");
  console.log("[META-SAVE] Request URL:", request.url);

  const auth = await exigirSessao(request);
  console.log("[META-SAVE] Auth result:", { erro: auth.erro, perfil: auth.sessao?.perfil });

  if (auth.erro) {
    console.log("[META-SAVE] ERRO: Auth falhou");
    return auth.erro;
  }

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    console.log("[META-SAVE] ERRO: Sem permissão. Perfil:", auth.sessao.perfil);
    return respostaSemPermissao();
  }

  const idEmpresa = auth.sessao.id_empresa;
  console.log("[META-SAVE] ID Empresa:", idEmpresa);

  try {
    console.log("[META-SAVE] Parseando body...");
    const body = await request.json();
    console.log("[META-SAVE] Body received:", JSON.stringify(body, null, 2));

    const { pixelId, accessToken, ativo } = body;

    console.log("[META-SAVE] Executando upsert...");
    await prisma.metaCapiConfig.upsert({
      where: { id_empresa: idEmpresa },
      update: {
        pixel_id: pixelId ?? null,
        access_token: accessToken ?? null,
        event_name: META_CAPI_EVENT_NAME,
        ativo: ativo ?? false,
        atualizado_em: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        id_empresa: idEmpresa,
        pixel_id: pixelId ?? null,
        access_token: accessToken ?? null,
        event_name: META_CAPI_EVENT_NAME,
        ativo: ativo ?? false,
      },
    });
    console.log("[META-SAVE] Upsert concluído");

    const successResponse = { sucesso: true };
    console.log("[META-SAVE] Retorno sucesso:", JSON.stringify(successResponse));
    console.log("[META-SAVE] === FIM SAVE ===");

    return NextResponse.json(successResponse);
  } catch (erro) {
    console.log("[META-SAVE] ERRO:", erro);
    const errorResponse = { erro: "Erro ao salvar configuração." };
    console.log("[META-SAVE] Retorno erro:", JSON.stringify(errorResponse));
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
