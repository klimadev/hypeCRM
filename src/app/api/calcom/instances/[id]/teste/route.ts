import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/permissoes";
import { testarConexaoCalCom } from "@/lib/api/calcom";

const prismaCalCom = prisma as typeof prisma & {
  calComInstancia: {
    findFirst: (args: {
      where: { id: string; id_empresa: string };
    }) => Promise<{ api_key: string } | null>;
    update: (args: {
      where: { id: string };
      data: {
        status: string;
        profile_name: string | null;
        profile_email: string | null;
      };
    }) => Promise<Record<string, unknown>>;
  };
};

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const { id } = await params;

  const instancia = await prismaCalCom.calComInstancia.findFirst({
    where: { id, id_empresa: auth.sessao.id_empresa },
  });

  if (!instancia) {
    return NextResponse.json({ erro: "Instancia nao encontrada." }, { status: 404 });
  }

  const teste = await testarConexaoCalCom(instancia.api_key);

  if (teste.sucesso) {
    await prismaCalCom.calComInstancia.update({
      where: { id },
      data: {
        status: "active",
        profile_name: teste.profile?.name || null,
        profile_email: teste.profile?.email || null,
      },
    });
  }

  return NextResponse.json({
    sucesso: teste.sucesso,
    profile: teste.profile,
    erro: teste.erro,
  });
}
