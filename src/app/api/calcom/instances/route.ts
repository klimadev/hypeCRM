import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/permissoes";
import { esquemaCriarCalComInstancia } from "@/lib/validacoes";
import { testarConexaoCalCom } from "@/lib/api/calcom";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const instancias = await prisma.calComInstancia.findMany({
    where: { id_empresa: auth.sessao.id_empresa },
    orderBy: { criado_em: "desc" },
    select: {
      id: true,
      nome: true,
      status: true,
      profile_name: true,
      profile_email: true,
      criado_em: true,
      atualizado_em: true,
    },
  });

  const instanciasSanitizadas = instancias.map((instancia) => ({
    ...instancia,
    criado_em: instancia.criado_em.toISOString(),
    atualizado_em: instancia.atualizado_em.toISOString(),
  }));

  return NextResponse.json({ instancias: instanciasSanitizadas });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    return NextResponse.json({ erro: "Sem permissao." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ erro: "Body invalido." }, { status: 400 });
  }

  const validacao = esquemaCriarCalComInstancia.safeParse(body);
  if (!validacao.success) {
    const primeiroErro = validacao.error.issues[0]?.message || "Erro de validacao";
    return NextResponse.json({ erro: primeiroErro }, { status: 400 });
  }

  const teste = await testarConexaoCalCom(validacao.data.api_key);
  if (!teste.sucesso) {
    return NextResponse.json({ erro: `Erro ao conectar: ${teste.erro}` }, { status: 400 });
  }

  const instancia = await prisma.calComInstancia.create({
    data: {
      id: randomUUID(),
      id_empresa: auth.sessao.id_empresa,
      id_criador: auth.sessao.id_usuario,
      nome: validacao.data.nome,
      api_key: validacao.data.api_key,
      status: "active",
      profile_name: teste.profile?.name || null,
      profile_email: teste.profile?.email || null,
    },
  });
  const instanciaSanitizada = {
    id: instancia.id,
    nome: instancia.nome,
    status: instancia.status,
    profile_name: instancia.profile_name,
    profile_email: instancia.profile_email,
    criado_em: instancia.criado_em.toISOString(),
    atualizado_em: instancia.atualizado_em.toISOString(),
  };

  return NextResponse.json({ instancia: instanciaSanitizada }, { status: 201 });
}
