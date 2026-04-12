import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizarRemoteJidParaLead } from "@/lib/whatsapp-chat.resolvers";
import { renderizarTemplateWhatsapp } from "@/lib/whatsapp-template";
import { calcularAgendaPorInstancia, calcularResumoCampanha } from "@/modules/leads/disparo-campanha.utils";

type LeadComContexto = {
  id: string;
  nome: string;
  telefone: string;
  id_pdv: string | null;
  id_funcionario: string;
  estagioNome: string;
  funcionarioNome: string;
};

type InstanciaMap = Map<string, { id: string; instanceName: string; nome: string }>;

type CriarCampanhaParams = {
  idEmpresa: string;
  idUsuario: string;
  nome: string;
  mensagemTemplate: string;
  iniciarEmIso: string;
  delayMinSegundos: number;
  delayMaxSegundos: number;
  jitterMsMax: number;
  leads: LeadComContexto[];
  pdvInstancias: Array<{ pdvId: string; instanciaId: string }>;
  fallbackInstanciaSemPdvId?: string;
  filtrosSnapshot?: Record<string, unknown>;
};

type Inelegivel = {
  leadId: string;
  nome: string;
  motivo: string;
};

type ResumoStatus = {
  pendentes: number;
  processando: number;
  enviados: number;
  falhas: number;
  cancelados: number;
  total: number;
};

function contarStatus(items: Array<{ status: string }>): ResumoStatus {
  return items.reduce<ResumoStatus>(
    (acc, item) => {
      const status = item.status;
      if (status === "PENDENTE") acc.pendentes += 1;
      else if (status === "PROCESSANDO") acc.processando += 1;
      else if (status === "ENVIADO") acc.enviados += 1;
      else if (status === "FALHA") acc.falhas += 1;
      else if (status === "CANCELADO") acc.cancelados += 1;
      return acc;
    },
    { pendentes: 0, processando: 0, enviados: 0, falhas: 0, cancelados: 0, total: items.length },
  );
}

function derivarStatusCampanha(status: ResumoStatus): string {
  if (status.total === 0) return "CONCLUIDA_COM_FALHAS";
  if (status.pendentes > 0 || status.processando > 0) return "EM_ANDAMENTO";
  if (status.enviados > 0 && status.falhas === 0) return "CONCLUIDA";
  if (status.enviados === 0 && status.cancelados === status.total) return "CANCELADA";
  return "CONCLUIDA_COM_FALHAS";
}

export async function carregarInstanciasDaEmpresa(idEmpresa: string, instanciaIds: string[]): Promise<InstanciaMap> {
  if (instanciaIds.length === 0) {
    return new Map();
  }

  const instancias = await prisma.whatsappInstancia.findMany({
    where: {
      id_empresa: idEmpresa,
      id: { in: instanciaIds },
    },
    select: {
      id: true,
      instance_name: true,
      nome: true,
    },
  });

  return new Map(instancias.map((item) => [item.id, { id: item.id, instanceName: item.instance_name, nome: item.nome }] as const));
}

