import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type FiltroAcessoEmpresaFuncionario = {
  id_empresa: string;
  id_funcionario?: string | { in: string[] };
};

type QueryClient = Pick<Prisma.TransactionClient, "$queryRaw" | "$executeRaw">;

type LinhaRaw = Record<string, unknown>;

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

type NegocioRowBase = LinhaRaw & {
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

type LeadRowBase = LinhaRaw & {
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

function valorStringObrigatorio(linha: LinhaRaw, chave: string): string {
  const valor = linha[chave];
  if (typeof valor === "string") return valor;
  if (valor instanceof String) return String(valor);
  throw new Error(`Campo obrigatorio ausente: ${chave}`);
}

function valorStringOuNulo(linha: LinhaRaw, chave: string): string | null {
  const valor = linha[chave];
  if (valor === null || valor === undefined) return null;
  return typeof valor === "string" ? valor : String(valor);
}

function valorNumero(linha: LinhaRaw, chave: string, padrao = 0): number {
  const valor = linha[chave];
  if (typeof valor === "number") return valor;
  if (typeof valor === "bigint") return Number(valor);
  if (typeof valor === "string" && valor.trim().length > 0) {
    const parsed = Number(valor);
    return Number.isFinite(parsed) ? parsed : padrao;
  }
  return padrao;
}

function valorBooleano(linha: LinhaRaw, chave: string): boolean {
  const valor = linha[chave];
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor !== 0;
  if (typeof valor === "string") return valor !== "0" && valor.toLowerCase() !== "false";
  return Boolean(valor);
}

function valorData(linha: LinhaRaw, chave: string): Date {
  const valor = linha[chave];
  if (valor instanceof Date) return valor;
  if (typeof valor === "string" || typeof valor === "number") {
    return new Date(valor);
  }
  throw new Error(`Campo de data obrigatorio ausente: ${chave}`);
}

function valorDataOuNulo(linha: LinhaRaw, chave: string): Date | null {
  const valor = linha[chave];
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor === "string" || typeof valor === "number") {
    return new Date(valor);
  }
  return null;
}

function idsFuncionarioDoFiltro(filtro?: FiltroAcessoEmpresaFuncionario) {
  const valor = filtro?.id_funcionario;
  if (!valor) return null;
  if (typeof valor === "string") return [valor];
  if (Array.isArray(valor.in)) return valor.in.filter(Boolean);
  return null;
}

function mapearResponsavelResumo(linha: LinhaRaw, prefixo: string): LeadResponsavelResumo {
  const idPdv = valorStringOuNulo(linha, `${prefixo}id_pdv`);
  const pdvId = valorStringOuNulo(linha, `${prefixo}pdv_id`);
  const pdvNome = valorStringOuNulo(linha, `${prefixo}pdv_nome`);

  return {
    id: valorStringObrigatorio(linha, `${prefixo}id`),
    nome: valorStringObrigatorio(linha, `${prefixo}nome`),
    id_pdv: idPdv,
    pdv: pdvId && pdvNome ? { id: pdvId, nome: pdvNome } : null,
  };
}

function mapearLeadBasico(linha: LinhaRaw, prefixo: string): LeadResumoBasico {
  return {
    id: valorStringObrigatorio(linha, `${prefixo}id`),
    id_empresa: valorStringObrigatorio(linha, `${prefixo}id_empresa`),
    id_funcionario: valorStringObrigatorio(linha, `${prefixo}id_funcionario`),
    id_pdv: valorStringOuNulo(linha, `${prefixo}id_pdv`),
    id_negocio: valorStringOuNulo(linha, `${prefixo}id_negocio`),
    id_estagio: valorStringObrigatorio(linha, `${prefixo}id_estagio`),
    nome: valorStringObrigatorio(linha, `${prefixo}nome`),
    telefone: valorStringObrigatorio(linha, `${prefixo}telefone`),
    email: valorStringOuNulo(linha, `${prefixo}email`),
    valor_oportunidade: valorNumero(linha, `${prefixo}valor_oportunidade`, 0),
    probabilidade: valorNumero(linha, `${prefixo}probabilidade`, 0),
    fonte: valorStringOuNulo(linha, `${prefixo}fonte`),
    empresa_origem: valorStringOuNulo(linha, `${prefixo}empresa_origem`),
    observacoes: valorStringOuNulo(linha, `${prefixo}observacoes`),
    motivo_perda: valorStringOuNulo(linha, `${prefixo}motivo_perda`),
    criado_em: valorData(linha, `${prefixo}criado_em`),
    atualizado_em: valorData(linha, `${prefixo}atualizado_em`),
    origem: valorStringObrigatorio(linha, `${prefixo}origem`),
    anuncio_titulo: valorStringOuNulo(linha, `${prefixo}anuncio_titulo`),
    anuncio_descricao: valorStringOuNulo(linha, `${prefixo}anuncio_descricao`),
    anuncio_url: valorStringOuNulo(linha, `${prefixo}anuncio_url`),
    dados_extras: valorStringOuNulo(linha, `${prefixo}dados_extras`),
    funcionario: mapearResponsavelResumo(linha, `${prefixo}funcionario_`),
  };
}

function mapearLeadBasicoDoRegistro(linha: LinhaRaw, prefixo = "lead_"): LeadResumoBasico {
  return mapearLeadBasico(linha, prefixo);
}

function normalizarIdsLeads(idsLeads: string[]) {
  return Array.from(new Set(idsLeads.map((id) => id.trim()).filter(Boolean)));
}

function mapearNegocioResumo(linha: NegocioRowBase, leads: LeadResumoBasico[] = []): NegocioResumo {
  const leadPrincipal = linha.lead_principal_id
    ? mapearLeadBasico(
        {
          lead_id: linha.lead_principal_id,
          lead_id_empresa: linha.lead_principal_id_empresa ?? linha.negocio_id_empresa,
          lead_id_funcionario: linha.lead_principal_id_funcionario ?? linha.negocio_id_funcionario,
          lead_id_pdv: linha.lead_principal_id_pdv ?? linha.negocio_funcionario_id_pdv,
          lead_id_negocio: linha.lead_principal_id_negocio ?? linha.negocio_id,
          lead_id_estagio: linha.lead_principal_id_estagio ?? linha.negocio_id_estagio,
          lead_nome: linha.lead_principal_nome ?? "",
          lead_telefone: linha.lead_principal_telefone ?? "",
          lead_email: linha.lead_principal_email,
          lead_valor_oportunidade: linha.lead_principal_valor_oportunidade,
          lead_probabilidade: linha.lead_principal_probabilidade,
          lead_fonte: linha.lead_principal_fonte,
          lead_empresa_origem: linha.lead_principal_empresa_origem,
          lead_observacoes: linha.lead_principal_observacoes,
          lead_motivo_perda: linha.lead_principal_motivo_perda,
          lead_criado_em: linha.lead_principal_criado_em ?? linha.negocio_criado_em,
          lead_atualizado_em: linha.lead_principal_atualizado_em ?? linha.negocio_atualizado_em,
          lead_origem: linha.lead_principal_origem ?? "MANUAL",
          lead_anuncio_titulo: linha.lead_principal_anuncio_titulo,
          lead_anuncio_descricao: linha.lead_principal_anuncio_descricao,
          lead_anuncio_url: linha.lead_principal_anuncio_url,
          lead_dados_extras: linha.lead_principal_dados_extras,
          lead_funcionario_id: linha.lead_principal_funcionario_id ?? linha.negocio_id_funcionario,
          lead_funcionario_nome: linha.lead_principal_funcionario_nome ?? linha.negocio_funcionario_nome,
          lead_funcionario_id_pdv: linha.lead_principal_funcionario_id_pdv ?? linha.negocio_funcionario_id_pdv,
          lead_funcionario_pdv_id: linha.lead_principal_funcionario_pdv_id ?? linha.negocio_funcionario_pdv_id,
          lead_funcionario_pdv_nome: linha.lead_principal_funcionario_pdv_nome ?? linha.negocio_funcionario_pdv_nome,
        },
        "lead_",
      )
    : null;

  const leadPrincipalEfetivo = leadPrincipal ?? leads[0] ?? null;

  return {
    id: linha.negocio_id,
    id_empresa: linha.negocio_id_empresa,
    id_lead: linha.negocio_id_lead,
    id_funil: linha.negocio_id_funil,
    id_estagio: linha.negocio_id_estagio,
    id_funcionario: linha.negocio_id_funcionario,
    id_produto_principal: linha.negocio_id_produto_principal,
    titulo: linha.negocio_titulo,
    valor_estimado: valorNumero(linha, "negocio_valor_estimado", 0),
    valor_fechado: linha.negocio_valor_fechado === null || linha.negocio_valor_fechado === undefined
      ? null
      : valorNumero(linha, "negocio_valor_fechado", 0),
    probabilidade: linha.negocio_probabilidade,
    status: linha.negocio_status,
    data_abertura: valorData(linha, "negocio_data_abertura"),
    data_fechamento: valorDataOuNulo(linha, "negocio_data_fechamento"),
    motivo_perda: linha.negocio_motivo_perda,
    observacoes_comerciais: linha.negocio_observacoes_comerciais,
    chave_migracao: linha.negocio_chave_migracao,
    criado_em: valorData(linha, "negocio_criado_em"),
    atualizado_em: valorData(linha, "negocio_atualizado_em"),
    lead: leadPrincipalEfetivo,
    lead_principal: leadPrincipal,
    leads,
    estagio: {
      id: linha.negocio_estagio_id,
      nome: linha.negocio_estagio_nome,
      ordem: Number(linha.negocio_estagio_ordem),
      tipo: linha.negocio_estagio_tipo,
      id_funil: linha.negocio_estagio_id_funil,
    },
    funcionario: mapearResponsavelResumo(linha, "negocio_funcionario_"),
    funil: {
      id: linha.negocio_funil_id,
      nome: linha.negocio_funil_nome,
      slug: linha.negocio_funil_slug,
      padrao: valorBooleano(linha, "negocio_funil_padrao"),
    },
    id_pdv: linha.negocio_funcionario_id_pdv,
  };
}

async function carregarLeadsDoNegocio(client: QueryClient, idsEmpresa: string, idsNegocio: string[]) {
  if (idsNegocio.length === 0) {
    return new Map<string, LeadResumoBasico[]>();
  }

  const rows = await client.$queryRaw<LeadRowBase[]>(Prisma.sql`
    SELECT
      l.id AS lead_id,
      l.id_empresa AS lead_id_empresa,
      l.id_funcionario AS lead_id_funcionario,
      l.id_pdv AS lead_id_pdv,
      l.id_negocio AS lead_id_negocio,
      l.id_estagio AS lead_id_estagio,
      l.nome AS lead_nome,
      l.telefone AS lead_telefone,
      l.email AS lead_email,
      l.valor_oportunidade AS lead_valor_oportunidade,
      l.probabilidade AS lead_probabilidade,
      l.fonte AS lead_fonte,
      l.empresa_origem AS lead_empresa_origem,
      l.observacoes AS lead_observacoes,
      l.motivo_perda AS lead_motivo_perda,
      l.criado_em AS lead_criado_em,
      l.atualizado_em AS lead_atualizado_em,
      l.origem AS lead_origem,
      l.anuncio_titulo AS lead_anuncio_titulo,
      l.anuncio_descricao AS lead_anuncio_descricao,
      l.anuncio_url AS lead_anuncio_url,
      l.dados_extras AS lead_dados_extras,
      f.id AS lead_funcionario_id,
      f.nome AS lead_funcionario_nome,
      f.id_pdv AS lead_funcionario_id_pdv,
      pf.id AS lead_funcionario_pdv_id,
      pf.nome AS lead_funcionario_pdv_nome
    FROM Lead l
    JOIN Funcionario f ON f.id = l.id_funcionario
    LEFT JOIN Pdv pf ON pf.id = f.id_pdv
    WHERE l.id_empresa = ${idsEmpresa}
      AND l.id_negocio IN (${Prisma.join(idsNegocio.map((id) => Prisma.sql`${id}`))})
    ORDER BY l.criado_em ASC
  `);

  const mapa = new Map<string, LeadResumoBasico[]>();
  for (const linha of rows) {
    const lead = mapearLeadBasicoDoRegistro(linha, "lead_");
    const idNegocio = lead.id_negocio;
    if (!idNegocio) continue;
    const lista = mapa.get(idNegocio) ?? [];
    lista.push(lead);
    mapa.set(idNegocio, lista);
  }

  return mapa;
}

async function carregarNegociosResumo(client: QueryClient, params: {
  idEmpresa: string;
  where?: FiltroAcessoEmpresaFuncionario;
  idFunil?: string;
  idsNegocio?: string[];
}) {
  const condicoes: Prisma.Sql[] = [Prisma.sql`${Prisma.raw("n.id_empresa")} = ${params.idEmpresa}`];

  const idsFuncionarios = idsFuncionarioDoFiltro(params.where);
  if (idsFuncionarios && idsFuncionarios.length > 0) {
    condicoes.push(
      Prisma.sql`${Prisma.raw("n.id_funcionario")} IN (${Prisma.join(idsFuncionarios.map((id) => Prisma.sql`${id}`))})`,
    );
  }

  if (params.idFunil) {
    condicoes.push(Prisma.sql`${Prisma.raw("n.id_funil")} = ${params.idFunil}`);
  }

  if (params.idsNegocio && params.idsNegocio.length > 0) {
    condicoes.push(
      Prisma.sql`${Prisma.raw("n.id")} IN (${Prisma.join(params.idsNegocio.map((id) => Prisma.sql`${id}`))})`,
    );
  }

  const whereSql = Prisma.join(condicoes, " AND ");

  const rows = await client.$queryRaw<NegocioRowBase[]>(Prisma.sql`
    SELECT
      n.id AS negocio_id,
      n.id_empresa AS negocio_id_empresa,
      n.id_lead AS negocio_id_lead,
      n.id_funil AS negocio_id_funil,
      n.id_estagio AS negocio_id_estagio,
      n.id_funcionario AS negocio_id_funcionario,
      n.id_produto_principal AS negocio_id_produto_principal,
      n.titulo AS negocio_titulo,
      n.valor_estimado AS negocio_valor_estimado,
      n.valor_fechado AS negocio_valor_fechado,
      n.probabilidade AS negocio_probabilidade,
      n.status AS negocio_status,
      n.data_abertura AS negocio_data_abertura,
      n.data_fechamento AS negocio_data_fechamento,
      n.motivo_perda AS negocio_motivo_perda,
      n.observacoes_comerciais AS negocio_observacoes_comerciais,
      n.chave_migracao AS negocio_chave_migracao,
      n.criado_em AS negocio_criado_em,
      n.atualizado_em AS negocio_atualizado_em,
      f.id AS negocio_funcionario_id,
      f.nome AS negocio_funcionario_nome,
      f.id_pdv AS negocio_funcionario_id_pdv,
      pf.id AS negocio_funcionario_pdv_id,
      pf.nome AS negocio_funcionario_pdv_nome,
      e.id AS negocio_estagio_id,
      e.nome AS negocio_estagio_nome,
      CAST(e.ordem AS INTEGER) AS negocio_estagio_ordem,
      e.tipo AS negocio_estagio_tipo,
      e.id_funil AS negocio_estagio_id_funil,
      fu.id AS negocio_funil_id,
      fu.nome AS negocio_funil_nome,
      fu.slug AS negocio_funil_slug,
      fu.padrao AS negocio_funil_padrao,
      lp.id AS lead_principal_id,
      lp.id_empresa AS lead_principal_id_empresa,
      lp.id_funcionario AS lead_principal_id_funcionario,
      lp.id_pdv AS lead_principal_id_pdv,
      lp.id_negocio AS lead_principal_id_negocio,
      lp.id_estagio AS lead_principal_id_estagio,
      lp.nome AS lead_principal_nome,
      lp.telefone AS lead_principal_telefone,
      lp.email AS lead_principal_email,
      lp.valor_oportunidade AS lead_principal_valor_oportunidade,
      lp.probabilidade AS lead_principal_probabilidade,
      lp.fonte AS lead_principal_fonte,
      lp.empresa_origem AS lead_principal_empresa_origem,
      lp.observacoes AS lead_principal_observacoes,
      lp.motivo_perda AS lead_principal_motivo_perda,
      lp.criado_em AS lead_principal_criado_em,
      lp.atualizado_em AS lead_principal_atualizado_em,
      lp.origem AS lead_principal_origem,
      lp.anuncio_titulo AS lead_principal_anuncio_titulo,
      lp.anuncio_descricao AS lead_principal_anuncio_descricao,
      lp.anuncio_url AS lead_principal_anuncio_url,
      lp.dados_extras AS lead_principal_dados_extras,
      lpf.id AS lead_principal_funcionario_id,
      lpf.nome AS lead_principal_funcionario_nome,
      lpf.id_pdv AS lead_principal_funcionario_id_pdv,
      lpp.id AS lead_principal_funcionario_pdv_id,
      lpp.nome AS lead_principal_funcionario_pdv_nome
    FROM Negocio n
    JOIN Funcionario f ON f.id = n.id_funcionario
    LEFT JOIN Pdv pf ON pf.id = f.id_pdv
    JOIN EstagioFunil e ON e.id = n.id_estagio
    JOIN Funil fu ON fu.id = n.id_funil
    LEFT JOIN Lead lp ON lp.id = n.id_lead
    LEFT JOIN Funcionario lpf ON lpf.id = lp.id_funcionario
    LEFT JOIN Pdv lpp ON lpp.id = lpf.id_pdv
    WHERE ${whereSql}
    ORDER BY n.atualizado_em DESC
  `);

  const idsNegocio = rows.map((linha) => linha.negocio_id);
  const leadsPorNegocio = await carregarLeadsDoNegocio(client, params.idEmpresa, idsNegocio);

  return rows.map((linha) => {
    const leads = leadsPorNegocio.get(linha.negocio_id) ?? [];
    return mapearNegocioResumo(linha, leads);
  });
}

async function obterNegocioBasePorId(params: {
  client?: QueryClient;
  idEmpresa: string;
  idNegocio: string;
  whereExtra?: FiltroAcessoEmpresaFuncionario;
}) {
  const client = params.client ?? prisma;
  const negocios = await carregarNegociosResumo(client, {
    idEmpresa: params.idEmpresa,
    idFunil: undefined,
    idsNegocio: [params.idNegocio],
    where: params.whereExtra,
  });

  return negocios[0] ?? null;
}

async function obterLeadsAtivosDisponiveis(client: QueryClient, params: {
  idEmpresa: string;
  idsLeads: string[];
}) {
  const idsLeads = normalizarIdsLeads(params.idsLeads);
  if (idsLeads.length === 0) return [];

  const leads = await client.$queryRaw<LeadRowBase[]>(Prisma.sql`
    SELECT
      l.id AS lead_id,
      l.id_empresa AS lead_id_empresa,
      l.id_funcionario AS lead_id_funcionario,
      l.id_pdv AS lead_id_pdv,
      l.id_negocio AS lead_id_negocio,
      l.id_estagio AS lead_id_estagio,
      l.nome AS lead_nome,
      l.telefone AS lead_telefone,
      l.email AS lead_email,
      l.valor_oportunidade AS lead_valor_oportunidade,
      l.probabilidade AS lead_probabilidade,
      l.fonte AS lead_fonte,
      l.empresa_origem AS lead_empresa_origem,
      l.observacoes AS lead_observacoes,
      l.motivo_perda AS lead_motivo_perda,
      l.criado_em AS lead_criado_em,
      l.atualizado_em AS lead_atualizado_em,
      l.origem AS lead_origem,
      l.anuncio_titulo AS lead_anuncio_titulo,
      l.anuncio_descricao AS lead_anuncio_descricao,
      l.anuncio_url AS lead_anuncio_url,
      l.dados_extras AS lead_dados_extras,
      f.id AS lead_funcionario_id,
      f.nome AS lead_funcionario_nome,
      f.id_pdv AS lead_funcionario_id_pdv,
      pf.id AS lead_funcionario_pdv_id,
      pf.nome AS lead_funcionario_pdv_nome
    FROM Lead l
    JOIN Funcionario f ON f.id = l.id_funcionario
    LEFT JOIN Pdv pf ON pf.id = f.id_pdv
    WHERE l.id_empresa = ${params.idEmpresa}
      AND l.id IN (${Prisma.join(idsLeads.map((id) => Prisma.sql`${id}`))})
    ORDER BY l.criado_em ASC
  `);

  if (leads.length !== idsLeads.length) {
    return null;
  }

  return leads;
}

async function obterLeadsVinculadosAoNegocio(client: QueryClient, params: {
  idEmpresa: string;
  idNegocio: string;
}) {
  const leads = await client.$queryRaw<LeadRowBase[]>(Prisma.sql`
    SELECT
      l.id AS lead_id,
      l.id_empresa AS lead_id_empresa,
      l.id_funcionario AS lead_id_funcionario,
      l.id_pdv AS lead_id_pdv,
      l.id_negocio AS lead_id_negocio,
      l.id_estagio AS lead_id_estagio,
      l.nome AS lead_nome,
      l.telefone AS lead_telefone,
      l.email AS lead_email,
      l.valor_oportunidade AS lead_valor_oportunidade,
      l.probabilidade AS lead_probabilidade,
      l.fonte AS lead_fonte,
      l.empresa_origem AS lead_empresa_origem,
      l.observacoes AS lead_observacoes,
      l.motivo_perda AS lead_motivo_perda,
      l.criado_em AS lead_criado_em,
      l.atualizado_em AS lead_atualizado_em,
      l.origem AS lead_origem,
      l.anuncio_titulo AS lead_anuncio_titulo,
      l.anuncio_descricao AS lead_anuncio_descricao,
      l.anuncio_url AS lead_anuncio_url,
      l.dados_extras AS lead_dados_extras,
      f.id AS lead_funcionario_id,
      f.nome AS lead_funcionario_nome,
      f.id_pdv AS lead_funcionario_id_pdv,
      pf.id AS lead_funcionario_pdv_id,
      pf.nome AS lead_funcionario_pdv_nome
    FROM Lead l
    JOIN Funcionario f ON f.id = l.id_funcionario
    LEFT JOIN Pdv pf ON pf.id = f.id_pdv
    WHERE l.id_empresa = ${params.idEmpresa}
      AND l.id_negocio = ${params.idNegocio}
    ORDER BY l.criado_em ASC
  `);

  return leads;
}

async function recalcularPrincipalDoNegocio(client: QueryClient, params: {
  idEmpresa: string;
  idNegocio: string;
}) {
  const principal = await client.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id
    FROM Lead
    WHERE id_empresa = ${params.idEmpresa}
      AND id_negocio = ${params.idNegocio}
    ORDER BY criado_em ASC
    LIMIT 1
  `);

  await client.$executeRaw(Prisma.sql`
    UPDATE Negocio
    SET id_lead = ${principal[0]?.id ?? null},
        atualizado_em = ${new Date()}
    WHERE id = ${params.idNegocio}
      AND id_empresa = ${params.idEmpresa}
  `);
}

export async function listarFunisDaEmpresa(idEmpresa: string) {
  return prisma.funil.findMany({
    where: { id_empresa: idEmpresa, ativo: true },
    orderBy: [{ padrao: "desc" }, { ordem: "asc" }, { nome: "asc" }],
  });
}

export async function obterFunilPadrao(idEmpresa: string) {
  return prisma.funil.findFirst({
    where: { id_empresa: idEmpresa, ativo: true },
    orderBy: [{ padrao: "desc" }, { ordem: "asc" }, { criado_em: "asc" }],
  });
}

export async function listarEstagiosDoFunil(idEmpresa: string, idFunil?: string) {
  const funil = idFunil
    ? await prisma.funil.findFirst({
        where: { id: idFunil, id_empresa: idEmpresa, ativo: true },
      })
    : await obterFunilPadrao(idEmpresa);

  if (!funil) {
    return {
      funil: null,
      estagios: [] as Array<{
        id: string;
        id_empresa: string;
        id_funil: string;
        nome: string;
        ordem: bigint;
        tipo: string;
        criado_em: Date;
        atualizado_em: Date;
      }>,
    };
  }

  const estagios = await prisma.estagioFunil.findMany({
    where: {
      id_empresa: idEmpresa,
      id_funil: funil.id,
    },
    orderBy: { ordem: "asc" },
  });

  return { funil, estagios };
}

export async function listarNegociosKanban(params: {
  sessao: {
    id_empresa: string;
  };
  where: FiltroAcessoEmpresaFuncionario;
  idFunil?: string;
}) {
  const { funil, estagios } = await listarEstagiosDoFunil(params.sessao.id_empresa, params.idFunil);

  const negocios = await carregarNegociosResumo(prisma, {
    idEmpresa: params.sessao.id_empresa,
    where: params.where,
    idFunil: funil ? funil.id : undefined,
  });

  return { funil, estagios, negocios };
}

export async function obterNegocioPorId(params: {
  idEmpresa: string;
  idNegocio: string;
  whereExtra?: FiltroAcessoEmpresaFuncionario;
}) {
  return obterNegocioBasePorId({
    idEmpresa: params.idEmpresa,
    idNegocio: params.idNegocio,
    whereExtra: params.whereExtra,
  });
}

export async function buscarNegociosResumoPorIds(params: {
  idEmpresa: string;
  idsNegocio: string[];
}) {
  return carregarNegociosResumo(prisma, {
    idEmpresa: params.idEmpresa,
    idsNegocio: params.idsNegocio,
  });
}

async function validarLeadsVinculaveis(params: {
  tx: Prisma.TransactionClient;
  idEmpresa: string;
  idsLeads: string[];
}) {
  const leads = await obterLeadsAtivosDisponiveis(params.tx, {
    idEmpresa: params.idEmpresa,
    idsLeads: params.idsLeads,
  });

  if (!leads) return null;
  return leads;
}

async function obterNegocioExistente(client: QueryClient, params: {
  idEmpresa: string;
  idNegocio: string;
}) {
  const rows = await client.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id
    FROM Negocio
    WHERE id = ${params.idNegocio}
      AND id_empresa = ${params.idEmpresa}
    LIMIT 1
  `);

  return rows[0] ?? null;
}

