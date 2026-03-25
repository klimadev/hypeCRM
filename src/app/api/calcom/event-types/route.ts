import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { listarEventTypesPorEmpresa } from "@/lib/calcom/dashboard";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const eventTypes = await listarEventTypesPorEmpresa(auth.sessao.id_empresa);

  return NextResponse.json({ eventTypes });
}
