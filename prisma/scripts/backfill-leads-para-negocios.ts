import { createHash, randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma, ensureSqliteOptimizations } from "@/lib/prisma";

type CliOptions = {
  dryRun: boolean;
  empresaId?: string;
  leadId?: string;
  batchSize: number;
  resumeAfter?: string;
};

const includeLeadLegado = {
  EstagioFunil: true,
  Funcionario: true,
  Negocio: {
    select: {
      id: true,
      chave_migracao: true,
      id_lead: true,
    },
  },
  LeadProduto: {
    orderBy: { criado_em: "asc" },
  },
  Parcela: {
    orderBy: { numero_parcela: "asc" },
  },
  LeadEstagioLog: {
    orderBy: { criado_em: "asc" },
  },
} satisfies Prisma.LeadInclude;

type LeadLegado = Prisma.LeadGetPayload<{
  include: typeof includeLeadLegado;
}>;

type ResumoBackfill = {
  leads_lidos: number;
  negocios_criados: number;
  negocios_ja_existentes: number;
  parcelas_atualizadas: number;
  produtos_copiados: number;
  logs_copiados: number;
  jobs_atualizados: number;
  erros: number;
};

type ResultadoLead = {
  criado: boolean;
  parcelasAtualizadas: number;
  produtosCopiados: number;
  logsCopiados: number;
  jobsAtualizados: number;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    batchSize: 100,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--empresa-id=")) {
      options.empresaId = arg.split("=").slice(1).join("=").trim() || undefined;
      continue;
    }

    if (arg.startsWith("--lead-id=")) {
      options.leadId = arg.split("=").slice(1).join("=").trim() || undefined;
      continue;
    }

    if (arg.startsWith("--resume-after=")) {
      options.resumeAfter = arg.split("=").slice(1).join("=").trim() || undefined;
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      const value = Number(arg.split("=").slice(1).join("="));
      if (Number.isFinite(value) && value > 0) {
        options.batchSize = Math.max(1, Math.floor(value));
      }
    }
  }

  return options;
}

function normalizarStatusNegocio(tipoEstagio: string): "ABERTO" | "GANHO" | "PERDIDO" {
  if (tipoEstagio === "GANHO") return "GANHO";
  if (tipoEstagio === "PERDIDO") return "PERDIDO";
  return "ABERTO";
}

function tituloNegocioInicial(lead: LeadLegado): string {
  const primeiroProduto = lead.LeadProduto[0]?.nome_snapshot?.trim();
  if (primeiroProduto) return primeiroProduto;
  return lead.nome?.trim() ? `Negocio inicial - ${lead.nome.trim()}` : "Negocio inicial";
}

function referenciaLogMigrado(idNegocio: string, idLogLead: string): string {
  return createHash("sha256")
    .update(`negocio-log:${idNegocio}:${idLogLead}`)
    .digest("hex");
}

function referenciaProdutoMigrado(idNegocio: string, idLeadProduto: string): string {
  return createHash("sha256")
    .update(`negocio-produto:${idNegocio}:${idLeadProduto}`)
    .digest("hex");
}

function serializarResumo(resumo: ResumoBackfill) {
  return JSON.stringify(resumo, null, 2);
}

async function carregarLeads(options: CliOptions, cursor?: string) {
  return prisma.lead.findMany({
    where: {
      ...(options.empresaId ? { id_empresa: options.empresaId } : {}),
      ...(options.leadId ? { id: options.leadId } : {}),
      ...(options.resumeAfter && !cursor
        ? { id: { gt: options.resumeAfter } }
        : {}),
      ...(cursor ? { id: { gt: cursor } } : {}),
    },
    include: includeLeadLegado,
    orderBy: { id: "asc" },
    take: options.leadId ? 1 : options.batchSize,
  });
}

