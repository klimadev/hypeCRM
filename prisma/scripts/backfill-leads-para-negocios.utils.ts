import { createHash } from "crypto";

export type CliOptionsBackfill = {
  dryRun: boolean;
  empresaId?: string;
  leadId?: string;
  batchSize: number;
  resumeAfter?: string;
};

export type ResumoBackfill = {
  leads_lidos: number;
  negocios_criados: number;
  negocios_ja_existentes: number;
  parcelas_atualizadas: number;
  produtos_copiados: number;
  logs_copiados: number;
  jobs_atualizados: number;
  erros: number;
};

export type ResultadoLeadBackfill = {
  criado: boolean;
  parcelasAtualizadas: number;
  produtosCopiados: number;
  logsCopiados: number;
  jobsAtualizados: number;
};

export type LeadLegadoResumoBackfill = {
  nome: string | null;
  LeadProduto: Array<{ nome_snapshot: string | null }>;
};

export type VerificacoesBackfill = {
  totalLeads: number;
  totalLeadsComNegocio: number;
  parcelasOrfas: number;
  logsLegadosSemNegocio: number;
};

export function parseArgsBackfill(argv: string[]): CliOptionsBackfill {
  const options: CliOptionsBackfill = {
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

export function normalizarStatusNegocioBackfill(tipoEstagio: string): "ABERTO" | "GANHO" | "PERDIDO" {
  if (tipoEstagio === "GANHO") return "GANHO";
  if (tipoEstagio === "PERDIDO") return "PERDIDO";
  return "ABERTO";
}

export function tituloNegocioInicialBackfill(lead: LeadLegadoResumoBackfill) {
  const primeiroProduto = lead.LeadProduto[0]?.nome_snapshot?.trim();
  if (primeiroProduto) return primeiroProduto;
  return lead.nome?.trim() ? `Negocio inicial - ${lead.nome.trim()}` : "Negocio inicial";
}

export function referenciaLogMigradoBackfill(idNegocio: string, idLogLead: string) {
  return createHash("sha256").update(`negocio-log:${idNegocio}:${idLogLead}`).digest("hex");
}

export function referenciaProdutoMigradoBackfill(idNegocio: string, idLeadProduto: string) {
  return createHash("sha256").update(`negocio-produto:${idNegocio}:${idLeadProduto}`).digest("hex");
}

export function criarResumoBackfill(): ResumoBackfill {
  return {
    leads_lidos: 0,
    negocios_criados: 0,
    negocios_ja_existentes: 0,
    parcelas_atualizadas: 0,
    produtos_copiados: 0,
    logs_copiados: 0,
    jobs_atualizados: 0,
    erros: 0,
  };
}

export function acumularResultadoResumo(resumo: ResumoBackfill, resultado: ResultadoLeadBackfill) {
  if (resultado.criado) {
    resumo.negocios_criados++;
  } else {
    resumo.negocios_ja_existentes++;
  }

  resumo.parcelas_atualizadas += resultado.parcelasAtualizadas;
  resumo.produtos_copiados += resultado.produtosCopiados;
  resumo.logs_copiados += resultado.logsCopiados;
  resumo.jobs_atualizados += resultado.jobsAtualizados;

  return resumo;
}

export function serializarResumoBackfill(resumo: ResumoBackfill) {
  return JSON.stringify(resumo, null, 2);
}

export function validarVerificacoesBackfill(verificacoes: VerificacoesBackfill) {
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
