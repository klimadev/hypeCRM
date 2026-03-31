import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obterEstagioIndefinido } from "@/lib/estagios-fixos";
import { obterNegocioPorId, type NegocioResumo, type LeadResumoBasico } from "@/lib/negocios";

type FiltroAcessoLead = {
  id_empresa: string;
  id_funcionario?: string | { in: string[] };
};

type LinhaRaw = Record<string, unknown>;
type QueryClient = Pick<Prisma.TransactionClient, "$queryRaw" | "$executeRaw">;

export type LeadContato = LeadResumoBasico & {
  negocio: NegocioResumo | null;
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

function valorData(linha: LinhaRaw, chave: string): Date {
  const valor = linha[chave];
  if (valor instanceof Date) return valor;
  if (typeof valor === "string" || typeof valor === "number") {
    return new Date(valor);
  }
  throw new Error(`Campo de data obrigatorio ausente: ${chave}`);
}

function idsFuncionarioDoFiltro(filtro?: FiltroAcessoLead) {
  const valor = filtro?.id_funcionario;
  if (!valor) return null;
  if (typeof valor === "string") return [valor];
  if (Array.isArray(valor.in)) return valor.in.filter(Boolean);
  return null;
}

function montarFiltroAcesso(alias: string, filtro: FiltroAcessoLead, extras: Prisma.Sql[] = []) {
  const condicoes: Prisma.Sql[] = [
    Prisma.sql`${Prisma.raw(`${alias}.id_empresa`)} = ${filtro.id_empresa}`,
  ];

  const idsFuncionarios = idsFuncionarioDoFiltro(filtro);
  if (idsFuncionarios && idsFuncionarios.length > 0) {
    condicoes.push(
      Prisma.sql`${Prisma.raw(`${alias}.id_funcionario`)} IN (${Prisma.join(idsFuncionarios.map((id) => Prisma.sql`${id}`))})`,
    );
  }

  condicoes.push(...extras);
  return Prisma.join(condicoes, " AND ");
}

function mapearLeadContato(linha: LinhaRaw): LeadContato {
  return {
    id: valorStringObrigatorio(linha, "lead_id"),
    id_empresa: valorStringObrigatorio(linha, "lead_id_empresa"),
    id_funcionario: valorStringObrigatorio(linha, "lead_id_funcionario"),
    id_pdv: valorStringOuNulo(linha, "lead_id_pdv"),
    id_negocio: valorStringOuNulo(linha, "lead_id_negocio"),
    id_estagio: valorStringObrigatorio(linha, "lead_id_estagio"),
    nome: valorStringObrigatorio(linha, "lead_nome"),
    telefone: valorStringObrigatorio(linha, "lead_telefone"),
    email: valorStringOuNulo(linha, "lead_email"),
    valor_oportunidade: valorNumero(linha, "lead_valor_oportunidade", 0),
    probabilidade: valorNumero(linha, "lead_probabilidade", 0),
    fonte: valorStringOuNulo(linha, "lead_fonte"),
    empresa_origem: valorStringOuNulo(linha, "lead_empresa_origem"),
    observacoes: valorStringOuNulo(linha, "lead_observacoes"),
    motivo_perda: valorStringOuNulo(linha, "lead_motivo_perda"),
    criado_em: valorData(linha, "lead_criado_em"),
    atualizado_em: valorData(linha, "lead_atualizado_em"),
    origem: valorStringObrigatorio(linha, "lead_origem"),
    anuncio_titulo: valorStringOuNulo(linha, "lead_anuncio_titulo"),
    anuncio_descricao: valorStringOuNulo(linha, "lead_anuncio_descricao"),
    anuncio_url: valorStringOuNulo(linha, "lead_anuncio_url"),
    dados_extras: valorStringOuNulo(linha, "lead_dados_extras"),
    funcionario: {
      id: valorStringObrigatorio(linha, "lead_funcionario_id"),
      nome: valorStringObrigatorio(linha, "lead_funcionario_nome"),
      id_pdv: valorStringOuNulo(linha, "lead_funcionario_id_pdv"),
      pdv: valorStringOuNulo(linha, "lead_funcionario_pdv_id") && valorStringOuNulo(linha, "lead_funcionario_pdv_nome")
        ? {
            id: valorStringObrigatorio(linha, "lead_funcionario_pdv_id"),
            nome: valorStringObrigatorio(linha, "lead_funcionario_pdv_nome"),
          }
        : null,
    },
    negocio: null,
  };
}

export async function listarLeadsContato(params: {
  idEmpresa: string;
  where?: FiltroAcessoLead;
  somenteAtivos?: boolean;
  client?: QueryClient;
}) {
  const where = params.where ?? { id_empresa: params.idEmpresa };
  const client = params.client ?? prisma;

  const rows = await client.$queryRaw<LinhaRaw[]>(Prisma.sql`
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
      l.ativo AS lead_ativo,
      f.id AS lead_funcionario_id,
      f.nome AS lead_funcionario_nome,
      f.id_pdv AS lead_funcionario_id_pdv,
      pf.id AS lead_funcionario_pdv_id,
      pf.nome AS lead_funcionario_pdv_nome
    FROM Lead l
    JOIN Funcionario f ON f.id = l.id_funcionario
    LEFT JOIN Pdv pf ON pf.id = f.id_pdv
    WHERE ${montarFiltroAcesso("l", where, params.somenteAtivos === false ? [] : [Prisma.sql`l.ativo = 1`])}
    ORDER BY l.atualizado_em DESC
  `);

  return rows.map(mapearLeadContato);
}

export async function obterLeadContatoPorId(params: {
  idEmpresa: string;
  idLead: string;
  where?: FiltroAcessoLead;
  somenteAtivos?: boolean;
  client?: QueryClient;
}) {
  const leads = await listarLeadsContato({
    idEmpresa: params.idEmpresa,
    where: params.where ? params.where : { id_empresa: params.idEmpresa },
    somenteAtivos: params.somenteAtivos,
    client: params.client,
  });

  return leads.find((lead) => lead.id === params.idLead) ?? null;
}

export async function criarLeadContato(params: {
  idEmpresa: string;
  idFuncionario: string;
  nome: string;
  telefone: string;
  email?: string | null;
  fonte?: string | null;
  empresaOrigem?: string | null;
  observacoes?: string | null;
  origem?: string;
  anuncioTitulo?: string | null;
  anuncioDescricao?: string | null;
  anuncioUrl?: string | null;
  dadosExtras?: string | null;
}) {
  const funcionario = await prisma.funcionario.findFirst({
    where: {
      id: params.idFuncionario,
      id_empresa: params.idEmpresa,
      ativo: true,
    },
    select: {
      id: true,
      id_pdv: true,
    },
  });

  if (!funcionario) {
    return null;
  }

  const estagioIndefinido = await obterEstagioIndefinido(params.idEmpresa);

  const lead = await prisma.lead.create({
    data: {
      id: randomUUID(),
      id_empresa: params.idEmpresa,
      id_funcionario: funcionario.id,
      id_pdv: funcionario.id_pdv,
      id_estagio: estagioIndefinido.id,
      nome: params.nome.trim(),
      telefone: params.telefone.trim(),
      email: params.email?.trim() || null,
      fonte: params.fonte?.trim() || null,
      empresa_origem: params.empresaOrigem?.trim() || null,
      observacoes: params.observacoes?.trim() || null,
      origem: params.origem ?? "MANUAL",
      anuncio_titulo: params.anuncioTitulo?.trim() || null,
      anuncio_descricao: params.anuncioDescricao?.trim() || null,
      anuncio_url: params.anuncioUrl?.trim() || null,
      dados_extras: params.dadosExtras?.trim() || null,
      ativo: true,
      valor_oportunidade: 0,
      probabilidade: 0.5,
    },
    select: { id: true },
  });

  return obterLeadContatoPorId({
    idEmpresa: params.idEmpresa,
    idLead: lead.id,
    somenteAtivos: false,
  });
}

export async function atualizarLeadContato(params: {
  idEmpresa: string;
  idLead: string;
  nome?: string;
  telefone?: string;
  email?: string | null;
  fonte?: string | null;
  empresaOrigem?: string | null;
  observacoes?: string | null;
  idFuncionario?: string;
  ativo?: boolean;
}) {
  const lead = await prisma.lead.findFirst({
    where: {
      id: params.idLead,
      id_empresa: params.idEmpresa,
    },
    select: { id: true },
  });

  if (!lead) {
    return null;
  }

  const funcionario = params.idFuncionario
    ? await prisma.funcionario.findFirst({
        where: {
          id: params.idFuncionario,
          id_empresa: params.idEmpresa,
          ativo: true,
        },
        select: { id: true, id_pdv: true },
      })
    : null;

  if (params.idFuncionario && !funcionario) {
    throw new Error("Funcionario invalido.");
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      nome: params.nome?.trim(),
      telefone: params.telefone?.trim(),
      email: params.email === undefined ? undefined : params.email?.trim() || null,
      fonte: params.fonte === undefined ? undefined : params.fonte?.trim() || null,
      empresa_origem: params.empresaOrigem === undefined ? undefined : params.empresaOrigem?.trim() || null,
      observacoes: params.observacoes === undefined ? undefined : params.observacoes?.trim() || null,
      id_funcionario: funcionario?.id,
      id_pdv: funcionario?.id_pdv ?? undefined,
      ativo: params.ativo,
      atualizado_em: new Date(),
    },
  });

  return obterLeadContatoPorId({
    idEmpresa: params.idEmpresa,
    idLead: lead.id,
    somenteAtivos: params.ativo !== false,
  });
}

