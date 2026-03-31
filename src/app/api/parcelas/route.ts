import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirSessao, whereNegociosPorPerfil, respostaSemPermissao } from "@/lib/permissoes";
import { esquemaGerarParcelasNegocio } from "@/lib/validacoes";
import { badRequest, conflict, notFound } from "@/lib/api/http";
import { parseJson, validateBody } from "@/lib/api/route-validation";
import { inicioDoDia } from "@/lib/financeiro/parcelas";
import { obterNegocioPorId } from "@/lib/negocios";

type TabParcelas = "proximos" | "atrasados" | "recebidos";

type ParcelaListaItem = {
  id: string;
  id_empresa: string;
  id_lead: string;
  id_negocio: string | null;
  numero_parcela: number;
  quantidade_total: number;
  valor: number;
  data_vencimento: Date;
  data_pagamento: Date | null;
  status: string;
  negocio_id: string;
  negocio_valor_estimado: number;
  negocio_lead_id: string | null;
  negocio_lead_nome: string | null;
  negocio_lead_telefone: string | null;
  negocio: {
    id: string;
    valor_estimado: number;
    lead: {
      id: string;
      nome: string;
      telefone: string;
    } | null;
  };
};

function gerarDatasVencimento(dataInicial: Date, quantidade: number): Date[] {
  const datas: Date[] = [];
  const diaOriginal = dataInicial.getDate();

  for (let i = 0; i < quantidade; i += 1) {
    const data = new Date(dataInicial);
    data.setDate(1);
    data.setMonth(data.getMonth() + i);

    const ultimoDiaDoMes = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
    data.setDate(Math.min(diaOriginal, ultimoDiaDoMes));
    datas.push(data);
  }

  return datas;
}

