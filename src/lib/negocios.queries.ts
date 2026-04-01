import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  FiltroAcessoEmpresaFuncionario,
  LeadRowBase,
  LeadResumoBasico,
  NegocioRowBase,
  QueryClient,
} from "@/lib/negocios.types";
import {
  idsFuncionarioDoFiltro,
  mapearLeadBasicoDoRegistro,
  mapearNegocioResumo,
  normalizarIdsNegocios,
} from "@/lib/negocios.utils";

export async function carregarLeadsDoNegocio(client: QueryClient, idEmpresa: string, idsNegocio: string[]) {
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
    WHERE l.id_empresa = ${idEmpresa}
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

export async function carregarNegociosResumo(client: QueryClient, params: {
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

export async function obterNegocioBasePorId(params: {
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

export async function obterLeadsAtivosDisponiveis(client: QueryClient, params: {
  idEmpresa: string;
  idsLeads: string[];
}) {
  const idsLeads = normalizarIdsNegocios(params.idsLeads);
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

export async function obterLeadsVinculadosAoNegocio(client: QueryClient, params: {
  idEmpresa: string;
  idNegocio: string;
}) {
  return client.$queryRaw<LeadRowBase[]>(Prisma.sql`
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
}

export async function recalcularPrincipalDoNegocio(client: QueryClient, params: {
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

export async function validarLeadsVinculaveis(params: {
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

export async function obterNegocioExistente(client: QueryClient, params: {
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
