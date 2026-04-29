import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { META_CAPI_EVENT_NAME } from "@/lib/meta-capi";

export async function GET(request: NextRequest) {
  console.log("[META-CONFIG] === INICIANDO GET CONFIG ===");
  console.log("[META-CONFIG] Request URL:", request.url);

  const auth = await exigirSessao(request);
  console.log("[META-CONFIG] Auth result:", { erro: auth.erro, perfil: auth.sessao?.perfil, idEmpresa: auth.sessao?.id_empresa });

  if (auth.erro) {
    console.log("[META-CONFIG] ERRO: Auth falhou");
    return auth.erro;
  }

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    console.log("[META-CONFIG] ERRO: Sem permissão. Perfil:", auth.sessao.perfil);
    return respostaSemPermissao();
  }

  const idEmpresa = auth.sessao.id_empresa;
  console.log("[META-CONFIG] ID Empresa:", idEmpresa);

  console.log("[META-CONFIG] Buscando config no banco...");
  const config = await prisma.metaCapiConfig.findUnique({
    where: { id_empresa: idEmpresa },
  });
  console.log("[META-CONFIG] Config encontrada:", JSON.stringify(config, null, 2));

  console.log("[META-CONFIG] Buscando eventos...");
  const eventos = await prisma.$queryRaw<Array<{
    id: string;
    id_empresa: string;
    id_negocio: string;
    evento_nome: string;
    evento_status: string;
    idempotency_key: string;
    telefone_hash: string | null;
    payload_json: string;
    resposta_json: string | null;
    erro: string | null;
    tentativas: number;
    criado_em: Date;
    atualizado_em: Date;
    enviado_em: Date | null;
    ciclo_fechamento: number;
  }>>(Prisma.sql`
    SELECT
      id,
      id_empresa,
      id_negocio,
      evento_nome,
      evento_status,
      idempotency_key,
      telefone_hash,
      payload_json,
      resposta_json,
      erro,
      tentativas,
      criado_em,
      atualizado_em,
      enviado_em,
      ciclo_fechamento
    FROM MetaCapiEvento
    WHERE id_empresa = ${idEmpresa}
    ORDER BY criado_em DESC
    LIMIT 50
  `);

  return NextResponse.json({
    pixelId: config?.pixel_id ?? "",
    accessToken: config?.access_token ?? "",
    eventName: META_CAPI_EVENT_NAME,
    ativo: config?.ativo ?? false,
    eventos: eventos.map((e) => ({
      id: e.id,
      id_empresa: e.id_empresa,
      id_negocio: e.id_negocio,
      evento_nome: e.evento_nome,
      evento_status: e.evento_status,
      idempotency_key: e.idempotency_key,
      telefone_hash: e.telefone_hash,
      payload_json: e.payload_json,
      resposta_json: e.resposta_json,
      erro: e.erro,
      tentativas: e.tentativas,
      criado_em: e.criado_em.toISOString(),
      atualizado_em: e.atualizado_em.toISOString(),
      enviado_em: e.enviado_em?.toISOString() ?? null,
      ciclo_fechamento: e.ciclo_fechamento,
    })),
  });
  console.log("[META-CONFIG] === FIM GET CONFIG ===");
}
