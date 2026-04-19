import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { exigirSessao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { mensagemErroValidacao, esquemaChatUnificadoScheduleMessage } from "@/lib/validacoes";
import { inferirTipoMidiaArquivo } from "@/lib/chat-media";

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
    const contentType = request.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await request.json().catch(() => null) : await request.formData().catch(() => null);

    if (!payload) {
      return NextResponse.json({ erro: "Dados de agendamento invalidos." }, { status: 400 });
    }

    let instanceName = "";
    let remoteJid = "";
    let agendadoPara = "";
    let idLead: string | undefined;
    let text = "";
    let arquivo: File | null = null;

    if (!isJson && payload && typeof (payload as FormData).get === "function") {
      const formData = payload as FormData;
      instanceName = String(formData.get("instanceName") ?? "");
      remoteJid = String(formData.get("remoteJid") ?? "");
      agendadoPara = String(formData.get("agendadoPara") ?? "");
      idLead = String(formData.get("idLead") ?? "").trim() || undefined;
      text = String(formData.get("text") ?? "").trim();
      const arquivoRecebido = formData.get("arquivo");
      arquivo = arquivoRecebido && typeof arquivoRecebido === "object" && "arrayBuffer" in arquivoRecebido ? (arquivoRecebido as File) : null;
    } else if (isJson && payload && typeof payload === "object") {
      const dados = payload as Record<string, unknown>;
      instanceName = String(dados.instanceName ?? "");
      remoteJid = String(dados.remoteJid ?? "");
      agendadoPara = String(dados.agendadoPara ?? "");
      idLead = String(dados.idLead ?? "").trim() || undefined;
      text = String(dados.text ?? "").trim();
    }

    if (!instanceName || !remoteJid || !agendadoPara) {
      return NextResponse.json({ erro: "Dados de agendamento invalidos." }, { status: 400 });
    }

    const agendadoParaDate = new Date(agendadoPara);
    if (Number.isNaN(agendadoParaDate.getTime())) {
      return NextResponse.json({ erro: "Data/hora invalida." }, { status: 400 });
    }

    const temArquivo = !!arquivo;
    const arquivoMidia = arquivo ?? undefined;
    const mediaType = arquivoMidia ? inferirTipoMidiaArquivo(arquivoMidia) : null;

    if (!temArquivo && !text) {
      return NextResponse.json({ erro: "Mensagem obrigatoria." }, { status: 400 });
    }

    if (temArquivo && !text && contentType.includes("application/json")) {
      return NextResponse.json({ erro: "Caption obrigatoria para agendar midia via JSON." }, { status: 400 });
    }

    const instanciaPermitida = await verificarInstanciaPertenceEmpresa(auth.sessao.id_empresa, instanceName);
    if (!instanciaPermitida) {
      return NextResponse.json({ erro: "Instancia nao encontrada nesta empresa." }, { status: 403 });
    }

    if (temArquivo && instanceName === "instagram") {
      return NextResponse.json({ erro: "Midia agendada indisponivel para Instagram." }, { status: 400 });
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
        tipo: mediaType ?? "text",
        midia_nome_arquivo: arquivoMidia ? arquivoMidia.name : null,
        midia_mimetype: arquivoMidia ? arquivoMidia.type || (mediaType === "sticker" ? "image/webp" : mediaType === "image" ? "image/jpeg" : "application/octet-stream") : null,
        midia_base64: arquivoMidia ? Buffer.from(await arquivoMidia.arrayBuffer()).toString("base64") : null,
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