export async function criarCampanhaDisparoLeads(params: CriarCampanhaParams) {
  const instanciaPorPdv = new Map(params.pdvInstancias.map((item) => [item.pdvId, item.instanciaId] as const));

  const instanciaIdsNecessarias = new Set(params.pdvInstancias.map((item) => item.instanciaId));
  if (params.fallbackInstanciaSemPdvId) {
    instanciaIdsNecessarias.add(params.fallbackInstanciaSemPdvId);
  }

  const instanciasMap = await carregarInstanciasDaEmpresa(params.idEmpresa, Array.from(instanciaIdsNecessarias));

  const inelegiveis: Inelegivel[] = [];
  const elegiveis: Array<{ lead: LeadComContexto; instanceName: string; remoteJid: string; mensagem: string }> = [];

  for (const lead of params.leads) {
    const instanciaId = lead.id_pdv ? instanciaPorPdv.get(lead.id_pdv) : params.fallbackInstanciaSemPdvId;
    if (!instanciaId) {
      inelegiveis.push({ leadId: lead.id, nome: lead.nome, motivo: lead.id_pdv ? "PDV sem instancia selecionada." : "Lead sem PDV e sem instancia fallback." });
      continue;
    }

    const instancia = instanciasMap.get(instanciaId);
    if (!instancia) {
      inelegiveis.push({ leadId: lead.id, nome: lead.nome, motivo: "Instancia escolhida nao pertence a empresa." });
      continue;
    }

    const jid = normalizarRemoteJidParaLead(lead.telefone);
    if (!jid.ok) {
      inelegiveis.push({ leadId: lead.id, nome: lead.nome, motivo: jid.erro });
      continue;
    }

    const mensagem = renderizarTemplateWhatsapp(params.mensagemTemplate, {
      lead_id: lead.id,
      lead_nome: lead.nome,
      lead_telefone: lead.telefone,
      estagio_nome: lead.estagioNome,
      nome_funcionario: lead.funcionarioNome,
      canal: "whatsapp",
    }).trim();

    if (!mensagem) {
      inelegiveis.push({ leadId: lead.id, nome: lead.nome, motivo: "Template resultou em mensagem vazia para este lead." });
      continue;
    }

    elegiveis.push({
      lead,
      instanceName: instancia.instanceName,
      remoteJid: jid.remoteJid,
      mensagem,
    });
  }

  const inicio = params.iniciarEmIso;
  const agenda = calcularAgendaPorInstancia({
    inicio,
    leads: elegiveis.map((item) => ({ leadId: item.lead.id, instanceName: item.instanceName })),
    delayMinSegundos: params.delayMinSegundos,
    delayMaxSegundos: params.delayMaxSegundos,
    jitterMaxMs: params.jitterMsMax,
  });

  const mensagensPorLeadId = new Map(elegiveis.map((item) => [item.lead.id, item] as const));
  const ultimoAgendamento = agenda.length > 0 ? agenda[agenda.length - 1]?.agendadoPara.toISOString() : null;
  const resumo = calcularResumoCampanha({
    selecionadosTotal: params.leads.length,
    elegiveisTotal: elegiveis.length,
    inicio,
    ultimoAgendamento,
  });

  const campanhaId = randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.campanhaDisparoLead.create({
      data: {
        id: campanhaId,
        id_empresa: params.idEmpresa,
        nome: params.nome,
        mensagem_template: params.mensagemTemplate,
        status: elegiveis.length > 0 ? "AGENDADA" : "CONCLUIDA_COM_FALHAS",
        inicio_em: new Date(inicio),
        delay_min_segundos: params.delayMinSegundos,
        delay_max_segundos: params.delayMaxSegundos,
        jitter_ms_max: params.jitterMsMax,
        selecionados_total: resumo.selecionadosTotal,
        elegiveis_total: resumo.elegiveisTotal,
        ignorados_total: resumo.ignoradosTotal,
        duracao_estimada_segundos: resumo.duracaoEstimadaSegundos,
        filtros_snapshot_json: JSON.stringify(params.filtrosSnapshot ?? {}),
        configuracao_pdvs_json: JSON.stringify({
          pdvInstancias: params.pdvInstancias,
          fallbackInstanciaSemPdvId: params.fallbackInstanciaSemPdvId ?? null,
        }),
        resumo_inelegiveis_json: JSON.stringify(inelegiveis),
        ultimo_agendamento_em: ultimoAgendamento ? new Date(ultimoAgendamento) : null,
        criado_por: params.idUsuario,
      },
    });

    if (agenda.length > 0) {
      await tx.mensagemAgendada.createMany({
        data: agenda
          .map((item) => {
            const base = mensagensPorLeadId.get(item.leadId);
            if (!base) {
              return null;
            }

            return {
              id: randomUUID(),
              id_empresa: params.idEmpresa,
              id_lead: item.leadId,
              id_campanha_disparo: campanhaId,
              instance_name: base.instanceName,
              remote_jid: base.remoteJid,
              conteudo: base.mensagem,
              tipo: "text",
              agendado_para: item.agendadoPara,
              status: "PENDENTE",
              criado_por: params.idUsuario,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null),
      });
    }
  });

  return {
    campanhaId,
    resumo,
    inelegiveis,
    inicio,
    ultimoAgendamento,
  };
}

