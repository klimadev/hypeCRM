import { NextResponse } from "next/server";
import { obterSessaoNaRequest } from "@/lib/autenticacao";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { zodFeedbackTipo, zodFeedbackImpacto } from "@/modules/feedback/types";

const esquemaFeedback = z.object({
  tipo: zodFeedbackTipo,
  titulo: z.string().min(3).max(120),
  descricao: z.string().min(10).max(2000),
  impacto: zodFeedbackImpacto.optional(),
  rota_origem: z.string().optional(),
  modulo_origem: z.string().optional(),
  url_origem: z.string().optional(),
  viewport: z.string().optional(),
  user_agent: z.string().optional(),
  build_ref: z.string().optional(),
});

export async function POST(request: Request) {
  const sessao = await obterSessaoNaRequest(request);
  if (!sessao) {
    return NextResponse.json({ erro: "Sessao invalida." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo da requisicao invalido." }, { status: 400 });
  }

  const validacao = esquemaFeedback.safeParse(body);
  if (!validacao.success) {
    return NextResponse.json({ erro: "Dados invalidos." }, { status: 400 });
  }

  const {
    tipo,
    titulo,
    descricao,
    impacto,
    rota_origem,
    modulo_origem,
    url_origem,
    viewport,
    user_agent,
    build_ref,
  } = validacao.data;
  const id = crypto.randomUUID();

  const [feedback] = await prisma.$transaction(async (tx) => {
    const criado = await tx.feedbackItem.create({
      data: {
        id,
        id_empresa: sessao.id_empresa,
        id_usuario: sessao.id_usuario,
        perfil_usuario: sessao.perfil,
        tipo,
        titulo,
        descricao,
        impacto: impacto ?? null,
        status: "NOVO",
        prioridade: "MEDIA",
        rota_origem: rota_origem ?? null,
        modulo_origem: modulo_origem ?? null,
        url_origem: url_origem ?? null,
        viewport: viewport ?? null,
        user_agent: user_agent ?? null,
        build_ref: build_ref ?? null,
      },
    });

    await tx.feedbackEvento.create({
      data: {
        id: crypto.randomUUID(),
        id_feedback: id,
        acao: "CRIADO",
        autor_id: sessao.id_usuario,
        autor_tipo: sessao.perfil,
        de_status: null,
        para_status: "NOVO",
        meta_json: JSON.stringify({ tipo }),
      },
    });

    return [criado];
  });

  return NextResponse.json({ ok: true, id: feedback.id });
}