export async function criarNegocio(params: {
  idEmpresa: string;
  idFunil?: string;
  idEstagio: string;
  idFuncionario: string;
  titulo: string;
  valorEstimado: number;
  leadIds?: string[];
  probabilidade?: number;
  observacoesComerciais?: string | null;
  motivoPerda?: string | null;
}) {
  const estagio = await prisma.estagioFunil.findFirst({
    where: { id: params.idEstagio, id_empresa: params.idEmpresa },
    include: Prisma.validator<Prisma.EstagioFunilInclude>()({ Funil: true }),
  });

  if (!estagio) {
    return null;
  }

  const funil = params.idFunil
    ? await prisma.funil.findFirst({
        where: { id: params.idFunil, id_empresa: params.idEmpresa, ativo: true },
      })
    : estagio.Funil;

  if (!funil || funil.id !== estagio.id_funil) {
    return null;
  }

  const leadIdsNormalizados = normalizarIdsLeads(params.leadIds ?? []);

  return prisma.$transaction(async (tx) => {
    const leadsVinculaveis = leadIdsNormalizados.length > 0
      ? await validarLeadsVinculaveis({ tx, idEmpresa: params.idEmpresa, idsLeads: leadIdsNormalizados })
      : [];

    if (leadsVinculaveis === null) {
      throw new Error("Um ou mais leads selecionados sao invalidos.");
    }

    const idLeadPrincipal = leadsVinculaveis[0]?.id ?? null;

    const negocioId = randomUUID();
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO Negocio (
        id,
        id_empresa,
        id_lead,
        id_funil,
        id_estagio,
        id_funcionario,
        id_produto_principal,
        titulo,
        valor_estimado,
        valor_fechado,
        probabilidade,
        status,
        data_abertura,
        data_fechamento,
        motivo_perda,
        observacoes_comerciais,
        chave_migracao,
        criado_em,
        atualizado_em
      ) VALUES (
        ${negocioId},
        ${params.idEmpresa},
        ${idLeadPrincipal},
        ${funil.id},
        ${estagio.id},
        ${params.idFuncionario},
        ${null},
        ${params.titulo.trim()},
        ${params.valorEstimado},
        ${null},
        ${params.probabilidade ?? null},
        ${estagio.tipo === "PERDIDO" ? "PERDIDO" : estagio.tipo === "GANHO" ? "GANHO" : "ABERTO"},
        ${new Date()},
        ${estagio.tipo === "ABERTO" ? null : new Date()},
        ${estagio.tipo === "PERDIDO" ? params.motivoPerda?.trim() ?? null : null},
        ${params.observacoesComerciais?.trim() ?? null},
        ${null},
        ${new Date()},
        ${new Date()}
      )
    `);

    if (leadsVinculaveis.length > 0) {
      const leadsParaAtualizar = leadsVinculaveis.map((lead) => lead.lead_id);
      const antigosNegocios = Array.from(
        new Set(
          leadsVinculaveis
            .map((lead) => lead.lead_id_negocio)
            .filter((idNegocio): idNegocio is string => Boolean(idNegocio) && idNegocio !== negocioId),
        ),
      );

      await tx.$executeRaw(Prisma.sql`
        UPDATE Lead
        SET id_negocio = ${negocioId},
            atualizado_em = ${new Date()}
        WHERE id_empresa = ${params.idEmpresa}
          AND id IN (${Prisma.join(leadsParaAtualizar.map((id) => Prisma.sql`${id}`))})
      `);

      for (const idNegocioAntigo of antigosNegocios) {
        await recalcularPrincipalDoNegocio(tx, {
          idEmpresa: params.idEmpresa,
          idNegocio: idNegocioAntigo,
        });
      }
    }

    await recalcularPrincipalDoNegocio(tx, {
      idEmpresa: params.idEmpresa,
      idNegocio: negocioId,
    });

    return obterNegocioBasePorId({
      client: tx,
      idEmpresa: params.idEmpresa,
      idNegocio: negocioId,
    });
  });
}

export async function atualizarNegocio(params: {
  idEmpresa: string;
  idNegocio: string;
  titulo?: string;
  valorEstimado?: number;
  valorFechado?: number | null;
  probabilidade?: number;
  motivoPerda?: string | null;
  idFuncionario?: string;
  idFunil?: string;
  idEstagio?: string;
  status?: "ABERTO" | "GANHO" | "PERDIDO";
  observacoesComerciais?: string | null;
}) {
  const negocioExistente = await obterNegocioBasePorId({
    idEmpresa: params.idEmpresa,
    idNegocio: params.idNegocio,
  });

  if (!negocioExistente) {
    return null;
  }

  if (params.idFunil) {
    const funil = await prisma.funil.findFirst({
      where: { id: params.idFunil, id_empresa: params.idEmpresa, ativo: true },
      select: { id: true },
    });
    if (!funil) {
      throw new Error("Funil invalido.");
    }
  }

  if (params.idEstagio) {
    const estagio = await prisma.estagioFunil.findFirst({
      where: {
        id: params.idEstagio,
        id_empresa: params.idEmpresa,
        ...(params.idFunil ? { id_funil: params.idFunil } : {}),
      },
      select: { id: true, tipo: true, id_funil: true },
    });

    if (!estagio) {
      throw new Error("Estagio invalido.");
    }
  }

  if (params.idFuncionario) {
    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: params.idFuncionario,
        id_empresa: params.idEmpresa,
        ativo: true,
      },
      select: { id: true },
    });

    if (!funcionario) {
      throw new Error("Funcionario invalido.");
    }
  }

  const campos: Prisma.Sql[] = [];
  if (params.titulo !== undefined) campos.push(Prisma.sql`${Prisma.raw("titulo")} = ${params.titulo.trim()}`);
  if (params.valorEstimado !== undefined) campos.push(Prisma.sql`${Prisma.raw("valor_estimado")} = ${params.valorEstimado}`);
  if (params.valorFechado !== undefined) campos.push(Prisma.sql`${Prisma.raw("valor_fechado")} = ${params.valorFechado}`);
  if (params.probabilidade !== undefined) campos.push(Prisma.sql`${Prisma.raw("probabilidade")} = ${params.probabilidade}`);
  if (params.motivoPerda !== undefined) campos.push(Prisma.sql`${Prisma.raw("motivo_perda")} = ${params.motivoPerda?.trim() ?? null}`);
  if (params.idFuncionario !== undefined) campos.push(Prisma.sql`${Prisma.raw("id_funcionario")} = ${params.idFuncionario}`);
  if (params.idFunil !== undefined) campos.push(Prisma.sql`${Prisma.raw("id_funil")} = ${params.idFunil}`);
  if (params.idEstagio !== undefined) campos.push(Prisma.sql`${Prisma.raw("id_estagio")} = ${params.idEstagio}`);
  if (params.status !== undefined) campos.push(Prisma.sql`${Prisma.raw("status")} = ${params.status}`);
  if (params.observacoesComerciais !== undefined) {
    campos.push(Prisma.sql`${Prisma.raw("observacoes_comerciais")} = ${params.observacoesComerciais?.trim() ?? null}`);
  }
  campos.push(Prisma.sql`${Prisma.raw("atualizado_em")} = ${new Date()}`);

  await prisma.$executeRaw(Prisma.sql`
    UPDATE Negocio
    SET ${Prisma.join(campos, ", ")}
    WHERE id = ${params.idNegocio}
      AND id_empresa = ${params.idEmpresa}
  `);

  return obterNegocioBasePorId({
    client: prisma,
    idEmpresa: params.idEmpresa,
    idNegocio: params.idNegocio,
  });
}

export async function moverNegocioDeEstagio(params: {
  idEmpresa: string;
  idNegocio: string;
  idEstagioDestino: string;
  motivoPerda?: string | null;
}) {
  const negocioAtual = await obterNegocioBasePorId({
    idEmpresa: params.idEmpresa,
    idNegocio: params.idNegocio,
  });

  if (!negocioAtual) {
    return null;
  }

  const estagioDestino = await prisma.estagioFunil.findFirst({
    where: {
      id: params.idEstagioDestino,
      id_empresa: params.idEmpresa,
    },
    include: Prisma.validator<Prisma.EstagioFunilInclude>()({ Funil: true }),
  });

  if (!estagioDestino) {
    return null;
  }

  if (negocioAtual.id_estagio === estagioDestino.id) {
    return {
      negocio: negocioAtual,
      noop: true,
    };
  }

  const statusNovo = estagioDestino.tipo === "GANHO"
    ? "GANHO"
    : estagioDestino.tipo === "PERDIDO"
      ? "PERDIDO"
      : "ABERTO";

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      UPDATE Negocio
      SET id_funil = ${estagioDestino.id_funil},
          id_estagio = ${estagioDestino.id},
          status = ${statusNovo},
          motivo_perda = ${statusNovo === "PERDIDO" ? params.motivoPerda?.trim() ?? null : null},
          data_fechamento = ${statusNovo === "ABERTO" ? null : new Date()},
          valor_fechado = ${statusNovo === "GANHO" ? negocioAtual.valor_estimado : negocioAtual.valor_fechado},
          atualizado_em = ${new Date()}
      WHERE id = ${params.idNegocio}
        AND id_empresa = ${params.idEmpresa}
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO NegocioEstagioLog (
        id,
        id_negocio,
        id_funil_anterior,
        id_funil_novo,
        id_estagio_anterior,
        id_estagio_novo,
        empresa_id,
        origem,
        criado_em
      ) VALUES (
        ${randomUUID()},
        ${params.idNegocio},
        ${negocioAtual.id_funil},
        ${estagioDestino.id_funil},
        ${negocioAtual.id_estagio},
        ${estagioDestino.id},
        ${params.idEmpresa},
        ${"KANBAN"},
        ${new Date()}
      )
    `);
  });

  return {
    negocio: await obterNegocioBasePorId({
      idEmpresa: params.idEmpresa,
      idNegocio: params.idNegocio,
    }),
    noop: false,
  };
}

