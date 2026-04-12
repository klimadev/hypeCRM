import { NextRequest, NextResponse } from "next/server";
import { processarFollowUpsPendentes } from "@/lib/chat/follow-up";

function autorizado(request: NextRequest) {
  const token = process.env.INTERNAL_AUTOMATION_TOKEN;
  if (!token) return false;
  return request.headers.get("x-internal-token") === token;
}

export async function POST(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ erro: "Nao autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const limite = typeof body?.limite === "number" && body.limite > 0 ? Math.min(body.limite, 300) : 100;

  const resultado = await processarFollowUpsPendentes(limite);
  return NextResponse.json({ ok: true, ...resultado, limite });
}
