export function normalizarRemoteJid(jid: string | null | undefined): string {
  if (!jid || typeof jid !== "string") return "";
  return jid.replace("@lid", "@s.whatsapp.net");
}

export function extrairTelefoneDeRemoteJid(jid: string | null | undefined): string {
  if (!jid || typeof jid !== "string") return "";
  return jid.replace("@s.whatsapp.net", "").replace("@lid", "").replace(/\D/g, "");
}

export function ehGrupo(jid: string | null | undefined): boolean {
  if (!jid || typeof jid !== "string") return false;
  return jid.includes("@g.us");
}

export function ehStatusBroadcast(jid: string | null | undefined): boolean {
  if (!jid || typeof jid !== "string") return false;
  return jid === "status@broadcast";
}