function montarCondicoesBase(
  idEmpresa: string,
  idNegocio?: string,
  tab?: TabParcelas | null,
  status?: string,
  hoje?: Date,
) {
  const condicoes: Prisma.Sql[] = [Prisma.sql`p.id_empresa = ${idEmpresa}`];

  if (idNegocio) {
    condicoes.push(Prisma.sql`p.id_negocio = ${idNegocio}`);
  }

  if (tab === "proximos" && hoje) {
    condicoes.push(Prisma.sql`p.status = "PENDENTE"`);
    condicoes.push(Prisma.sql`p.data_pagamento IS NULL`);
    condicoes.push(Prisma.sql`p.data_vencimento >= ${hoje}`);
  } else if (tab === "atrasados" && hoje) {
    condicoes.push(Prisma.sql`p.status = "PENDENTE"`);
    condicoes.push(Prisma.sql`p.data_pagamento IS NULL`);
    condicoes.push(Prisma.sql`p.data_vencimento < ${hoje}`);
  } else if (tab === "recebidos") {
    condicoes.push(Prisma.sql`p.status = "PAGO"`);
  } else if (status) {
    condicoes.push(Prisma.sql`p.status = ${status}`);
  }

  return Prisma.join(condicoes, " AND ");
}

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { searchParams } = new URL(request.url);
  const idNegocio = searchParams.get("id_negocio")?.trim() || undefined;
  const status = searchParams.get("status")?.trim() || undefined;
  const tab = (searchParams.get("tab")?.trim() as TabParcelas | null) ?? null;
  const limit = Number(searchParams.get("limit") ?? "50");
  const hoje = inicioDoDia();

  if (tab && auth.sessao.perfil !== "EMPRESA") {
    return respostaSemPermissao();
  }

  if (idNegocio) {
    const whereNegocioPermitido = await whereNegociosPorPerfil(auth.sessao);
    const negocioPermitido = await obterNegocioPorId({
      idEmpresa: auth.sessao.id_empresa,
      idNegocio,
      whereExtra: whereNegocioPermitido,
    });

    if (!negocioPermitido) {
      return notFound("Negocio nao encontrado.");
    }
  }

  const whereSql = montarCondicoesBase(auth.sessao.id_empresa, idNegocio, tab, status, hoje);

  const parcelas = await prisma.$queryRaw<ParcelaListaItem[]>(Prisma.sql`
    SELECT
      p.id AS id,
      p.id_empresa AS id_empresa,
      p.id_lead AS id_lead,
      p.id_negocio AS id_negocio,
      p.numero_parcela AS numero_parcela,
      p.quantidade_total AS quantidade_total,
      p.valor AS valor,
      p.data_vencimento AS data_vencimento,
      p.data_pagamento AS data_pagamento,
      p.status AS status,
      n.id AS negocio_id,
      n.valor_estimado AS negocio_valor_estimado,
      l.id AS negocio_lead_id,
      l.nome AS negocio_lead_nome,
      l.telefone AS negocio_lead_telefone
    FROM Parcela p
    JOIN Negocio n ON n.id = p.id_negocio
    LEFT JOIN Lead l ON l.id = COALESCE(
      n.id_lead,
      (
        SELECT id
        FROM Lead
        WHERE id_negocio = n.id
        ORDER BY criado_em ASC
        LIMIT 1
      )
    )
    WHERE ${whereSql}
    ORDER BY ${
      tab === "recebidos"
        ? Prisma.raw("p.data_pagamento DESC, p.data_vencimento DESC")
        : Prisma.raw("p.data_vencimento ASC")
    }
    LIMIT ${Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 300) : 50}
  `);

  const parcelasNormalizadas = parcelas.map((parcela) => {
    const vencimento = inicioDoDia(parcela.data_vencimento);
    const statusParcela = parcela.status === "PAGO"
      ? "PAGO"
      : vencimento < hoje && !parcela.data_pagamento
        ? "ATRASADO"
        : "PENDENTE";

    return {
      id: parcela.id,
      id_empresa: parcela.id_empresa,
      id_lead: parcela.id_lead,
      id_negocio: parcela.id_negocio,
      numero_parcela: parcela.numero_parcela,
      quantidade_total: parcela.quantidade_total,
      valor: parcela.valor,
      data_vencimento: parcela.data_vencimento,
      data_pagamento: parcela.data_pagamento,
      status: statusParcela,
      negocio: {
        id: parcela.negocio_id,
        valor_estimado: parcela.negocio_valor_estimado,
        lead: parcela.negocio_lead_id
          ? {
              id: parcela.negocio_lead_id,
              nome: parcela.negocio_lead_nome ?? "",
              telefone: parcela.negocio_lead_telefone ?? "",
            }
          : null,
      },
    };
  });

  return NextResponse.json({ parcelas: parcelasNormalizadas });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = validateBody(esquemaGerarParcelasNegocio, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const dados = validacao.data;
  const primeiroVencimento = new Date(dados.data_primeiro_vencimento);
  const hoje = inicioDoDia();
  if (inicioDoDia(primeiroVencimento) < hoje) {
    return badRequest("A data do primeiro vencimento nao pode estar no passado.");
  }

  const negocio = await obterNegocioPorId({
    idEmpresa: auth.sessao.id_empresa,
    idNegocio: dados.id_negocio,
    whereExtra: await whereNegociosPorPerfil(auth.sessao),
  });

  if (!negocio) {
    return notFound("Negocio nao encontrado.");
  }

  if (auth.sessao.perfil === "COLABORADOR") {
    return respostaSemPermissao();
  }

  const parcelasExistentes = await prisma.parcela.count({
    where: { id_empresa: auth.sessao.id_empresa, id_negocio: dados.id_negocio },
  });

  if (parcelasExistentes > 0) {
    return conflict("Este negocio ja possui plano de parcelas cadastrado.");
  }

  const datas = gerarDatasVencimento(primeiroVencimento, dados.quantidade_parcelas);
  const parcelasParaCriar = datas.map((dataVencimento, indice) => ({
    id: randomUUID(),
    id_empresa: auth.sessao.id_empresa,
    id_lead: negocio.id_lead ?? negocio.lead?.id ?? negocio.lead_principal?.id ?? negocio.leads[0]?.id,
    id_negocio: dados.id_negocio,
    numero_parcela: indice + 1,
    quantidade_total: dados.quantidade_parcelas,
    valor: dados.valor_parcela,
    data_vencimento: dataVencimento,
    status: "PENDENTE",
  }));

  if (parcelasParaCriar.some((parcela) => !parcela.id_lead)) {
    return badRequest("O negocio precisa ter ao menos um lead vinculado para gerar parcelas.");
  }

  await prisma.parcela.createMany({
    data: parcelasParaCriar as Array<{
      id: string;
      id_empresa: string;
      id_lead: string;
      id_negocio: string;
      numero_parcela: number;
      quantidade_total: number;
      valor: number;
      data_vencimento: Date;
      status: string;
    }>,
  });

  return NextResponse.json({ ok: true, parcelas_criadas: parcelasParaCriar.length }, { status: 201 });
}
