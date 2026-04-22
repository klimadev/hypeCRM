import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoNoServidor, validarSuperAdmin } from "@/lib/autenticacao";
import { z } from "zod";

function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STATUS_VALIDOS = ["NOVO", "EM_TRIAGEM", "PLANEJADO", "RESOLVIDO", "DESCARTADO"] as const;
const PRIORIDADES_VALIDAS = ["BAIXA", "MEDIA", "ALTA", "CRITICA"] as const;

const esquemaPatch = z.object({
  status: z.enum(STATUS_VALIDOS).optional(),
  prioridade: z.enum(PRIORIDADES_VALIDAS).optional(),
  nota_interna: z.string().max(1000).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoNoServidor();
  const eSuperAdmin = await validarSuperAdmin(sessao);
  if (!sessao || !eSuperAdmin) {
    return NextResponse.json({ erro: "Nao autorizado." }, { status: 403 });
  }

  const { id } = await params;

  const [item, eventos] = await Promise.all([
    prisma.feedbackItem.findUnique({ where: { id } }),
    prisma.feedbackEvento.findMany({
      where: { id_feedback: id },
      orderBy: { criado_em: "asc" },
    }),
  ]);

  if (!item) {
    return NextResponse.json({ erro: "Feedback nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ item, eventos });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await obterSessaoNoServidor();
  const eSuperAdmin = await validarSuperAdmin(sessao);
  if (!sessao || !eSuperAdmin) {
    return NextResponse.json({ erro: "Nao autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const validacao = esquemaPatch.safeParse(body);
  if (!validacao.success) {
    return NextResponse.json({ erro: "Dados invalidos." }, { status: 400 });
  }

  const existente = await prisma.feedbackItem.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: "Feedback nao encontrado." }, { status: 404 });
  }

  const { status, prioridade, nota_interna } = validacao.data;
  const metaEvents: Record<string, unknown>[] = [];

  if (nota_interna !== undefined) {
    metaEvents.push({ acao: "NOTA", meta: nota_interna });
  }

  if (status && status !== existente.status) {
    metaEvents.push({ acao: "STATUS", de: existente.status, para: status });
  }

  if (prioridade && prioridade !== existente.prioridade) {
    metaEvents.push({ acao: "PRIORIDADE", de: existente.prioridade, para: prioridade });
  }

  const updates: Record<string, unknown> = { atualizado_em: new Date() };
  if (status) updates.status = status;
  if (prioridade) updates.prioridade = prioridade;
  if (nota_interna !== undefined) updates.nota_interna = sanitizeInput(nota_interna);

  const ops = [
    prisma.feedbackItem.update({ where: { id }, data: updates }),
    ...metaEvents.map((m) =>
      prisma.feedbackEvento.create({
        data: {
          id: crypto.randomUUID(),
          id_feedback: id,
          acao: m.acao as string,
          autor_id: sessao.id_usuario,
          autor_tipo: sessao.perfil,
          de_status: ("de" in m ? m.de : null) as string | null,
          para_status: ("para" in m ? m.para : null) as string | null,
          meta_json: "meta" in m ? JSON.stringify({ nota: m.meta }) : JSON.stringify(m),
        },
      })
    ),
  ];

  await prisma.$transaction(ops);

  return NextResponse.json({ ok: true });
}