export async function desativarLeadContato(params: {
  idEmpresa: string;
  idLead: string;
  client?: QueryClient;
}) {
  const client = params.client ?? prisma;
  const lead = await client.$queryRaw<Array<{ id: string } & { id_negocio: string | null }>>(Prisma.sql`
    SELECT id, id_negocio
    FROM Lead
    WHERE id = ${params.idLead}
      AND id_empresa = ${params.idEmpresa}
    LIMIT 1
  `);

  if (lead.length === 0) {
    return null;
  }

  const leadAtual = lead[0];
  await client.$executeRaw(Prisma.sql`
    UPDATE Lead
    SET id_negocio = ${null},
        atualizado_em = ${new Date()}
    WHERE id = ${leadAtual.id}
      AND id_empresa = ${params.idEmpresa}
  `);

  await client.$executeRaw(Prisma.sql`
    DELETE FROM Lead
    WHERE id = ${leadAtual.id}
      AND id_empresa = ${params.idEmpresa}
  `);

  return leadAtual as unknown as LeadContato;
}

export async function listarNegociosDoLead(params: {
  idEmpresa: string;
  idLead: string;
}) {
  const lead = await prisma.$queryRaw<Array<{ id: string; id_negocio: string | null }>>(Prisma.sql`
    SELECT id, id_negocio
    FROM Lead
    WHERE id = ${params.idLead}
      AND id_empresa = ${params.idEmpresa}
    LIMIT 1
  `);

  const idNegocio = lead[0]?.id_negocio;
  if (!idNegocio) {
    return [];
  }

  const negocio = await obterNegocioPorId({
    idEmpresa: params.idEmpresa,
    idNegocio,
  });

  return negocio ? [negocio] : [];
}

export function montarDtoLead(lead: LeadContato) {
  return lead;
}
