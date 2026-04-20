import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoNoServidor, validarSuperAdmin } from "@/lib/autenticacao";

export async function GET(request: Request) {
  const sessao = await obterSessaoNoServidor();
  const eSuperAdmin = await validarSuperAdmin(sessao);
  if (!sessao || !eSuperAdmin) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") || "all";
  const pagina = parseInt(searchParams.get("pagina") || "1", 10);
  const limite = parseInt(searchParams.get("limite") || "20", 10);
  const offset = (pagina - 1) * limite;

  const whereEmpresa = tipo === "funcionario" ? undefined : undefined;
  const whereFuncionario = tipo === "empresa" ? undefined : undefined;

  const [empresas, funcionarios, total] = await Promise.all([
    tipo !== "funcionario"
      ? prisma.empresa.findMany({
          take: limite,
          skip: tipo === "all" ? offset : 0,
          orderBy: { criado_em: "desc" },
          select: {
            id: true,
            nome: true,
            email: true,
            isSuperAdmin: true,
            status_assinatura: true,
            criado_em: true,
          },
        })
      : Promise.resolve([]),
    tipo !== "empresa"
      ? prisma.funcionario.findMany({
          take: limite,
          skip: tipo === "all" ? offset : 0,
          orderBy: { criado_em: "desc" },
          include: { Empresa: { select: { nome: true } } },
        })
      : Promise.resolve([]),
    tipo === "empresa"
      ? prisma.empresa.count()
      : tipo === "funcionario"
      ? prisma.funcionario.count()
      : prisma.empresa.count() + prisma.funcionario.count(),
  ]);

  const usuarios = [
    ...empresas.map((e) => ({
      id: e.id,
      tipo: "empresa" as const,
      nome: e.nome,
      email: e.email,
      isSuperAdmin: e.isSuperAdmin,
      status: e.status_assinatura,
      criado_em: e.criado_em,
    })),
    ...funcionarios.map((f) => ({
      id: f.id,
      tipo: "funcionario" as const,
      nome: f.nome,
      email: f.email,
      isSuperAdmin: false,
      status: f.ativo ? "ATIVO" : "INATIVO",
      criado_em: f.criado_em,
      empresaNome: f.Empresa.nome,
    })),
  ].sort((a, b) => b.criado_em.getTime() - a.criado_em.getTime());

  const paginados =
    tipo === "all"
      ? usuarios.slice(offset, offset + limite)
      : usuarios;

  return NextResponse.json({
    usuarios: paginados,
    total,
    pagina,
    totalPaginas: Math.ceil(total / limite),
  });
}