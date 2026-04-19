export type ChatPreviewEntrada = {
  conteudo: string;
  fromMe: boolean;
  kind?: string | null;
  hasMedia?: boolean | null;
  seconds?: number | null;
};

function removerEmojiPrefixo(texto: string) {
  return texto.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, "").trim();
}

function extrairNomeArquivo(texto: string) {
  const arquivo = texto.match(/^\[Arquivo:\s*(.+)\]$/i)?.[1]?.trim();
  return arquivo ? removerEmojiPrefixo(arquivo) : null;
}

export function formatarDuracaoSegundos(seconds?: number | null): string | null {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return null;
  const total = Math.max(0, Math.floor(seconds));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  if (horas > 0) {
    return `${horas}:${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`;
  }
  return `${minutos}:${segundos.toString().padStart(2, "0")}`;
}

export function formatarPreviewChat(msg: ChatPreviewEntrada | null | undefined): string {
  if (!msg) return "Sem mensagens";

  const conteudo = msg.conteudo.trim();
  const kind = msg.kind ?? "";
  const prefixo = msg.fromMe ? "Você: " : "";

  const fallbackTipo: Record<string, string> = {
    imageMessage: "📷 Imagem",
    videoMessage: "🎥 Vídeo",
    audioMessage: "🎙 Áudio",
    documentMessage: "📄 Documento",
    stickerMessage: "🙂 Sticker",
    locationMessage: "📍 Localização",
    liveLocationMessage: "📍 Localização ao vivo",
    contactMessage: "👤 Contato",
    listMessage: "📋 Lista",
    buttonsMessage: "🔘 Botões",
    templateMessage: "📄 Template",
    orderMessage: "🛒 Pedido",
    reactionMessage: "🙂 Reação",
    protocolMessage: "Mensagem de sistema",
  };

  const fallback = fallbackTipo[kind] ?? "Mensagem";

  if (kind === "audioMessage") {
    return `${prefixo}🎙 ${formatarDuracaoSegundos(msg.seconds) ?? "Áudio"}`;
  }

  if (kind === "documentMessage") {
    return `${prefixo}📄 ${extrairNomeArquivo(conteudo) ?? "Documento"}`;
  }

  if (kind === "imageMessage" || kind === "videoMessage" || kind === "stickerMessage" || kind === "reactionMessage" || kind === "locationMessage") {
    return `${prefixo}${fallback}`;
  }

  if (!conteudo) return `${prefixo}${fallback}`;

  return `${prefixo}${conteudo}`;
}