export async function vincularLeadsAoNegocio(params: {
  idEmpresa: string;
  idNegocio: string;
  leadIds: string[];
}) {
  const leadIds = normalizarIdsLeads(params.leadIds);
  if (leadIds.length === 0) {
    return obterNegocioBasePorId({
      client: prisma,
      idEmpresa: params.idEmpresa,
      idNegocio: params.idNegocio,
    });
  }

  return prisma.$transaction(async (tx) => {
    const negocio = await obterNegocioExistente(tx, {
      idEmpresa: params.idEmpresa,
      idNegocio: params.idNegocio,
    });

    if (!negocio) {
      return null;
    }

    const leads = await obterLeadsAtivosDisponiveis(tx, {
      idEmpresa: params.idEmpresa,
      idsLeads: leadIds,
    });

    if (!leads) {
      throw new Error("Um ou mais leads informados sao invalidos.");
    }

    const leadsParaTransferir = leads.map((lead) => lead.lead_id);
    const negociosAnteriores = Array.from(
      new Set(
        leads
          .map((lead) => lead.lead_id_negocio)
          .filter((idNegocio): idNegocio is string => Boolean(idNegocio) && idNegocio !== params.idNegocio),
      ),
    );

    await tx.$executeRaw(Prisma.sql`
      UPDATE Lead
      SET id_negocio = ${params.idNegocio},
          atualizado_em = ${new Date()}
      WHERE id_empresa = ${params.idEmpresa}
        AND id IN (${Prisma.join(leadsParaTransferir.map((id) => Prisma.sql`${id}`))})
    `);

    await recalcularPrincipalDoNegocio(tx, {
      idEmpresa: params.idEmpresa,
      idNegocio: params.idNegocio,
    });

    for (const idNegocioAnterior of negociosAnteriores) {
      await recalcularPrincipalDoNegocio(tx, {
        idEmpresa: params.idEmpresa,
        idNegocio: idNegocioAnterior,
      });
    }

    return obterNegocioBasePorId({
      client: tx,
      idEmpresa: params.idEmpresa,
      idNegocio: params.idNegocio,
    });
  });
}

