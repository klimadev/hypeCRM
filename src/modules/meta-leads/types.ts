import type { SessaoToken } from "@/lib/tipos";

export type MetaLeadsToken = {
  pageId: string;
  pageName: string;
  token: string;
};

export type CampoMappingForm = {
  nome: string;
  telefone: string;
  email: string | null;
};

export type CampoMapping = Record<string, CampoMappingForm>; // key = formId

export type MetaLeadForm = {
  id: string;
  name: string;
  status: string;
  locale?: string;
  campos_disponiveis: string[];
  auto_mapping: CampoMappingForm;
  leads: MetaLeadSample[];
};

export type MetaLeadSample = {
  id: string;
  created_time: string;
  ad_id?: string;
  form_id: string;
  field_data: Array<{ name: string; values: string[] }>;
};

export type MetaLeadsTestResult = {
  pages: Array<{
    pageId: string;
    pageName: string;
    token: string;
    forms: MetaLeadForm[];
    leads: MetaLeadSample[];
  }>;
};

export type MetaLeadsSyncResult = {
  total_importados: number;
  total_ignorados: number;
  erros: string[];
  debug: string[];
};

export type UseMetaLeadsModuleReturn = {
  config: { pageTokens: MetaLeadsToken[]; ativo: boolean; ultimaSync: string | null; campoMapping: CampoMapping } | null;
  carregando: boolean;
  erro: string | null;
  salvarConfig: (tokens: MetaLeadsToken[], ativo: boolean, campoMapping?: CampoMapping) => Promise<{ sucesso: boolean; erro?: string }>;
  testarConexao: (tokens?: Array<{ raw: string; pageId?: string; pageName?: string }>) => Promise<{ sucesso: boolean; erro?: string; dados?: MetaLeadsTestResult }>;
  syncAgora: () => Promise<MetaLeadsSyncResult | null>;
  recarregar: () => Promise<void>;
};

export type ModuloMetaLeadsProps = {
  perfil: SessaoToken["perfil"];
};
