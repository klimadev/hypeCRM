type ChatLogContext = {
  instanceName?: string;
  remoteJid?: string;
  telefone?: string;
  pagina?: number;
  limite?: number;
  busca?: string;
  leadId?: string;
  idEmpresa?: string;
};

function horaBrasil(): string {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function serializar(valor: unknown): string {
  try {
    return JSON.stringify(valor, null, 2).slice(0, 1200);
  } catch {
    return String(valor);
  }
}

function serializarCompleto(valor: unknown): string {
  try {
    return JSON.stringify(valor, null, 2);
  } catch {
    return String(valor);
  }
}

function base(acao: string, contexto: ChatLogContext) {
  return `[CHAT_LOG] [${new Date().toISOString()}] [${horaBrasil()}] [${acao}] inst:${contexto.instanceName ?? "-"} jid:${contexto.remoteJid ?? "-"} tel:${contexto.telefone ?? "-"} pag:${contexto.pagina ?? 1} lim:${contexto.limite ?? "-"}`;
}

export const chatLogger = {
  log(acao: string, contexto: ChatLogContext, detalhes?: { raw?: unknown; rawCompleto?: unknown; rawResponse?: unknown; rawResponseCompleta?: unknown; normalizado?: unknown; normalizadoCompleto?: unknown; duracaoMs?: number; meta?: unknown }) {
    console.info(base(acao, contexto), detalhes?.duracaoMs ? `tempo:${detalhes.duracaoMs}ms` : "");
    if (detalhes?.raw !== undefined) console.info("[CHAT_LOG] RAW", serializar(detalhes.raw));
    if (detalhes?.rawCompleto !== undefined) console.info("[CHAT_LOG] RAW_COMPLETO", serializarCompleto(detalhes.rawCompleto));
    if (detalhes?.rawResponse !== undefined) console.info("[CHAT_LOG] RAW_RESPONSE", serializar(detalhes.rawResponse));
    if (detalhes?.rawResponseCompleta !== undefined) console.info("[CHAT_LOG] RAW_RESPONSE_COMPLETA", serializarCompleto(detalhes.rawResponseCompleta));
    if (detalhes?.normalizado !== undefined) console.info("[CHAT_LOG] NORMALIZADO", serializar(detalhes.normalizado));
    if (detalhes?.normalizadoCompleto !== undefined) console.info("[CHAT_LOG] NORMALIZADO_COMPLETO", serializarCompleto(detalhes.normalizadoCompleto));
    if (detalhes?.meta !== undefined) console.info("[CHAT_LOG] META", serializar(detalhes.meta));
  },

  erro(acao: string, contexto: ChatLogContext, erro: unknown, detalhes?: { rawResponse?: unknown }) {
    console.error(base(acao, contexto), `ERRO:${erro instanceof Error ? erro.message : String(erro)}`);
    if (detalhes?.rawResponse !== undefined) console.error("[CHAT_LOG] RAW_RESPONSE", serializar(detalhes.rawResponse));
  },
};

export function criarContextoChat(params: ChatLogContext): ChatLogContext {
  return params;
}
