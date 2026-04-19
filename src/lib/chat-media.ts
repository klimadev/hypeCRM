export type TipoMidiaChat = "image" | "document" | "sticker";

export function inferirTipoMidiaArquivo(arquivo: { type: string; name: string }): TipoMidiaChat {
  const nome = arquivo.name.toLowerCase();
  if (arquivo.type === "image/webp" || nome.endsWith(".webp")) return "sticker";
  if (arquivo.type.startsWith("image/")) return "image";
  return "document";
}
