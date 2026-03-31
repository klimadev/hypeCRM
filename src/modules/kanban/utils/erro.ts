type ErroComMensagem = {
  message?: unknown;
};

export const MENSAGENS_FALLBACK_KANBAN = {
  criarNegocio: "Erro ao criar negócio.",
  redistribuirEmAtendimento: "Erro ao redistribuir negócios em atendimento.",
} as const;

export function obterMensagemErroKanban(erro: unknown, fallback: string): string {
  if (erro instanceof Error && erro.message.trim()) {
    return erro.message;
  }

  if (typeof erro === "string" && erro.trim()) {
    return erro;
  }

  if (erro && typeof erro === "object") {
    const candidato = (erro as ErroComMensagem).message;
    if (typeof candidato === "string" && candidato.trim()) {
      return candidato;
    }
  }

  return fallback;
}
