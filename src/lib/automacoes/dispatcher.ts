import { prisma } from "@/lib/prisma";
import { STATUS_AGENDAMENTO } from "@/lib/validacoes";
import { processarJob } from "./dispatch-whatsapp";
import { automacaoArquivada } from "./config";

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
  const jobsElegiveis = jobsPendentes.filter((job) => !automacaoArquivada(job.automacao.config_json));
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

  await prisma.automacaoAgendamento.updateMany({
    where: {
      status: STATUS_AGENDAMENTO.PROCESSANDO,
      atualizado_em: { lt: staleTimeout },
      automacao: {
        id_empresa: idEmpresa,
        ativo: true,
        ...(automacaoId ? { id: automacaoId } : {}),
      },
    },
    data: { status: STATUS_AGENDAMENTO.PENDENTE },
  });
}

async function buscarJobsPendentes(idEmpresa: string, automacaoId?: string) {
  return prisma.automacaoAgendamento.findMany({
    where: {
      status: STATUS_AGENDAMENTO.PENDENTE,
      agendado_para: { lte: new Date() },
      automacao: {
        id_empresa: idEmpresa,
        ativo: true,
        ...(automacaoId ? { id: automacaoId } : {}),
      },
    },
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
    take: 100,
    orderBy: { agendado_para: "asc" },
  });
}
