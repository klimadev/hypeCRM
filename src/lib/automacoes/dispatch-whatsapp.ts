import { prisma } from "@/lib/prisma";
import { STATUS_AGENDAMENTO } from "@/lib/validacoes";
import { enviarMensagemTexto } from "@/lib/evolution-api";
import type { JobComRelacoes } from "./agendamentos";

type ContextoJob = {
  lead?: {
    id?: string;
    nome?: string | null;
    telefone?: string | null;
    email?: string | null;
  };
  estagio?: {
    anterior?: string | null;
    anterior_nome?: string | null;
    atual?: string | null;
    atual_nome?: string | null;
    nome_atual?: string | null;
  };
  empresa?: {
    nome?: string | null;
  };
  evento?: {
    titulo?: string | null;
    data?: string | null;
    hora?: string | null;
    link?: string | null;
  };
  acao?: {
    id?: string;
  };
};

interface JobResult {
  status: "ENVIADO" | "FALHA" | "RETRY" | "CANCELADO";
}

export async function processarJob(job: JobComRelacoes): Promise<JobResult> {
  if (!job.Automacao.ativo) {
    await prisma.automacaoAgendamento.update({
      where: { id: job.id },
      data: {
        status: STATUS_AGENDAMENTO.CANCELADO,
        erro: "AUTOMACAO_INATIVA",
      },
    });

    return { status: "CANCELADO" };
  }

  const lock = await prisma.automacaoAgendamento.updateMany({
    where: { id: job.id, status: STATUS_AGENDAMENTO.PENDENTE },
    data: { status: STATUS_AGENDAMENTO.PROCESSANDO },
  });

  if (lock.count === 0) {
    return { status: "RETRY" };
  }

  try {
    const contexto = lerContexto(job.contexto_json);
    const acoes = resolverAcoesDoJob(job, contexto);

    if (acoes.length === 0) {
      await marcarFalha(job.id, "ACAO_NAO_ENCONTRADA");
      return { status: "FALHA" };
    }

    for (const acao of acoes) {
      const mensagem = renderizarTemplate(acao.mensagem, contexto, job.Lead);
      const telefone = await resolverTelefoneDestino(acao, job, contexto);

      if (!telefone) {
        await marcarFalha(job.id, "SEM_TELEFONE");
        return { status: "FALHA" };
      }

      if (!acao.WhatsappInstancia?.instance_name) {
        await marcarFalha(job.id, "SEM_INSTANCIA_WHATSAPP");
        return { status: "FALHA" };
      }

        await enviarMensagemTexto({
          instanceName: acao.WhatsappInstancia.instance_name,
          telefone,
          mensagem,
        });
    }

    await prisma.automacaoAgendamento.update({
      where: { id: job.id },
      data: {
        status: STATUS_AGENDAMENTO.ENVIADO,
        enviado_em: new Date(),
      },
    });

    return { status: "ENVIADO" };
  } catch (error) {
    const err = error as Error;
    const tentativas = job.tentativas + 1;

    if (tentativas < 3) {
      const delayMs = tentativas * 5 * 60 * 1000;

      await prisma.automacaoAgendamento.update({
        where: { id: job.id },
        data: {
          status: STATUS_AGENDAMENTO.PENDENTE,
          tentativas,
          erro: err.message,
          agendado_para: new Date(Date.now() + delayMs),
        },
      });

      return { status: "RETRY" };
    }

    await prisma.automacaoAgendamento.update({
      where: { id: job.id },
      data: {
        status: STATUS_AGENDAMENTO.FALHA,
        erro: err.message,
      },
    });

    return { status: "FALHA" };
  }
}

async function marcarFalha(jobId: string, erro: string): Promise<void> {
  await prisma.automacaoAgendamento.update({
    where: { id: jobId },
    data: {
      status: STATUS_AGENDAMENTO.FALHA,
      erro,
    },
  });
}

function lerContexto(contextoJson: string): ContextoJob {
  try {
    return JSON.parse(contextoJson) as ContextoJob;
  } catch {
    return {};
  }
}

function resolverAcoesDoJob(job: JobComRelacoes, contexto: ContextoJob) {
  const acaoId = contexto.acao?.id;

  if (!acaoId) {
    return job.Automacao.AutomacaoAcao;
  }

  return job.Automacao.AutomacaoAcao.filter((acao) => acao.id === acaoId);
}

async function resolverTelefoneDestino(
  acao: JobComRelacoes["Automacao"]["AutomacaoAcao"][number],
  job: JobComRelacoes,
  contexto: ContextoJob,
): Promise<string | null> {
  if (acao.telefone_destino) {
    return acao.telefone_destino;
  }

  if (acao.id_lead_destino) {
    const leadDestino = await prisma.lead.findUnique({
      where: { id: acao.id_lead_destino },
      select: { telefone: true },
    });

    return leadDestino?.telefone ?? null;
  }

  return contexto.lead?.telefone ?? job.Lead?.telefone ?? null;
}

function renderizarTemplate(
  template: string,
  contexto: ContextoJob,
  lead: JobComRelacoes["Lead"]
): string {
  let resultado = template;

  const contextoLead = contexto.lead ?? {};
  const contextoEstagio = contexto.estagio ?? {};
  const contextoEmpresa = contexto.empresa ?? {};
  const contextoEvento = contexto.evento ?? {};

  resultado = resultado.replace(/\{\{lead_nome\}\}/gi, String(contextoLead.nome || lead?.nome || ""));
  resultado = resultado.replace(/\{\{lead_telefone\}\}/gi, String(contextoLead.telefone || lead?.telefone || ""));
  resultado = resultado.replace(/\{\{lead_email\}\}/gi, String(contextoLead.email || ""));
  resultado = resultado.replace(/\{\{lead_id\}\}/gi, String(contextoLead.id || lead?.id || ""));

  resultado = resultado.replace(
    /\{\{estagio_anterior\}\}/gi,
    String(contextoEstagio.anterior_nome || contextoEstagio.anterior || ""),
  );
  resultado = resultado.replace(
    /\{\{estagio_atual\}\}/gi,
    String(contextoEstagio.atual_nome || contextoEstagio.nome_atual || contextoEstagio.atual || ""),
  );

  resultado = resultado.replace(/\{\{empresa_nome\}\}/gi, String(contextoEmpresa.nome || ""));

  resultado = resultado.replace(/\{\{evento_titulo\}\}/gi, String(contextoEvento.titulo || ""));
  resultado = resultado.replace(/\{\{evento_data\}\}/gi, formatarData(String(contextoEvento.data || "")));
  resultado = resultado.replace(/\{\{evento_hora\}\}/gi, formatarHora(String(contextoEvento.data || contextoEvento.hora || "")));
  resultado = resultado.replace(/\{\{evento_link\}\}/gi, String(contextoEvento.link || ""));

  return resultado;
}

function formatarData(dataStr: string): string {
  if (!dataStr) return "";
  try {
    const data = new Date(dataStr);
    return data.toLocaleDateString("pt-BR");
  } catch {
    return dataStr;
  }
}

function formatarHora(dataStr: string): string {
  if (!dataStr) return "";
  try {
    const data = new Date(dataStr);
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