export async function desvincularLeadsDoNegocio(params: {
  idEmpresa: string;
  idNegocio: string;
  leadIds: string[];
}) {
  const leadIds = normalizarIdsLeads(params.leadIds);
  if (leadIds.length === 0) {
    return obterNegocioBasePorId({
      client: prisma,
      idEmpresa: params.idEmpresa,
      idNegocio: params.idNegocio,
    });
  }

  return prisma.$transaction(async (tx) => {
    const negocio = await obterNegocioExistente(tx, {
      idEmpresa: params.idEmpresa,
      idNegocio: params.idNegocio,
    });

    if (!negocio) {
      return null;
    }

    const leadsDoNegocio = await obterLeadsVinculadosAoNegocio(tx, {
      idEmpresa: params.idEmpresa,
      idNegocio: params.idNegocio,
    });

    const idsParaRemover = new Set(leadIds);
    const leadsAfetados = leadsDoNegocio.filter((lead) => idsParaRemover.has(lead.lead_id));

    if (leadsAfetados.length === 0) {
      return obterNegocioBasePorId({
        client: tx,
        idEmpresa: params.idEmpresa,
        idNegocio: params.idNegocio,
      });
    }

    await tx.$executeRaw(Prisma.sql`
      UPDATE Lead
      SET id_negocio = ${null},
          atualizado_em = ${new Date()}
      WHERE id_empresa = ${params.idEmpresa}
        AND id_negocio = ${params.idNegocio}
        AND id IN (${Prisma.join(Array.from(idsParaRemover).map((id) => Prisma.sql`${id}`))})
    `);

    await recalcularPrincipalDoNegocio(tx, {
      idEmpresa: params.idEmpresa,
      idNegocio: params.idNegocio,
    });

    return obterNegocioBasePorId({
      client: tx,
      idEmpresa: params.idEmpresa,
      idNegocio: params.idNegocio,
    });
  });
}

