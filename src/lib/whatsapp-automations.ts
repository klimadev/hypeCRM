import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { buscarJobComRelacoes, cancelarAgendamentosDaAutomacao, cancelarAgendamentosIncompativeisDoLead, prepararAgendamento } from "@/lib/automacoes/agendamentos";
import { automacaoCorrespondeAoEstagio } from "@/lib/automacoes/config";
import { processarJob } from "@/lib/automacoes/dispatch-whatsapp";

export type EventoLeadStageChanged = {
  idEmpresa: string;
  leadEstagioLogId: string;
  lead: {
    id: string;
    nome: string;
    telefone: string;
    email?: string | null;
  };
  estagioAnterior: {
    id: string | null;
    nome: string | null;
  };
  estagioAtual: {
    id: string;
    nome: string;
  };
  empresa: {
    nome: string | null;
  };
  disparadoEm?: Date;
  negocio?: {
    id: string;
    titulo?: string | null;
  };
};

export type ResultadoAutomacoesLeadStageChanged = {
  automacoesCorrespondentes: number;
  jobsCriados: number;
  jobsAtualizados: number;
  jobsCancelados: number;
  jobsProcessados: number;
  jobsIgnorados: number;
};

export async function executarAutomacoesLeadStageChanged(
  evento: EventoLeadStageChanged,
): Promise<ResultadoAutomacoesLeadStageChanged> {
  const resultado: ResultadoAutomacoesLeadStageChanged = {
    automacoesCorrespondentes: 0,
    jobsCriados: 0,
    jobsAtualizados: 0,
    jobsCancelados: 0,
    jobsProcessados: 0,
    jobsIgnorados: 0,
  };

  resultado.jobsCancelados = await cancelarAgendamentosPorLead({
    idEmpresa: evento.idEmpresa,
    idLead: evento.lead.id,
    idEstagioAtual: evento.estagioAtual.id,
    motivo: "Lead saiu do estagio alvo da automacao.",
  });

  const automacoes = await prisma.automacao.findMany({
    where: {
      id_empresa: evento.idEmpresa,
      ativo: true,
      fonte: "WHATSAPP",
      gatilho: "STAGE_CHANGE",
    },
    include: {
      AutomacaoAcao: {
        orderBy: { ordem: "asc" },
        include: {
          WhatsappInstancia: {
            select: {
              id: true,
              instance_name: true,
            },
          },
        },
      },
    },
  });

  const automacoesCorrespondentes = automacoes.filter((automacao) =>
    automacaoCorrespondeAoEstagio(automacao.config_json, evento.estagioAtual.id),
  );

  resultado.automacoesCorrespondentes = automacoesCorrespondentes.length;

  for (const automacao of automacoesCorrespondentes) {
    const acoesAutomacao = (
      (automacao as { AutomacaoAcao?: Array<{ id: string; ordem: number; tipo: string; delay_minutos: number }> }).AutomacaoAcao ??
      (automacao as { acoes?: Array<{ id: string; ordem: number; tipo: string; delay_minutos: number }> }).acoes ??
      []
    );

    for (const acao of acoesAutomacao) {
      const referenciaUid = gerarReferenciaEventoAcao(
        evento.leadEstagioLogId,
        automacao.id,
        acao.id,
      );

      const preparo = await prepararAgendamento({
        idAutomacao: automacao.id,
        idLead: evento.lead.id,
        idNegocio: evento.negocio?.id,
        referenciaUid,
        tipoOrigem: "WHATSAPP",
        contextoJson: construirContextoEvento(evento, automacao.id, automacao.nome, acao.id, acao.ordem, acao.tipo),
        delayMinutos: acao.delay_minutos,
      });

      if (preparo.acao === "criado") {
        resultado.jobsCriados++;
      } else if (preparo.acao === "atualizado") {
        resultado.jobsAtualizados++;
      } else {
        resultado.jobsIgnorados++;
      }

      if (
        acao.delay_minutos > 0 ||
        preparo.acao === "ja_enviado" ||
        preparo.acao === "processando"
      ) {
        continue;
      }

      const job = await buscarJobComRelacoes(preparo.agendamentoId);
      if (!job) {
        resultado.jobsIgnorados++;
        continue;
      }

      await processarJob(job);
      resultado.jobsProcessados++;
    }
  }

  return resultado;
}

export async function cancelarAgendamentosPorLead(params: {
  idEmpresa: string;
  idLead: string;
  idNegocio?: string;
  idEstagioAtual: string;
  motivo?: string;
}): Promise<number> {
  return cancelarAgendamentosIncompativeisDoLead({
    idEmpresa: params.idEmpresa,
    idLead: params.idLead,
    idNegocio: params.idNegocio,
    idEstagioAtual: params.idEstagioAtual,
    motivo: params.motivo ?? "Lead saiu do estagio alvo da automacao.",
  });
}

export async function cancelarAgendamentosDaAutomacaoWhatsapp(
  automacaoId: string,
  motivo: string,
): Promise<number> {
  return cancelarAgendamentosDaAutomacao(automacaoId, motivo);
}

export function gerarReferenciaEventoAcao(
  leadEstagioLogId: string,
  automacaoId: string,
  acaoId: string,
): string {
  return createHash("sha256")
    .update(`${leadEstagioLogId}:${automacaoId}:${acaoId}`)
    .digest("hex")
    .substring(0, 32);
}

function construirContextoEvento(
  evento: EventoLeadStageChanged,
  automacaoId: string,
  automacaoNome: string,
  acaoId: string,
  acaoOrdem: number,
  acaoTipo: string,
): Record<string, unknown> {
  const disparadoEm = evento.disparadoEm ?? new Date();

  return {
    lead: {
      id: evento.lead.id,
      nome: evento.lead.nome,
      telefone: evento.lead.telefone,
      email: evento.lead.email ?? null,
    },
    estagio: {
      anterior: evento.estagioAnterior.id,
      anterior_nome: evento.estagioAnterior.nome,
      atual: evento.estagioAtual.id,
      atual_nome: evento.estagioAtual.nome,
    },
    empresa: {
      nome: evento.empresa.nome,
    },
    evento: {
      tipo: "STAGE_CHANGE",
      lead_estagio_log_id: evento.leadEstagioLogId,
      negocio_id: evento.negocio?.id ?? null,
      disparado_em: disparadoEm.toISOString(),
    },
    automacao: {
      id: automacaoId,
      nome: automacaoNome,
    },
    acao: {
      id: acaoId,
      ordem: acaoOrdem,
      tipo: acaoTipo,
    },
  };
}
