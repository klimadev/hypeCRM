export function extrairTelefoneDeRemoteJid(remoteJid: string): string {
  return remoteJid.replace(/@.*/, "").replace(/\D/g, "");
}

export function ehLid(remoteJid: string): boolean {
  return remoteJid.includes("@lid");
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

  return {
    lookupRemoteJid: jidCanonico,
    telefone,
  };
}
