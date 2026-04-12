import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { detalharCampanhaDisparoLeads } from "@/lib/leads-disparos";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const { id } = await params;
  const detalhe = await detalharCampanhaDisparoLeads({
    idEmpresa: auth.sessao.id_empresa,
    campanhaId: id,
  });

  if (!detalhe) {
    return NextResponse.json({ erro: "Campanha nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({ campanha: detalhe });
}
