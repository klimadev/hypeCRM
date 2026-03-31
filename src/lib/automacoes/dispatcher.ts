import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { STATUS_AGENDAMENTO } from "@/lib/validacoes";
import { processarJob } from "./dispatch-whatsapp";
import { automacaoArquivada } from "./config";
import type { JobComRelacoes } from "./agendamentos";

const jobPendenteArgs = Prisma.validator<Prisma.AutomacaoAgendamentoDefaultArgs>()({
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

export interface DispatchStats {
  sync_whatsapp: { automacoes_processadas: number; jobs_criados: number; jobs_cancelados: number };
  processados: { total: number; enviados: number; falhas: number; em_retry: number };
  duracao_ms: number;
}

export async function processarDispatch(
  options: {
    only?: "whatsapp";
    id_empresa: string;
    automacao_id?: string;
    teste?: boolean;
    lead_id?: string;
  }
): Promise<DispatchStats> {
  const inicio = Date.now();
  const stats: DispatchStats = {
    sync_whatsapp: { automacoes_processadas: 0, jobs_criados: 0, jobs_cancelados: 0 },
    processados: { total: 0, enviados: 0, falhas: 0, em_retry: 0 },
    duracao_ms: 0,
  };

  await recuperarJobsStale(options.id_empresa, options.automacao_id);

  const jobsPendentes = await buscarJobsPendentes(options.id_empresa, options.automacao_id);
  const jobsElegiveis = jobsPendentes.filter((job) => !automacaoArquivada(job.Automacao.config_json));
  stats.processados.total = jobsElegiveis.length;

  for (const job of jobsElegiveis) {
    const resultado = await processarJob(job);
    if (resultado.status === "ENVIADO") stats.processados.enviados++;
    else if (resultado.status === "FALHA") stats.processados.falhas++;
    else if (resultado.status === "RETRY") stats.processados.em_retry++;
  }

  stats.duracao_ms = Date.now() - inicio;
  return stats;
}

async function recuperarJobsStale(idEmpresa: string, automacaoId?: string): Promise<void> {
  const staleTimeout = new Date(Date.now() - 15 * 60 * 1000);

  const whereStale: Prisma.AutomacaoAgendamentoWhereInput = {
    status: STATUS_AGENDAMENTO.PROCESSANDO,
    atualizado_em: { lt: staleTimeout },
    Automacao: {
      is: {
        id_empresa: idEmpresa,
        ativo: true,
        ...(automacaoId ? { id: automacaoId } : {}),
      },
    },
  };

  await prisma.automacaoAgendamento.updateMany({
    where: whereStale,
    data: { status: STATUS_AGENDAMENTO.PENDENTE },
  });
}

async function buscarJobsPendentes(idEmpresa: string, automacaoId?: string) {
  const wherePendentes: Prisma.AutomacaoAgendamentoWhereInput = {
    status: STATUS_AGENDAMENTO.PENDENTE,
    agendado_para: { lte: new Date() },
    Automacao: {
      is: {
        id_empresa: idEmpresa,
        ativo: true,
        ...(automacaoId ? { id: automacaoId } : {}),
      },
    },
  };

  const jobs = await prisma.automacaoAgendamento.findMany({
    where: wherePendentes,
    include: jobPendenteArgs.include,
    take: 100,
    orderBy: { agendado_para: "asc" },
  });

  return jobs as JobComRelacoes[];
}
