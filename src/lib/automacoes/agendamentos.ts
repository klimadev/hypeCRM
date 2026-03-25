import { type Automacao, type AutomacaoAcao, type AutomacaoAgendamento, type Lead, type WhatsappInstancia } from "@prisma/client";
import { STATUS_AGENDAMENTO } from "@/lib/validacoes";
import { prisma } from "@/lib/prisma";
import { automacaoCorrespondeAoEstagio, parseConfigAutomacao } from "./config";

type AutomacaoAcaoComInstancia = AutomacaoAcao & {
  instancia_whatsapp: Pick<WhatsappInstancia, "id" | "instance_name"> | null;
};

type AutomacaoComAcoes = Automacao & {
  acoes: AutomacaoAcaoComInstancia[];
};

export type JobComRelacoes = AutomacaoAgendamento & {
  automacao: AutomacaoComAcoes;
  lead: Lead | null;
};

interface CriarAgendamentoParams {
  idAutomacao: string;
  idLead: string;
  referenciaUid: string;
  tipoOrigem: "WHATSAPP";
  contextoJson: Record<string, unknown>;
  delayMinutos?: number;
  agendadoPara?: Date;
}

export interface PrepararAgendamentoResult {
  agendamentoId: string;
  acao: "criado" | "atualizado" | "ja_enviado" | "processando";
}

export async function prepararAgendamento(
  params: CriarAgendamentoParams,
): Promise<PrepararAgendamentoResult> {
  const {
    idAutomacao,
    idLead,
    referenciaUid,
    tipoOrigem,
    contextoJson,
    delayMinutos = 0,
    agendadoPara,
  } = params;

  const existente = await prisma.automacaoAgendamento.findUnique({
    where: { referencia_uid: referenciaUid },
    select: {
      id: true,
      status: true,
    },
  });

  if (existente?.status === STATUS_AGENDAMENTO.ENVIADO) {
    return {
      agendamentoId: existente.id,
      acao: "ja_enviado",
    };
  }

  if (existente?.status === STATUS_AGENDAMENTO.PROCESSANDO) {
    return {
      agendamentoId: existente.id,
      acao: "processando",
    };
  }

  const agendamentoData = {
    id_automacao: idAutomacao,
    id_lead: idLead,
    referencia_uid: referenciaUid,
    tipo_origem: tipoOrigem,
    contexto_json: JSON.stringify(contextoJson),
    agendado_para: agendadoPara || new Date(Date.now() + delayMinutos * 60000),
    status: STATUS_AGENDAMENTO.PENDENTE,
  };

  if (!existente) {
    const criado = await prisma.automacaoAgendamento.create({
      data: agendamentoData,
      select: { id: true },
    });

    return {
      agendamentoId: criado.id,
      acao: "criado",
    };
  }

  const atualizado = await prisma.automacaoAgendamento.update({
    where: { id: existente.id },
    data: {
      contexto_json: agendamentoData.contexto_json,
      agendado_para: agendamentoData.agendado_para,
      status: STATUS_AGENDAMENTO.PENDENTE,
      erro: null,
      enviado_em: null,
      tentativas: 0,
    },
    select: { id: true },
  });

  return {
    agendamentoId: atualizado.id,
    acao: "atualizado",
  };
}

interface AtualizarAgendamentoParams {
  contexto_json?: string;
  agendado_para?: Date;
  status?: string;
  erro?: string;
}

export async function atualizarAgendamento(
  id: string,
  data: AtualizarAgendamentoParams
): Promise<void> {
  await prisma.automacaoAgendamento.update({
    where: { id },
    data,
  });
}

export async function buscarJobComRelacoes(id: string): Promise<JobComRelacoes | null> {
  return prisma.automacaoAgendamento.findUnique({
    where: { id },
    include: {
      automacao: {
        include: {
          acoes: {
            orderBy: { ordem: "asc" },
            include: {
              instancia_whatsapp: {
                select: {
                  id: true,
                  instance_name: true,
                },
              },
            },
          },
        },
      },
      lead: true,
    },
  });
}

export async function cancelarAgendamentosDaAutomacao(
  automacaoId: string,
  motivo: string,
): Promise<number> {
  const resultado = await prisma.automacaoAgendamento.updateMany({
    where: {
      id_automacao: automacaoId,
      status: {
        in: [STATUS_AGENDAMENTO.PENDENTE, STATUS_AGENDAMENTO.PROCESSANDO],
      },
    },
    data: {
      status: STATUS_AGENDAMENTO.CANCELADO,
      erro: motivo,
    },
  });

  return resultado.count;
}

export async function cancelarAgendamentosIncompativeisDoLead(params: {
  idEmpresa: string;
  idLead: string;
  idEstagioAtual: string;
  motivo: string;
}): Promise<number> {
  const jobs = await prisma.automacaoAgendamento.findMany({
    where: {
      id_lead: params.idLead,
      status: {
        in: [STATUS_AGENDAMENTO.PENDENTE, STATUS_AGENDAMENTO.PROCESSANDO],
      },
    },
    include: {
      automacao: {
        select: {
          id: true,
          id_empresa: true,
          gatilho: true,
          config_json: true,
        },
      },
    },
  });

  const idsParaCancelar = jobs
    .filter((job) => job.automacao.id_empresa === params.idEmpresa)
    .filter((job) => job.automacao.gatilho === "STAGE_CHANGE")
    .filter((job) => {
      const config = parseConfigAutomacao(job.automacao.config_json);
      return Boolean(config.id_estagio_destino) && !automacaoCorrespondeAoEstagio(job.automacao.config_json, params.idEstagioAtual);
    })
    .map((job) => job.id);

  if (idsParaCancelar.length === 0) {
    return 0;
  }

  const resultado = await prisma.automacaoAgendamento.updateMany({
    where: {
      id: { in: idsParaCancelar },
    },
    data: {
      status: STATUS_AGENDAMENTO.CANCELADO,
      erro: params.motivo,
    },
  });

  return resultado.count;
}
