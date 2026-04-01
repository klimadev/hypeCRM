import type { SessaoToken } from "@/lib/tipos";

export type IntegracaoCatalogoItem = {
  slug: string;
  nome: string;
  tituloCurto: string;
  resumoCurto: string;
  descricao: string;
  categoria: string;
  href: string;
  statusLabel: string;
  destaque: string;
  acaoLabel: string;
  recursos: string[];
  perfisPermitidos: SessaoToken["perfil"][];
};

export type UseIntegracoesModuleReturn = {
  integracoes: IntegracaoCatalogoItem[];
};
