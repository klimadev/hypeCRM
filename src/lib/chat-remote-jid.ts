export function extrairTelefoneDeRemoteJid(remoteJid: string): string {
  return remoteJid.replace(/@.*/, "").replace(/\D/g, "");
}

export function ehLid(remoteJid: string): boolean {
  return remoteJid.includes("@lid");
}

export function normalizarRemoteJidCanonico(remoteJid: string): string {
  const jidCanonico = remoteJid.trim();
  const telefone = extrairTelefoneDeRemoteJid(jidCanonico);
  if (!telefone) return jidCanonico;
  return jidCanonico.includes("@lid") ? `${telefone}@s.whatsapp.net` : jidCanonico;
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
