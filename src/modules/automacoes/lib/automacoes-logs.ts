import type { AutomacaoExecucaoItem } from "@/lib/api/automacoes";

export function parseResumoExecucao(execucao: AutomacaoExecucaoItem) {
  if (!execucao.log_resumido_json) {
    return "Sem detalhes";
  }

  try {
    const parsed = JSON.parse(execucao.log_resumido_json) as {
      erro?: string;
      enviados?: number;
      totalDestinatarios?: number;
      instancia?: string;
    };

    if (parsed.erro) {
      return parsed.erro;
    }

    if (typeof parsed.enviados === "number") {
      return `${parsed.enviados}/${parsed.totalDestinatarios ?? parsed.enviados} envios (${parsed.instancia ?? "instância"})`;
    }

    return "Sem detalhes";
  } catch {
    return "Resumo indisponível";
  }
}

export function getExecucaoBadgeVariant(status: string): "success" | "error" | "info" {
  if (status === "CONCLUIDA") {
    return "success";
  }

  if (status === "FALHA") {
    return "error";
  }

  return "info";
}
