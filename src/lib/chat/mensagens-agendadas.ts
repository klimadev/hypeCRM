import { prisma } from "@/lib/prisma";
import { enviarMensagemTexto } from "@/lib/evolution-api.instances";
import { enviarMensagemInstagram } from "@/lib/integracoes/instagram-inbox";
import { ErroInstagramApi } from "@/lib/integracoes/instagram-client";

function ehInstagram(instanceName: string): boolean {
  return instanceName === "instagram";
}

export async function processarMensagensAgendadas(limite = 20) {
  const agora = new Date();

  const candidatas = await prisma.mensagemAgendada.findMany({
    where: {
      status: "PENDENTE",
      agendado_para: { lte: agora },
    },
    orderBy: { agendado_para: "asc" },
    take: limite,
  });

  const resultado = { processadas: 0, enviadas: 0, falhas: 0, ignoradas: 0 };

  for (const agendada of candidatas) {
    const claim = await prisma.mensagemAgendada.updateMany({
      where: { id: agendada.id, status: "PENDENTE" },
      data: { status: "PROCESSANDO" },
    });

    if (claim.count === 0) {
      resultado.ignoradas += 1;
      continue;
    }

    try {
      if (ehInstagram(agendada.instance_name)) {
        const company = await prisma.empresa.findUnique({ where: { id: agendada.id_empresa }, select: { id: true } });
        if (!company) throw new Error("Empresa nao encontrada para envio agendado.");
        await enviarMensagemInstagram(company.id, agendada.remote_jid, agendada.conteudo);
      } else {
        const telefone = agendada.remote_jid.replace(/@.*/, "").replace(/\D/g, "");
        await enviarMensagemTexto({
          instanceName: agendada.instance_name,
          telefone,
          mensagem: agendada.conteudo,
        });
      }

      await prisma.mensagemAgendada.update({
        where: { id: agendada.id },
        data: {
          status: "ENVIADO",
          enviado_em: new Date(),
          erro: null,
        },
      });

      resultado.enviadas += 1;
    } catch (error) {
      const erroTexto =
        error instanceof ErroInstagramApi ? error.message : error instanceof Error ? error.message : "Erro ao enviar mensagem agendada.";

      await prisma.mensagemAgendada.update({
        where: { id: agendada.id },
        data: {
          status: "FALHA",
          erro: erroTexto,
          tentativas: { increment: 1 },
        },
      });

      resultado.falhas += 1;
    }

    resultado.processadas += 1;
  }

  return resultado;
}
