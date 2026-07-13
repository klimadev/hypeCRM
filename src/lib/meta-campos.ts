// ponytail: auto-detect heuristic, upgrade to fuzzy/ML when forms grow beyond 50+
export type CampoMappingForm = {
  nome: string;
  telefone: string;
  email: string | null;
};

export type CampoMapping = Record<string, CampoMappingForm>; // key = formId

export type MetaLeadField = { name: string; values: string[] };

const CANDIDATOS_NOME = ["full_name", "name", "nome_completo", "nome"];
const CANDIDATOS_TEL = ["phone_number", "telefone", "phone", "celular", "whatsapp", "mobile", "tel_contato", "telefone_celular"];
const CANDIDATOS_EMAIL = ["email", "e_mail", "email_address", "e-mail"];

function matchCandidato(campos: string[], candidatos: string[]): string {
  for (const c of candidatos) if (campos.includes(c)) return c;
  return "";
}

function matchFuzzy(campos: string[], patterns: RegExp[]): string {
  return campos.find(c => patterns.some(p => p.test(c))) ?? "";
}

export function autoDetectNome(campos: string[]): string {
  return matchCandidato(campos, CANDIDATOS_NOME)
    || matchFuzzy(campos, [/nome/i, /name/i, /full_name/i])
    || (campos[0] ?? "");
}

export function autoDetectTelefone(campos: string[]): string {
  return matchCandidato(campos, CANDIDATOS_TEL)
    || matchFuzzy(campos, [/phone/i, /telefone/i, /celular/i, /whatsapp/i, /mobile/i, /tel/i])
    || "";
}

export function autoDetectEmail(campos: string[]): string {
  return matchCandidato(campos, CANDIDATOS_EMAIL)
    || matchFuzzy(campos, [/email/i, /e.?mail/i])
    || "";
}

export function autoDetectMapping(campos: string[]): CampoMappingForm {
  return {
    nome: autoDetectNome(campos),
    telefone: autoDetectTelefone(campos),
    email: autoDetectEmail(campos) || null,
  };
}

export function extrairCampo(
  fieldData: MetaLeadField[],
  nomeCampo: string,
): string {
  if (!nomeCampo) return "";
  const field = fieldData.find(f => f.name === nomeCampo);
  return field?.values?.[0] ?? "";
}

export function extrairCampoMapeado(
  fieldData: MetaLeadField[],
  mapping: CampoMappingForm | null | undefined,
): { nome: string; telefone: string; email: string | null } {
  if (!mapping) {
    // fallback auto-detect inline
    const campos = fieldData.map(f => f.name);
    mapping = autoDetectMapping(campos);
  }
  const nome = extrairCampo(fieldData, mapping.nome)
    || extrairCampo(fieldData, "full_name")
    || extrairCampo(fieldData, "name")
    || "Lead sem nome";
  const telefone = extrairCampo(fieldData, mapping.telefone)
    || extrairCampo(fieldData, "phone_number")
    || extrairCampo(fieldData, "phone")
    || "";
  const email = mapping.email
    ? (extrairCampo(fieldData, mapping.email) || null)
    : null;
  return { nome, telefone, email };
}
