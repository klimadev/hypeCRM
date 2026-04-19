import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { mensagemErroValidacao, esquemaChatUnificadoScheduledList } from "@/lib/validacoes";

async function verificarInstanciaPertenceEmpresa(idEmpresa: string, instanceName: string): Promise<boolean> {
  const instancia = await prisma.whatsappInstancia.findFirst({
    where: { instance_name: instanceName, id_empresa: idEmpresa },
    select: { id: true },
  });
  return !!instancia;
}

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const { searchParams } = new URL(request.url);
  const validacao = esquemaChatUnificadoScheduledList.safeParse({
    instanceName: searchParams.get("instanceName") ?? undefined,
    remoteJid: searchParams.get("remoteJid") ?? undefined,
  });

  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const { instanceName, remoteJid } = validacao.data;

  const instanciaPermitida = await verificarInstanciaPertenceEmpresa(auth.sessao.id_empresa, instanceName);
  if (!instanciaPermitida) {
    return NextResponse.json({ erro: "Instancia nao encontrada nesta empresa." }, { status: 403 });
  }

  const agendadas = await prisma.mensagemAgendada.findMany({
    where: {
      instance_name: instanceName,
      remote_jid: remoteJid,
      status: { in: ["PENDENTE", "FALHA"] },
    },
    orderBy: { agendado_para: "asc" },
    select: {
      id: true,
      conteudo: true,
      tipo: true,
      midia_nome_arquivo: true,
      midia_mimetype: true,
      agendado_para: true,
      status: true,
      erro: true,
      tentativas: true,
      criado_em: true,
    },
  });

  return NextResponse.json({
    agendadas: agendadas.map((item) => ({
      id: item.id,
      conteudo: item.conteudo,
      tipo: item.tipo,
      midiaNomeArquivo: item.midia_nome_arquivo,
      midiaMimetype: item.midia_mimetype,
      agendadoPara: item.agendado_para.toISOString(),
      status: item.status,
      erro: item.erro,
      tentativas: item.tentativas,
      criadoEm: item.criado_em.toISOString(),
    })),
  });
}

export async function DELETE(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const body = await request.json().catch(() => null);
  const { id } = body ?? {};

  if (!id || typeof id !== "string") {
    return NextResponse.json({ erro: "ID da mensagem agendada e obrigatorio." }, { status: 400 });
  }

  const existente = await prisma.mensagemAgendada.findUnique({
    where: { id },
    select: { id_empresa: true, status: true },
  });

  if (!existente) {
    return NextResponse.json({ erro: "Mensagem agendada nao encontrada." }, { status: 404 });
  }

  if (existente.id_empresa !== auth.sessao.id_empresa) {
    return NextResponse.json({ erro: "Sem permissao para cancelar esta mensagem." }, { status: 403 });
  }

  if (existente.status === "ENVIADO") {
    return NextResponse.json({ erro: "Nao e possivel cancelar uma mensagem ja enviada." }, { status: 400 });
  }

  await prisma.mensagemAgendada.update({
    where: { id },
    data: { status: "CANCELADO" },
  });

  return NextResponse.json({ ok: true });
}
