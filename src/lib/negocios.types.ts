import type { Prisma } from "@prisma/client";

export type FiltroAcessoEmpresaFuncionario = {
  id_empresa: string;
  id_funcionario?: string | { in: string[] };
};

export type QueryClient = Pick<Prisma.TransactionClient, "$queryRaw" | "$executeRaw">;

export type LinhaRaw = Record<string, unknown>;

export type LeadResponsavelResumo = {
  id: string;
  nome: string;
  id_pdv: string | null;
  pdv: {
    id: string;
    nome: string;
  } | null;
};

export type LeadResumoBasico = {
  id: string;
  id_empresa: string;
  id_funcionario: string;
  id_pdv: string | null;
  id_negocio: string | null;
  id_estagio: string;
  nome: string;
  telefone: string;
  email: string | null;
  valor_oportunidade: number;
  probabilidade: number;
  fonte: string | null;
  empresa_origem: string | null;
  observacoes: string | null;
  motivo_perda: string | null;
  criado_em: Date;
  atualizado_em: Date;
  origem: string;
  anuncio_titulo: string | null;
  anuncio_descricao: string | null;
  anuncio_url: string | null;
  dados_extras: string | null;
  funcionario: LeadResponsavelResumo;
};

export type NegocioResumo = {
  id: string;
  id_empresa: string;
  id_lead: string | null;
  id_funil: string;
  id_estagio: string;
  id_funcionario: string;
  id_produto_principal: string | null;
  titulo: string;
  valor_estimado: number;
  valor_fechado: number | null;
  probabilidade: number | null;
  status: string;
  data_abertura: Date;
  data_fechamento: Date | null;
  motivo_perda: string | null;
  observacoes_comerciais: string | null;
  chave_migracao: string | null;
  criado_em: Date;
  atualizado_em: Date;
  lead: LeadResumoBasico | null;
  lead_principal: LeadResumoBasico | null;
  leads: LeadResumoBasico[];
  estagio: {
    id: string;
    nome: string;
    ordem: number;
    tipo: string;
    id_funil: string;
  };
  funcionario: LeadResponsavelResumo;
  funil: {
    id: string;
    nome: string;
    slug: string;
    padrao: boolean;
  };
  id_pdv: string | null;
};

export type NegocioRowBase = LinhaRaw & {
  negocio_id: string;
  negocio_id_empresa: string;
  negocio_id_lead: string | null;
  negocio_id_funil: string;
  negocio_id_estagio: string;
  negocio_id_funcionario: string;
  negocio_id_produto_principal: string | null;
  negocio_titulo: string;
  negocio_valor_estimado: number | null;
  negocio_valor_fechado: number | null;
  negocio_probabilidade: number | null;
  negocio_status: string;
  negocio_data_abertura: Date;
  negocio_data_fechamento: Date | null;
  negocio_motivo_perda: string | null;
  negocio_observacoes_comerciais: string | null;
  negocio_chave_migracao: string | null;
  negocio_criado_em: Date;
  negocio_atualizado_em: Date;
  negocio_funcionario_id: string;
  negocio_funcionario_nome: string;
  negocio_funcionario_id_pdv: string | null;
  negocio_funcionario_pdv_id: string | null;
  negocio_funcionario_pdv_nome: string | null;
  negocio_estagio_id: string;
  negocio_estagio_nome: string;
  negocio_estagio_ordem: number | bigint;
  negocio_estagio_tipo: string;
  negocio_estagio_id_funil: string;
  negocio_funil_id: string;
  negocio_funil_nome: string;
  negocio_funil_slug: string;
  negocio_funil_padrao: number | boolean;
  lead_principal_id: string | null;
  lead_principal_id_empresa: string | null;
  lead_principal_id_funcionario: string | null;
  lead_principal_id_pdv: string | null;
  lead_principal_id_negocio: string | null;
  lead_principal_id_estagio: string | null;
  lead_principal_nome: string | null;
  lead_principal_telefone: string | null;
  lead_principal_email: string | null;
  lead_principal_valor_oportunidade: number | null;
  lead_principal_probabilidade: number | null;
  lead_principal_fonte: string | null;
  lead_principal_empresa_origem: string | null;
  lead_principal_observacoes: string | null;
  lead_principal_motivo_perda: string | null;
  lead_principal_criado_em: Date | null;
  lead_principal_atualizado_em: Date | null;
  lead_principal_origem: string | null;
  lead_principal_anuncio_titulo: string | null;
  lead_principal_anuncio_descricao: string | null;
  lead_principal_anuncio_url: string | null;
  lead_principal_dados_extras: string | null;
  lead_principal_funcionario_id: string | null;
  lead_principal_funcionario_nome: string | null;
  lead_principal_funcionario_id_pdv: string | null;
  lead_principal_funcionario_pdv_id: string | null;
  lead_principal_funcionario_pdv_nome: string | null;
};

export type LeadRowBase = LinhaRaw & {
  lead_id: string;
  lead_id_empresa: string;
  lead_id_funcionario: string;
  lead_id_pdv: string | null;
  lead_id_negocio: string | null;
  lead_id_estagio: string;
  lead_nome: string;
  lead_telefone: string;
  lead_email: string | null;
  lead_valor_oportunidade: number | null;
  lead_probabilidade: number | null;
  lead_fonte: string | null;
  lead_empresa_origem: string | null;
  lead_observacoes: string | null;
  lead_motivo_perda: string | null;
  lead_criado_em: Date;
  lead_atualizado_em: Date;
  lead_origem: string;
  lead_anuncio_titulo: string | null;
  lead_anuncio_descricao: string | null;
  lead_anuncio_url: string | null;
  lead_dados_extras: string | null;
  lead_funcionario_id: string;
  lead_funcionario_nome: string;
  lead_funcionario_id_pdv: string | null;
  lead_funcionario_pdv_id: string | null;
  lead_funcionario_pdv_nome: string | null;
};

export type NegocioKanban = NegocioResumo;
