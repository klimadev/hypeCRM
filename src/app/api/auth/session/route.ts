import { NextRequest, NextResponse } from "next/server";
import { obterDadosUsuarioLogado, obterSessaoNaRequest } from "@/lib/autenticacao";
import { verificarUsuarioExiste } from "@/lib/permissoes";

export async function GET(request: NextRequest) {
  const sessao = await obterSessaoNaRequest(request);

  if (!sessao) {
    return NextResponse.json(null, { status: 401 });
  }

  const usuarioValido = await verificarUsuarioExiste(sessao);
  if (!usuarioValido) {
    return NextResponse.json(null, { status: 401 });
  }

  const dadosUsuario = await obterDadosUsuarioLogado(sessao);
  if (!dadosUsuario) {
    return NextResponse.json(null, { status: 401 });
  }

  return NextResponse.json({
    id_usuario: sessao.id_usuario,
    id_empresa: sessao.id_empresa,
    id_pdv: sessao.id_pdv,
    nome: dadosUsuario.nome,
    email: dadosUsuario.email,
    perfil: sessao.perfil,
  });
}
