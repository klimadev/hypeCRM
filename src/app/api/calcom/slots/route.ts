import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { listarSlotsPorEmpresa } from "@/lib/calcom/dashboard";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const searchParams = request.nextUrl.searchParams;
  const eventSlug = searchParams.get("eventSlug");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const timeZone = searchParams.get("timeZone") || "America/Sao_Paulo";

  if (!eventSlug || !startTime || !endTime) {
    return NextResponse.json({ erro: "Parâmetros obrigatórios: eventSlug, startTime, endTime." }, { status: 400 });
  }

  const slots = await listarSlotsPorEmpresa(auth.sessao.id_empresa, {
    eventTypeSlug: eventSlug,
    startTime,
    endTime,
    timeZone,
  });

  return NextResponse.json({ slots });
}
