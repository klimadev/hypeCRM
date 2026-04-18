export function extrairTelefoneDeRemoteJid(remoteJid: string): string {
  return remoteJid.replace(/@.*/, "").replace(/\D/g, "");
}

export function ehLid(remoteJid: string): boolean {
  return remoteJid.includes("@lid");
}

export function normalizarRemoteJidCanonico(remoteJid: string): string {
  const jidCanonico = remoteJid.trim();
  if (!jidCanonico) return jidCanonico;
  if (jidCanonico.includes("@s.whatsapp.net")) return jidCanonico;
  if (jidCanonico.includes("@lid")) {
    const telefone = extrairTelefoneDeRemoteJid(jidCanonico);
    if (telefone) return `${telefone}@s.whatsapp.net`;
  }
  return jidCanonico;
}

export function extrairLookupParaMensagens(remoteJid: string, remoteJidAlt: string | null | undefined): string {
  const jid = (remoteJid || "").trim();
  const alt = (remoteJidAlt || "").trim();
  const hasAltValid = alt && (alt.includes("@s.whatsapp.net") || alt.includes("@lid"));
  if (hasAltValid) {
    return alt;
  }
  if (jid.includes("@s.whatsapp.net")) return jid;
  if (jid.includes("@lid")) {
    const telefone = extrairTelefoneDeRemoteJid(jid);
    if (telefone) return `${telefone}@s.whatsapp.net`;
  }
  return jid;
}

type DestinoConversaWhatsapp = {
  lookupRemoteJid: string;
  telefone: string;
};

export async function resolverDestinoConversaWhatsapp(
  instanceName: string,
  remoteJid: string,
): Promise<DestinoConversaWhatsapp | null> {
  void instanceName;

  const jidCanonico = remoteJid.trim();
  const telefone = extrairTelefoneDeRemoteJid(jidCanonico);
  if (!telefone) return null;

  const lookupRemoteJid = normalizarRemoteJidCanonico(jidCanonico);

  return {
    lookupRemoteJid,
    telefone,
  };
}