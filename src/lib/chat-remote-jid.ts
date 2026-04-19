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

export function selecionarRemoteJidPreferencial(
  remoteJid: string,
  remoteJidAlt: string | null | undefined,
): string {
  const jid = (remoteJid || "").trim();
  const alt = (remoteJidAlt || "").trim();
  const candidatos = [jid, alt].filter(Boolean);

  const jidTelefone = candidatos.find((valor) => valor.includes("@s.whatsapp.net"));
  if (jidTelefone) return jidTelefone;

  const jidLid = candidatos.find((valor) => valor.includes("@lid"));
  if (jidLid) return jidLid;

  return candidatos[0] ?? "";
}

export function extrairLookupParaMensagens(remoteJid: string, remoteJidAlt: string | null | undefined): string {
  return selecionarRemoteJidPreferencial(remoteJid, remoteJidAlt);
}

type DestinoConversaWhatsapp = {
  instanceName: string;
  remoteJid: string;
  remoteJidCanonico: string;
  remoteJidAlt: string | null;
  lookupRemoteJid: string;
  telefone: string;
};

export async function resolverDestinoConversaWhatsapp(
  instanceName: string,
  remoteJid: string,
): Promise<DestinoConversaWhatsapp | null> {
  const jidCanonico = remoteJid.trim();
  if (!jidCanonico) return null;

  const remoteJidCanonico = normalizarRemoteJidCanonico(jidCanonico);
  const remoteJidAlt = ehLid(jidCanonico) ? jidCanonico : null;
  const lookupRemoteJid = extrairLookupParaMensagens(jidCanonico, remoteJidAlt);
  const telefone = extrairTelefoneDeRemoteJid(remoteJidCanonico);

  if (!telefone) return null;

  return {
    instanceName,
    remoteJid: jidCanonico,
    remoteJidCanonico,
    remoteJidAlt,
    lookupRemoteJid,
    telefone,
  };
}
