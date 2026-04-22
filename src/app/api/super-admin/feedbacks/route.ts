import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoNoServidor, validarSuperAdmin } from "@/lib/autenticacao";

export async function GET(request: Request) {
  const sessao = await obterSessaoNoServidor();
  const eSuperAdmin = await validarSuperAdmin(sessao);
  if (!sessao || !eSuperAdmin) {
    return NextResponse.json({ erro: "Nao autorizado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const status = searchParams.get("status");
  const prioridade = searchParams.get("prioridade");
  const modulo = searchParams.get("modulo");
  const pagina = parseInt(searchParams.get("pagina") || "1", 10);
  const limite = parseInt(searchParams.get("limite") || "20", 10);
  const offset = (pagina - 1) * limite;

  const where: Record<string, unknown> = {};
  if (tipo) where.tipo = tipo;
  if (status) where.status = status;
  if (prioridade) where.prioridade = prioridade;
  if (modulo) where.modulo_origem = modulo;

  const [items, total] = await Promise.all([
    prisma.feedbackItem.findMany({
      where,
      orderBy: { criado_em: "desc" },
      take: limite,
      skip: offset,
    }),
    prisma.feedbackItem.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    pagina,
    totalPaginas: Math.ceil(total / limite),
  });
}