async function processarLead(lead: LeadLegado, dryRun: boolean): Promise<ResultadoLead> {
  const chaveMigracao = `lead:${lead.id}`;
  const status = normalizarStatusNegocio(lead.EstagioFunil.tipo);
  const idFunil = lead.EstagioFunil.id_funil;
  const titulo = tituloNegocioInicial(lead);
  const negocioLegado = lead.Negocio[0] ?? null;

  const negocioExistente = negocioLegado
    ? await prisma.negocio.findFirst({
        where: { id: negocioLegado.id, id_empresa: lead.id_empresa },
        select: { id: true, chave_migracao: true },
      })
    : await prisma.negocio.findUnique({
        where: { chave_migracao: chaveMigracao },
        select: { id: true, chave_migracao: true },
      });

  if (dryRun) {
    const logsExistentes = negocioExistente
      ? await prisma.negocioEstagioLog.count({ where: { id_negocio: negocioExistente.id } })
      : 0;
    const produtosExistentes = negocioExistente
      ? await prisma.negocioProduto.count({ where: { id_negocio: negocioExistente.id } })
      : 0;
    const jobsComNegocio = negocioExistente
      ? await prisma.automacaoAgendamento.count({ where: { id_lead: lead.id, id_negocio: negocioExistente.id } })
      : 0;

    return {
      criado: !negocioExistente,
      parcelasAtualizadas: lead.Parcela.filter((parcela) => parcela.id_negocio !== negocioExistente?.id).length,
      produtosCopiados: Math.max(lead.LeadProduto.length - produtosExistentes, 0),
      logsCopiados: Math.max((lead.LeadEstagioLog.length || 1) - logsExistentes, 0),
      jobsAtualizados: Math.max(
        (await prisma.automacaoAgendamento.count({ where: { id_lead: lead.id, id_negocio: null } })) - jobsComNegocio,
        0,
      ),
    };
  }

  return prisma.$transaction(async (tx) => {
    let negocioId = negocioExistente?.id ?? null;
    let criado = false;

    if (!negocioId) {
      const negocio = await tx.negocio.create({
        data: {
          id: randomUUID(),
          id_empresa: lead.id_empresa,
          id_lead: lead.id,
          id_funil: idFunil,
          id_estagio: lead.id_estagio,
          id_funcionario: lead.id_funcionario,
          titulo,
          valor_estimado: lead.valor_oportunidade,
          valor_fechado: status === "GANHO" ? lead.valor_oportunidade : null,
          probabilidade: lead.probabilidade,
          status,
          data_abertura: lead.criado_em,
          data_fechamento: status === "ABERTO" ? null : lead.atualizado_em,
          motivo_perda: lead.motivo_perda,
          observacoes_comerciais: lead.observacoes,
          chave_migracao: chaveMigracao,
          criado_em: lead.criado_em,
          atualizado_em: lead.atualizado_em,
        },
        select: { id: true },
      });

      negocioId = negocio.id;
      criado = true;
    }

    if (negocioLegado?.id !== negocioId) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE Lead
        SET id_negocio = ${negocioId}
        WHERE id = ${lead.id}
      `);
    }

    const parcelasSemNegocio = lead.Parcela.filter((parcela) => parcela.id_negocio !== negocioId);
    if (parcelasSemNegocio.length > 0) {
      await tx.parcela.updateMany({
        where: { id: { in: parcelasSemNegocio.map((parcela) => parcela.id) } },
        data: { id_negocio: negocioId },
      });
    }

    const produtosExistentes = new Set(
      (
        await tx.negocioProduto.findMany({
          where: { id_negocio: negocioId },
          select: { observacoes: true, id_produto: true, nome_snapshot: true, criado_em: true },
        })
      ).map((item) => referenciaProdutoMigrado(negocioId, `${item.id_produto}:${item.nome_snapshot}:${item.criado_em.toISOString()}`)),
    );

    let produtosCopiados = 0;
    for (const produto of lead.LeadProduto) {
      const referencia = referenciaProdutoMigrado(negocioId, produto.id);
      if (produtosExistentes.has(referencia)) continue;

      await tx.negocioProduto.create({
        data: {
          id: randomUUID(),
          id_empresa: produto.id_empresa,
          id_negocio: negocioId,
          id_produto: produto.id_produto,
          nome_snapshot: produto.nome_snapshot,
          schema_snapshot: produto.schema_snapshot,
          valores_layout: produto.valores_layout,
          observacoes: produto.observacoes,
          criado_em: produto.criado_em,
          atualizado_em: produto.atualizado_em,
        },
      });
      produtosCopiados++;
    }

    const logsExistentes = new Set(
      (
        await tx.negocioEstagioLog.findMany({
          where: { id_negocio: negocioId },
          select: { id: true },
        })
      ).map((log) => log.id),
    );

    let logsCopiados = 0;
    if (lead.LeadEstagioLog.length > 0) {
      for (const log of lead.LeadEstagioLog) {
        const idLogMigrado = referenciaLogMigrado(negocioId, log.id);
        if (logsExistentes.has(idLogMigrado)) continue;

        const estagioAnterior = log.id_estagio_anterior
          ? await tx.estagioFunil.findUnique({
              where: { id: log.id_estagio_anterior },
              select: { id_funil: true },
            })
          : null;
        const estagioNovo = await tx.estagioFunil.findUnique({
          where: { id: log.id_estagio_novo },
          select: { id_funil: true },
        });

        if (!estagioNovo) {
          throw new Error(`Estagio destino nao encontrado para o log legado ${log.id}.`);
        }

        await tx.negocioEstagioLog.create({
          data: {
            id: idLogMigrado,
            id_negocio: negocioId,
            id_funil_anterior: estagioAnterior?.id_funil ?? null,
            id_funil_novo: estagioNovo.id_funil,
            id_estagio_anterior: log.id_estagio_anterior,
            id_estagio_novo: log.id_estagio_novo,
            empresa_id: log.empresa_id,
            origem: "MIGRACAO",
            criado_em: log.criado_em,
          },
        });
        logsCopiados++;
      }
    } else {
      const idLogSintetico = referenciaLogMigrado(negocioId, "sem-log-legado");
      if (!logsExistentes.has(idLogSintetico)) {
        await tx.negocioEstagioLog.create({
          data: {
            id: idLogSintetico,
            id_negocio: negocioId,
            id_funil_anterior: null,
            id_funil_novo: idFunil,
            id_estagio_anterior: null,
            id_estagio_novo: lead.id_estagio,
            empresa_id: lead.id_empresa,
            origem: "MIGRACAO",
            criado_em: lead.atualizado_em,
          },
        });
        logsCopiados++;
      }
    }

    const jobsSemNegocio = await tx.automacaoAgendamento.updateMany({
      where: {
        id_lead: lead.id,
        id_negocio: null,
      },
      data: {
        id_negocio: negocioId,
      },
    });

    return {
      criado,
      parcelasAtualizadas: parcelasSemNegocio.length,
      produtosCopiados,
      logsCopiados,
      jobsAtualizados: jobsSemNegocio.count,
    };
  });
}

async function executarVerificacoes(options: CliOptions) {
  const [totalLeads, totalLeadsComNegocio, parcelasOrfas, logsLegadosSemNegocio] = await Promise.all([
    prisma.lead.count({
      where: {
        ...(options.empresaId ? { id_empresa: options.empresaId } : {}),
        ...(options.leadId ? { id: options.leadId } : {}),
      },
    }),
    prisma.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
      SELECT COUNT(*) AS total
      FROM Lead
      WHERE 1 = 1
        ${options.empresaId ? Prisma.sql`AND id_empresa = ${options.empresaId}` : Prisma.empty}
        ${options.leadId ? Prisma.sql`AND id = ${options.leadId}` : Prisma.empty}
        AND id_negocio IS NOT NULL
    `).then((rows) => Number(rows[0]?.total ?? 0)),
    prisma.parcela.count({
      where: {
        ...(options.empresaId ? { id_empresa: options.empresaId } : {}),
        ...(options.leadId ? { id_lead: options.leadId } : {}),
        id_negocio: null,
      },
    }),
    prisma.leadEstagioLog.count({
      where: {
        ...(options.empresaId ? { empresa_id: options.empresaId } : {}),
        ...(options.leadId ? { id_lead: options.leadId } : {}),
      },
    }),
  ]);

  const logsMigrados = await prisma.negocioEstagioLog.count({
    where: {
      origem: "MIGRACAO",
      ...(options.empresaId ? { empresa_id: options.empresaId } : {}),
      ...(options.leadId
        ? {
            negocio: {
              id_lead: options.leadId,
            },
          }
        : {}),
    },
  });

  return {
    totalLeads,
    totalLeadsComNegocio,
    parcelasOrfas,
    logsLegadosSemNegocio: Math.max(logsLegadosSemNegocio - logsMigrados, 0),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const resumo: ResumoBackfill = {
    leads_lidos: 0,
    negocios_criados: 0,
    negocios_ja_existentes: 0,
    parcelas_atualizadas: 0,
    produtos_copiados: 0,
    logs_copiados: 0,
    jobs_atualizados: 0,
    erros: 0,
  };

  await ensureSqliteOptimizations();

  let cursor: string | undefined;
  let continuar = true;

  while (continuar) {
    const leads = await carregarLeads(options, cursor);
    if (leads.length === 0) {
      break;
    }

    for (const lead of leads) {
      resumo.leads_lidos++;
      cursor = lead.id;

      try {
        const resultado = await processarLead(lead, options.dryRun);
        if (resultado.criado) {
          resumo.negocios_criados++;
        } else {
          resumo.negocios_ja_existentes++;
        }
        resumo.parcelas_atualizadas += resultado.parcelasAtualizadas;
        resumo.produtos_copiados += resultado.produtosCopiados;
        resumo.logs_copiados += resultado.logsCopiados;
        resumo.jobs_atualizados += resultado.jobsAtualizados;
      } catch (error) {
        resumo.erros++;
        console.error(`[backfill] erro ao processar lead ${lead.id}:`, error);
      }
    }

    continuar = Boolean(!options.leadId && leads.length === options.batchSize);
  }

  console.log("[backfill] resumo");
  console.log(serializarResumo(resumo));

  if (options.dryRun) {
    return;
  }

  const verificacoes = await executarVerificacoes(options);
  console.log("[backfill] verificacoes");
  console.log(JSON.stringify(verificacoes, null, 2));

  if (verificacoes.totalLeads !== verificacoes.totalLeadsComNegocio) {
    throw new Error("Total de leads diverge do total de leads vinculados a negocio.");
  }

  if (verificacoes.parcelasOrfas > 0) {
    throw new Error("Existem parcelas legadas sem negocio vinculado.");
  }

  if (verificacoes.logsLegadosSemNegocio > 0) {
    throw new Error("Existem logs legados sem equivalente em negocio.");
  }
}

main()
  .catch((error) => {
    console.error("[backfill] falha fatal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
