import { prisma } from "@/lib/prisma";
import { enviarMensagemTexto } from "@/lib/evolution-api.instances";
import { enviarMensagemInstagram } from "@/lib/integracoes/instagram-inbox";
import { ErroInstagramApi } from "@/lib/integracoes/instagram-client";
import { agendarProximoFollowUp } from "@/lib/chat/follow-up";
import { normalizarTelefoneParaWhatsapp } from "@/lib/phone";

function ehInstagram(instanceName: string): boolean {
  return instanceName === "instagram";
}

function ehLid(remoteJid: string): boolean {
  return remoteJid.includes("@lid");
}

function extrairTelefoneDeRemoteJid(remoteJid: string): string {
  return remoteJid.replace(/@.*/, "").replace(/\D/g, "");
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
      let telefoneDestino: string;

      if (ehLid(agendada.remote_jid)) {
        const telefoneExtraido = extrairTelefoneDeRemoteJid(agendada.remote_jid);
        const normalizado = normalizarTelefoneParaWhatsapp(telefoneExtraido);
        telefoneDestino = normalizado.waNumber ?? telefoneExtraido;
      } else {
        telefoneDestino = extrairTelefoneDeRemoteJid(agendada.remote_jid);
      }

      if (ehInstagram(agendada.instance_name)) {
        const company = await prisma.empresa.findUnique({ where: { id: agendada.id_empresa }, select: { id: true } });
        if (!company) throw new Error("Empresa nao encontrada para envio agendado.");
        await enviarMensagemInstagram(company.id, agendada.remote_jid, agendada.conteudo);
      } else {
        await enviarMensagemTexto({
          instanceName: agendada.instance_name,
          telefone: telefoneDestino,
          mensagem: agendada.conteudo,
        });
      }

      const enviadoEm = new Date();
      let deveAgendarProximoFollowUp = false;

      await prisma.$transaction(async (tx) => {
        await tx.mensagemAgendada.update({
          where: { id: agendada.id },
          data: {
            status: "ENVIADO",
            enviado_em: enviadoEm,
            erro: null,
          },
        });

        if (!agendada.id_followup_conversa || agendada.followup_etapa === null || agendada.followup_ciclo === null) {
          return;
        }

        const conversaAtualizada = await tx.followUpConversa.updateMany({
          where: {
            id: agendada.id_followup_conversa,
            status: "ATIVO",
            etapa_atual: agendada.followup_etapa,
            ciclo_atual: agendada.followup_ciclo,
          },
          data: {
            ultima_saida_em: enviadoEm,
            atualizado_em: enviadoEm,
          },
        });

        deveAgendarProximoFollowUp = conversaAtualizada.count > 0;
      });

      if (deveAgendarProximoFollowUp && agendada.id_followup_conversa) {
        try {
          await agendarProximoFollowUp(agendada.id_followup_conversa);
        } catch {
          // Nao deve marcar a mensagem como falha quando o envio ja foi concluido.
        }
      }

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
