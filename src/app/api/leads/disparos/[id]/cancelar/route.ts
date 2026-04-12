import { NextRequest, NextResponse } from "next/server";
import { cancelarCampanhaDisparoLeads } from "@/lib/leads-disparos";
import { exigirSessao, podeExecutarAcoesEmLote } from "@/lib/permissoes";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (!podeExecutarAcoesEmLote(auth.sessao)) {
    return NextResponse.json({ erro: "Sem permissao para cancelar campanha." }, { status: 403 });
  }

  const { id } = await params;
  const resultado = await cancelarCampanhaDisparoLeads({
    idEmpresa: auth.sessao.id_empresa,
    campanhaId: id,
  });

  if (!resultado) {
    return NextResponse.json({ erro: "Campanha nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, cancelados: resultado.cancelados });
}