export async function listarCampanhasDisparoLeads(params: { idEmpresa: string; limite: number }) {
  const campanhas = await prisma.campanhaDisparoLead.findMany({
    where: { id_empresa: params.idEmpresa },
    orderBy: { criado_em: "desc" },
    take: params.limite,
  });

  const campanhaIds = campanhas.map((item) => item.id);
  const mensagens = campanhaIds.length
    ? await prisma.mensagemAgendada.findMany({
        where: { id_campanha_disparo: { in: campanhaIds } },
        select: { id_campanha_disparo: true, status: true },
      })
    : [];

  const mensagensPorCampanha = new Map<string, Array<{ status: string }>>();
  for (const item of mensagens) {
    if (!item.id_campanha_disparo) continue;
    const atual = mensagensPorCampanha.get(item.id_campanha_disparo) ?? [];
    atual.push({ status: item.status });
    mensagensPorCampanha.set(item.id_campanha_disparo, atual);
  }

  return campanhas.map((item) => {
    const resumoStatus = contarStatus(mensagensPorCampanha.get(item.id) ?? []);
    return {
      id: item.id,
      nome: item.nome,
      status: derivarStatusCampanha(resumoStatus),
      inicioEm: item.inicio_em,
      ultimoAgendamentoEm: item.ultimo_agendamento_em,
      selecionadosTotal: item.selecionados_total,
      elegiveisTotal: item.elegiveis_total,
      ignoradosTotal: item.ignorados_total,
      duracaoEstimadaSegundos: item.duracao_estimada_segundos,
      criadoEm: item.criado_em,
      atualizadoEm: item.atualizado_em,
      resumoStatus,
    };
  });
}

export async function detalharCampanhaDisparoLeads(params: { idEmpresa: string; campanhaId: string }) {
  const campanha = await prisma.campanhaDisparoLead.findFirst({
    where: { id: params.campanhaId, id_empresa: params.idEmpresa },
  });

  if (!campanha) {
    return null;
  }

  const mensagens = await prisma.mensagemAgendada.findMany({
    where: { id_campanha_disparo: campanha.id, id_empresa: params.idEmpresa },
    orderBy: { agendado_para: "asc" },
    select: {
      id: true,
      id_lead: true,
      instance_name: true,
      remote_jid: true,
      conteudo: true,
      agendado_para: true,
      status: true,
      tentativas: true,
      erro: true,
      enviado_em: true,
      criado_em: true,
    },
  });

  const leadIds = mensagens.map((item) => item.id_lead).filter((item): item is string => Boolean(item));
  const leads = leadIds.length
    ? await prisma.lead.findMany({ where: { id_empresa: params.idEmpresa, id: { in: leadIds } }, select: { id: true, nome: true } })
    : [];
  const leadPorId = new Map(leads.map((item) => [item.id, item.nome] as const));
  const resumoStatus = contarStatus(mensagens);

  return {
    id: campanha.id,
    nome: campanha.nome,
    status: derivarStatusCampanha(resumoStatus),
    mensagemTemplate: campanha.mensagem_template,
    inicioEm: campanha.inicio_em,
    ultimoAgendamentoEm: campanha.ultimo_agendamento_em,
    selecionadosTotal: campanha.selecionados_total,
    elegiveisTotal: campanha.elegiveis_total,
    ignoradosTotal: campanha.ignorados_total,
    duracaoEstimadaSegundos: campanha.duracao_estimada_segundos,
    resumoStatus,
    inelegiveis: JSON.parse(campanha.resumo_inelegiveis_json || "[]") as Inelegivel[],
    itens: mensagens.map((item) => ({
      id: item.id,
      leadId: item.id_lead,
      leadNome: item.id_lead ? (leadPorId.get(item.id_lead) ?? "Lead") : "Lead",
      instancia: item.instance_name,
      remoteJid: item.remote_jid,
      mensagem: item.conteudo,
      agendadoPara: item.agendado_para,
      status: item.status,
      tentativas: item.tentativas,
      erro: item.erro,
      enviadoEm: item.enviado_em,
      criadoEm: item.criado_em,
    })),
  };
}

export async function cancelarCampanhaDisparoLeads(params: { idEmpresa: string; campanhaId: string }) {
  const campanha = await prisma.campanhaDisparoLead.findFirst({
    where: { id: params.campanhaId, id_empresa: params.idEmpresa },
    select: { id: true },
  });

  if (!campanha) {
    return null;
  }

  const update = await prisma.mensagemAgendada.updateMany({
    where: {
      id_empresa: params.idEmpresa,
      id_campanha_disparo: campanha.id,
      status: { in: ["PENDENTE", "PROCESSANDO"] },
    },
    data: {
      status: "CANCELADO",
      erro: "Cancelado manualmente pelo usuario.",
      atualizado_em: new Date(),
    },
  });

  await prisma.campanhaDisparoLead.update({
    where: { id: campanha.id },
    data: { status: "CANCELADA", finalizada_em: new Date(), atualizado_em: new Date() },
  });

  return { cancelados: update.count };
}
