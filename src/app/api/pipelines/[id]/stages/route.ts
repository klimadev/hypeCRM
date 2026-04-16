import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, podeGerenciarEmpresa, respostaSemPermissao } from "@/lib/permissoes";
import { EsquemaCriarEstagio } from "@/lib/validacoes.crm";
import { badRequest, notFound } from "@/lib/api/http";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  if (!podeGerenciarEmpresa(auth.sessao)) {
    return respostaSemPermissao();
  }

  const { id } = await params;
  const { id_empresa } = auth.sessao;

  const pipeline = await prisma.funil.findUnique({
    where: { id },
  });

  if (!pipeline || pipeline.ativo === false) {
    return notFound("Pipeline não encontrado.");
  }

  const body = await request.json();
  const resultado = EsquemaCriarEstagio.safeParse(body);
  
  if (!resultado.success) {
    const primeiroErro = resultado.error.issues[0];
    const mensagem = primeiroErro?.message || "Dados inválidos.";
    return badRequest(mensagem);
  }

  const { nome, tipo, ordem } = resultado.data;

  const maxOrdem = await prisma.estagioFunil.aggregate({
    where: { id_funil: id },
    _max: { ordem: true },
  });

  const novaOrdem = ordem ?? Number((maxOrdem._max?.ordem ?? BigInt(0))) + 1;

  const estagio = await prisma.estagioFunil.create({
    data: {
      id: randomUUID(),
      id_empresa,
      id_funil: id,
      id_criador: auth.sessao.id_usuario,
      nome,
      tipo,
      ordem: BigInt(novaOrdem),
    },
  });

  return NextResponse.json({ estagio });
}