import { NextRequest, NextResponse } from "next/server";
import { processarMensagensAgendadas } from "@/lib/chat/mensagens-agendadas";

function autorizado(request: NextRequest) {
  const token = request.headers.get("x-internal-token")?.trim();
  const esperado = process.env.INTERNAL_AUTOMATION_TOKEN?.trim();

  if (!esperado) return false;
  return token === esperado;
}

export async function POST(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ erro: "Nao autorizado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { limite?: number };
  const resultado = await processarMensagensAgendadas(
    typeof body.limite === "number" && Number.isFinite(body.limite) ? Math.max(1, Math.min(body.limite, 100)) : 20,
  );

  return NextResponse.json(resultado);
}
