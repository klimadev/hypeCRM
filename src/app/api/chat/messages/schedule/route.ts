import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { exigirSessao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { mensagemErroValidacao, esquemaChatUnificadoScheduleMessage } from "@/lib/validacoes";

async function verificarInstanciaPertenceEmpresa(idEmpresa: string, instanceName: string): Promise<boolean> {
  const instancia = await prisma.whatsappInstancia.findFirst({
    where: { instance_name: instanceName, id_empresa: idEmpresa },
    select: { id: true },
  });
  return !!instancia;
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  try {
    const payload = await request.json().catch(() => null);
    const validacao = esquemaChatUnificadoScheduleMessage.safeParse(payload);

    if (!validacao.success) {
      return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
    }

    const { instanceName, remoteJid, text, agendadoPara, idLead } = validacao.data;
    const agendadoParaDate = new Date(agendadoPara);

    const instanciaPermitida = await verificarInstanciaPertenceEmpresa(auth.sessao.id_empresa, instanceName);
    if (!instanciaPermitida) {
      return NextResponse.json({ erro: "Instancia nao encontrada nesta empresa." }, { status: 403 });
    }

    if (agendadoParaDate <= new Date()) {
      return NextResponse.json(
        { erro: "A data de agendamento deve ser futura." },
        { status: 400 },
      );
    }

    const mensagem = await prisma.mensagemAgendada.create({
      data: {
        id: randomUUID(),
        id_empresa: auth.sessao.id_empresa,
        id_lead: idLead ?? null,
        instance_name: instanceName,
        remote_jid: remoteJid,
        conteudo: text,
        tipo: "text",
        agendado_para: agendadoParaDate,
        status: "PENDENTE",
        criado_por: auth.sessao.id_usuario,
      },
    });

    return NextResponse.json({
      ok: true,
      mensagem: {
        id: mensagem.id,
        agendadoPara: mensagem.agendado_para,
        status: mensagem.status,
      },
    });
  } catch (error) {
    console.error("[Chat] Falha ao criar mensagem agendada", {
      erro: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ erro: "Nao foi possivel salvar o agendamento." }, { status: 500 });
  }
}
