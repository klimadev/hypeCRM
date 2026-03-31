import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { STATUS_AGENDAMENTO } from "@/lib/validacoes";
import { prisma } from "@/lib/prisma";
import { automacaoCorrespondeAoEstagio, parseConfigAutomacao } from "./config";

const jobComRelacoesArgs = Prisma.validator<Prisma.AutomacaoAgendamentoDefaultArgs>()({
  include: {
    Automacao: {
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
    },
    Lead: true,
    Negocio: true,
  },
});

const jobResumoArgs = Prisma.validator<Prisma.AutomacaoAgendamentoDefaultArgs>()({
  include: {
    Automacao: {
      select: {
        id: true,
        id_empresa: true,
        gatilho: true,
        config_json: true,
      },
    },
  },
});

export type JobComRelacoes = Prisma.AutomacaoAgendamentoGetPayload<typeof jobComRelacoesArgs>;

type JobAutomacaoResumo = Prisma.AutomacaoAgendamentoGetPayload<typeof jobResumoArgs>;

interface CriarAgendamentoParams {
  idAutomacao: string;
  idLead?: string;
  idNegocio?: string;
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
    idNegocio,
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
    id: randomUUID(),
    id_automacao: idAutomacao,
    id_lead: idLead ?? null,
    id_negocio: idNegocio ?? null,
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
  const job = await prisma.automacaoAgendamento.findUnique({
    where: { id },
    include: jobComRelacoesArgs.include,
  });

  return job;
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
  idLead?: string;
  idNegocio?: string;
  idEstagioAtual: string;
  motivo: string;
}): Promise<number> {
  const jobs: JobAutomacaoResumo[] = await prisma.automacaoAgendamento.findMany({
    where: {
      ...(params.idLead ? { id_lead: params.idLead } : {}),
      ...(params.idNegocio ? { id_negocio: params.idNegocio } : {}),
      status: {
        in: [STATUS_AGENDAMENTO.PENDENTE, STATUS_AGENDAMENTO.PROCESSANDO],
      },
    },
    include: jobResumoArgs.include,
  });

  const idsParaCancelar = jobs
    .filter((job) => job.Automacao.id_empresa === params.idEmpresa)
    .filter((job) => job.Automacao.gatilho === "STAGE_CHANGE")
    .filter((job) => {
      const config = parseConfigAutomacao(job.Automacao.config_json);
      return Boolean(config.id_estagio_destino) && !automacaoCorrespondeAoEstagio(job.Automacao.config_json, params.idEstagioAtual);
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
