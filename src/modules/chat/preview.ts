export type ChatPreviewEntrada = {
  conteudo: string;
  fromMe: boolean;
  kind?: string | null;
  hasMedia?: boolean | null;
};

function removerEmojiPrefixo(texto: string) {
  return texto.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, "").trim();
}

export function formatarPreviewChat(msg: ChatPreviewEntrada | null | undefined): string {
  if (!msg) return "Sem mensagens";

  const conteudo = msg.conteudo.trim();
  const kind = msg.kind ?? "";
  const prefixo = msg.fromMe ? "Você: " : "";

  const fallbackTipo: Record<string, string> = {
    imageMessage: "📷 Foto",
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

  if (!conteudo) {
    return `${prefixo}${fallback}`;
  }

  if (kind === "audioMessage") {
    return `${prefixo}🎙 Áudio`;
  }

  if (kind === "stickerMessage" || kind === "reactionMessage" || kind === "locationMessage") {
    return `${prefixo}${fallback}`;
  }

  if (kind === "documentMessage") {
    return `${prefixo}${removerEmojiPrefixo(conteudo) || "Documento"}`;
  }

  if (kind === "imageMessage" || kind === "videoMessage") {
    const textoLimpo = removerEmojiPrefixo(conteudo);
    return `${prefixo}${textoLimpo ? textoLimpo : fallback}`;
  }

  return `${prefixo}${conteudo}`;
}
