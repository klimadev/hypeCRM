export const MENSAGENS_KANBAN = {
  sucesso: {
    acaoConcluida: "Ação concluída com sucesso.",
  },
  erro: {
    generico: "Não foi possível concluir a operação. Tente novamente.",
    urlDocumentoInvalida: "Informe uma URL válida ou envie um arquivo PDF.",
  },
  loading: {
    carregando: "Carregando...",
    salvando: "Salvando...",
    processando: "Processando...",
  },
  confirmacao: {
    cancelar: "Cancelar",
    descartarAlteracoes: "Você tem alterações não salvas. Deseja descartá-las?",
  },
  atalhos: {
    fechar: "Fechar",
    confirmar: "Confirmar",
  },
  placeholders: {
    busca: "Buscar negócio",
    urlDocumento: "https://exemplo.com/documento.pdf",
  },
} as const;

export function interpolarMensagemKanban(template: string, valores: Record<string, string | number | null | undefined>) {
  return template.replace(/\{(.*?)\}/g, (_, chave: string) => {
    const valor = valores[chave.trim()];
    return valor == null ? "" : String(valor);
  });
}