export async function listarNegociosPrincipaisDoLead(params: {
  idEmpresa: string;
  idLead: string;
  client?: QueryClient;
}) {
  const client = params.client ?? prisma;

  return client.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id
    FROM Negocio
    WHERE id_empresa = ${params.idEmpresa}
      AND id_lead = ${params.idLead}
    ORDER BY criado_em ASC
  `);
}

export async function desativarNegocio(params: {
  idEmpresa: string;
  idNegocio: string;
  removerLeadsVinculados?: boolean;
  client?: QueryClient;
}) {
  const client = params.client ?? prisma;
  const negocio = await obterNegocioBasePorId({
    client,
    idEmpresa: params.idEmpresa,
    idNegocio: params.idNegocio,
  });

  if (!negocio) {
    return null;
  }

  const idsLeadsVinculados = Array.from(
    new Set([
      ...negocio.leads.map((lead) => lead.id),
      ...(negocio.lead_principal ? [negocio.lead_principal.id] : []),
    ]),
  );

  const agora = new Date();

  if (idsLeadsVinculados.length > 0) {
    await client.$executeRaw(Prisma.sql`
      UPDATE Lead
      SET id_negocio = ${null},
          atualizado_em = ${agora}
      WHERE id_empresa = ${params.idEmpresa}
        AND id_negocio = ${params.idNegocio}
        AND id IN (${Prisma.join(idsLeadsVinculados.map((id) => Prisma.sql`${id}`))})
    `);

    if (params.removerLeadsVinculados) {
      await client.$executeRaw(Prisma.sql`
        DELETE FROM Lead
        WHERE id_empresa = ${params.idEmpresa}
          AND id IN (${Prisma.join(idsLeadsVinculados.map((id) => Prisma.sql`${id}`))})
      `);
    }
  }

  await client.$executeRaw(Prisma.sql`
    DELETE FROM Negocio
    WHERE id = ${params.idNegocio}
      AND id_empresa = ${params.idEmpresa}
  `);

  return {
    negocio,
    leadsVinculados: idsLeadsVinculados,
  };
}

export type NegocioKanban = NegocioResumo;

export function montarDtoNegocio(negocio: NegocioResumo) {
  return negocio;
}

export async function criarNegocioComLead(params: {
  idEmpresa: string;
  idEstagio: string;
  idFuncionario: string;
  nome: string;
  telefone: string;
  valorEstimado: number;
  probabilidade?: number;
  fonte?: string;
  empresaOrigem?: string;
  titulo?: string;
}) {
  const negocio = await criarNegocio({
    idEmpresa: params.idEmpresa,
    idEstagio: params.idEstagio,
    idFuncionario: params.idFuncionario,
    titulo: params.titulo?.trim() || `Negocio inicial - ${params.nome}`,
    valorEstimado: params.valorEstimado,
    leadIds: [],
    probabilidade: params.probabilidade,
  });

  if (!negocio) {
    return null;
  }

  return { lead: null, negocio };
}
