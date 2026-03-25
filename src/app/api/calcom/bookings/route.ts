import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { listarBookingsPorEmpresa } from "@/lib/calcom/dashboard";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "upcoming";
  const afterStart = searchParams.get("afterStart") ?? new Date().toISOString();
  const requestedLimit = parseInt(searchParams.get("limit") || "20", 10);
  const limit = Math.max(1, Math.min(requestedLimit, 100));

  const { bookings, total } = await listarBookingsPorEmpresa(auth.sessao.id_empresa, {
    status,
    afterStart,
    limit,
  });

  return NextResponse.json({ bookings, total });
}
