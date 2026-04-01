import type { DadosAd } from "./whatsapp-utils.types";

export function extrairDadosAd(mensagem: Record<string, unknown>): DadosAd {
  const contextInfo = (mensagem.contextInfo ?? mensagem.messageContextInfo) as Record<string, unknown> | null;
  if (!contextInfo || typeof contextInfo !== "object") return null;

  const externalAdReply = contextInfo.externalAdReply as Record<string, unknown> | null;
  if (!externalAdReply || typeof externalAdReply !== "object") return null;

  const titulo = externalAdReply.title as string | null;
  const corpo = externalAdReply.body as string | null;
  const urlOrigem = externalAdReply.sourceUrl as string | null;
  const idConversao = externalAdReply.ctwaClid as string | null;
  const urlThumbnail = externalAdReply.thumbnailUrl as string | null;
  const tipoOrigem = externalAdReply.sourceType as string | null;
  const appOrigem = externalAdReply.sourceApp as string | null;
  const isAd = tipoOrigem === "ad" || urlOrigem?.includes("fb.me") || urlOrigem?.includes("facebook.com");

  if (!isAd && !idConversao) return null;

  return {
    titulo,
    corpo,
    urlOrigem,
    idConversao,
    urlThumbnail,
    tipoOrigem,
    appOrigem,
    formato: isAd || idConversao ? "ctwa" : null,
  };
}

export function mensagemTemOrigemAd(mensagem: Record<string, unknown>): boolean {
  return extrairDadosAd(mensagem) !== null;
}
