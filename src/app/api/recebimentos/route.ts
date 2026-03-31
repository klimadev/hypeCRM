import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api/http";
import { validateQuery } from "@/lib/api/route-validation";
import { withPerfis } from "@/lib/api/route-guards";
import { calcularResumoParcelas, calcularStatusParcela, inicioDoDia } from "@/lib/financeiro/parcelas";
import { esquemaListarRecebimentos } from "@/lib/validacoes";
import type { StatusParcela } from "@/lib/api/parcelas";

type RecebimentoListaItem = {
  id: string;
  numero_parcela: number;
  quantidade_total: number;
  valor: number;
  status: StatusParcela;
  data_vencimento: string;
  data_pagamento: string | null;
  lead: {
    id: string;
    nome: string;
    telefone: string;
    valor_oportunidade: number;
    estagio: string;
  };
  pdv: {
    id: string;
    nome: string;
  } | null;
  responsavel: {
    id: string;
    nome: string;
  };
  dias_em_atraso: number;
};

type ParcelaRaw = {
  id: string;
  numero_parcela: number;
  quantidade_total: number;
  valor: number;
  data_vencimento: Date;
  data_pagamento: Date | null;
  status: string;
  negocio_id: string;
  negocio_valor_estimado: number;
  lead_id: string | null;
  lead_nome: string | null;
  lead_telefone: string | null;
  estagio_nome: string;
  responsavel_id: string;
  responsavel_nome: string;
  responsavel_id_pdv: string | null;
  pdv_id: string | null;
  pdv_nome: string | null;
};

type AbaRecebimentos = "todos" | "recebidos" | "a_vencer" | "atrasados";

function normalizarBusca(valor?: string) {
  return valor?.trim().toLowerCase() ?? "";
}

function obterPeriodoComparativo(dataInicial?: string, dataFinal?: string) {
  if (!dataInicial || !dataFinal) return null;

  const inicio = inicioDoDia(dataInicial);
  const fim = inicioDoDia(dataFinal);
  const diffMs = Math.max(fim.getTime() - inicio.getTime(), 24 * 60 * 60 * 1000);

  return {
    inicioAnterior: new Date(inicio.getTime() - diffMs),
    fimAnterior: new Date(fim.getTime() - diffMs),
  };
}

function filtrarPorAba<T extends { status: string }>(lista: T[], aba: AbaRecebimentos) {
  if (aba === "recebidos") return lista.filter((item) => item.status === "PAGO");
  if (aba === "a_vencer") return lista.filter((item) => item.status === "PENDENTE");
  if (aba === "atrasados") return lista.filter((item) => item.status === "ATRASADO");
  return lista;
}

function ordenarLista<T extends { valor: number; data_vencimento: string; data_pagamento: string | null }>(
  lista: T[],
  ordenar: "vencimento" | "pagamento" | "valor",
  direcao: "asc" | "desc",
  aba: AbaRecebimentos,
) {
  const fator = direcao === "asc" ? 1 : -1;

  return [...lista].sort((a, b) => {
    if (ordenar === "valor") {
      return (a.valor - b.valor) * fator;
    }

    if (ordenar === "pagamento") {
      const aData = new Date(a.data_pagamento ?? 0).getTime();
      const bData = new Date(b.data_pagamento ?? 0).getTime();
      return (aData - bData) * fator;
    }

    const aVencimento = new Date(a.data_vencimento).getTime();
    const bVencimento = new Date(b.data_vencimento).getTime();

    if (aba === "atrasados") {
      return aVencimento - bVencimento;
    }

    if (aba === "recebidos") {
      const aPagamento = new Date(a.data_pagamento ?? 0).getTime();
      const bPagamento = new Date(b.data_pagamento ?? 0).getTime();
      return bPagamento - aPagamento;
    }

    return (aVencimento - bVencimento) * fator;
  });
}

function paginar<T>(lista: T[], pagina: number, limite: number) {
  const inicio = (pagina - 1) * limite;
  return lista.slice(inicio, inicio + limite);
}

function montarCondicaoPadrao(idEmpresa: string) {
  return Prisma.sql`p.id_empresa = ${idEmpresa}`;
}

function mapearParcelas(rows: ParcelaRaw[]): RecebimentoListaItem[] {
  return rows.map((parcela) => {
    const statusCalculado = calcularStatusParcela({
      status: parcela.status === "PAGO" ? "PAGO" : "PENDENTE",
      data_vencimento: parcela.data_vencimento.toISOString(),
      data_pagamento: parcela.data_pagamento?.toISOString() ?? null,
    });

    return {
      id: parcela.id,
      numero_parcela: parcela.numero_parcela,
      quantidade_total: parcela.quantidade_total,
      valor: parcela.valor,
      status: statusCalculado,
      data_vencimento: parcela.data_vencimento.toISOString(),
      data_pagamento: parcela.data_pagamento?.toISOString() ?? null,
      lead: {
        id: parcela.lead_id ?? parcela.negocio_id,
        nome: parcela.lead_nome ?? "Sem lead",
        telefone: parcela.lead_telefone ?? "",
        valor_oportunidade: parcela.negocio_valor_estimado,
        estagio: parcela.estagio_nome,
      },
      pdv: parcela.pdv_id && parcela.pdv_nome
        ? {
            id: parcela.pdv_id,
            nome: parcela.pdv_nome,
          }
        : null,
      responsavel: {
        id: parcela.responsavel_id,
        nome: parcela.responsavel_nome,
      },
      dias_em_atraso:
        statusCalculado === "ATRASADO"
          ? Math.max(0, Math.floor((inicioDoDia().getTime() - inicioDoDia(parcela.data_vencimento).getTime()) / (24 * 60 * 60 * 1000)))
          : 0,
    };
  });
}

export async function GET(request: NextRequest) {
  return withPerfis(request, ["EMPRESA"], async ({ sessao }) => {
    const { searchParams } = new URL(request.url);
    const validacao = validateQuery(
      esquemaListarRecebimentos,
      Object.fromEntries(searchParams.entries()),
    );

    if (!validacao.ok) {
      return validacao.response;
    }

    const filtros = validacao.data;
    const hoje = inicioDoDia();
    const buscaNormalizada = normalizarBusca(filtros.busca);

    const parcelasRaw = await prisma.$queryRaw<ParcelaRaw[]>(Prisma.sql`
      SELECT
        p.id AS id,
        p.numero_parcela AS numero_parcela,
        p.quantidade_total AS quantidade_total,
        p.valor AS valor,
        p.data_vencimento AS data_vencimento,
        p.data_pagamento AS data_pagamento,
        p.status AS status,
        n.id AS negocio_id,
        n.valor_estimado AS negocio_valor_estimado,
        l.id AS lead_id,
        l.nome AS lead_nome,
        l.telefone AS lead_telefone,
        e.nome AS estagio_nome,
        f.id AS responsavel_id,
        f.nome AS responsavel_nome,
        f.id_pdv AS responsavel_id_pdv,
        pdv.id AS pdv_id,
        pdv.nome AS pdv_nome
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
      JOIN Funcionario f ON f.id = n.id_funcionario
      LEFT JOIN Pdv pdv ON pdv.id = f.id_pdv
      JOIN EstagioFunil e ON e.id = n.id_estagio
      WHERE ${montarCondicaoPadrao(sessao.id_empresa)}
      ORDER BY p.data_vencimento ASC
    `);

    const listaBase = mapearParcelas(parcelasRaw).filter((item) => {
      if (filtros.data_inicial || filtros.data_final) {
        const dataVencimento = new Date(item.data_vencimento);
        const dataPagamento = item.data_pagamento ? new Date(item.data_pagamento) : null;
        const inicio = filtros.data_inicial ? new Date(filtros.data_inicial) : null;
        const fim = filtros.data_final ? new Date(filtros.data_final) : null;

        const bateVencimento = (!inicio || dataVencimento >= inicio) && (!fim || dataVencimento <= fim);
        const batePagamento = dataPagamento
          ? (!inicio || dataPagamento >= inicio) && (!fim || dataPagamento <= fim)
          : false;

        if (!bateVencimento && !batePagamento) {
          return false;
        }
      }

      if (filtros.id_funcionario && item.responsavel.id !== filtros.id_funcionario) {
        return false;
      }

      if (filtros.id_pdv && item.pdv?.id !== filtros.id_pdv) {
        return false;
      }

      return true;
    });

    const listaFiltradaBusca = buscaNormalizada
      ? listaBase.filter((item) => {
          const alvo = `${item.lead.nome} ${item.lead.telefone} ${item.responsavel?.nome ?? ""} ${item.pdv?.nome ?? ""}`.toLowerCase();
          return alvo.includes(buscaNormalizada);
        })
      : listaBase;

    const listaAba = filtrarPorAba(listaFiltradaBusca, filtros.aba);
    const listaOrdenada = ordenarLista(listaAba, filtros.ordenar, filtros.direcao, filtros.aba);
    const total = listaOrdenada.length;
    const listaPaginada = paginar(listaOrdenada, filtros.pagina, filtros.limite);

    const resumoGeral = calcularResumoParcelas(listaFiltradaBusca);

    const recebidosPeriodo = listaFiltradaBusca.filter((item) => {
      if (!item.data_pagamento) return false;
      if (!filtros.data_inicial && !filtros.data_final) return true;
      const dataPagamento = new Date(item.data_pagamento);
      if (filtros.data_inicial && dataPagamento < new Date(filtros.data_inicial)) return false;
      if (filtros.data_final && dataPagamento > new Date(filtros.data_final)) return false;
      return true;
    });

    const periodoComparativo = obterPeriodoComparativo(filtros.data_inicial, filtros.data_final);
    const recebidosPeriodoAnterior = periodoComparativo
      ? listaBase.filter((item) => {
          if (!item.data_pagamento) return false;
          const dataPagamento = new Date(item.data_pagamento);
          return dataPagamento >= periodoComparativo.inicioAnterior && dataPagamento <= periodoComparativo.fimAnterior;
        })
      : [];

    const totalRecebidoPeriodo = recebidosPeriodo.reduce((acc, item) => acc + item.valor, 0);
    const totalRecebidoPeriodoAnterior = recebidosPeriodoAnterior.reduce((acc, item) => acc + item.valor, 0);
    const variacaoRecebidoPeriodo = totalRecebidoPeriodoAnterior > 0
      ? ((totalRecebidoPeriodo - totalRecebidoPeriodoAnterior) / totalRecebidoPeriodoAnterior) * 100
      : totalRecebidoPeriodo > 0
        ? 100
        : 0;

    const gruposPeriodo = new Map<string, { label: string; recebido: number; previsto: number }>();
    for (const item of listaFiltradaBusca) {
      const data = new Date(item.data_pagamento ?? item.data_vencimento);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
      const label = data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const existente = gruposPeriodo.get(chave) ?? { label, recebido: 0, previsto: 0 };
      existente.previsto += item.valor;
      if (item.status === "PAGO") {
        existente.recebido += item.valor;
      }
      gruposPeriodo.set(chave, existente);
    }

    const distribuicaoStatus = ["PAGO", "PENDENTE", "ATRASADO"].map((status) => {
      const itens = listaFiltradaBusca.filter((item) => item.status === status);
      return {
        status,
        quantidade: itens.length,
        valor: itens.reduce((acc, item) => acc + item.valor, 0),
      };
    });

    return ok({
      resumo: {
        totalRecebidoPeriodo,
        totalEmAberto: resumoGeral.totalPendente,
        totalAtrasado: resumoGeral.totalAtrasado,
        taxaAdimplencia: resumoGeral.taxaAdimplencia,
        quantidadeRecebidas: resumoGeral.quantidadeRecebidas,
        quantidadePendentes: resumoGeral.quantidadePendentes,
        quantidadeAtrasadas: resumoGeral.quantidadeAtrasadas,
        quantidadeMonitoradas: listaFiltradaBusca.length,
        parcelasVencendo7Dias: listaFiltradaBusca.filter((item) => {
          if (item.status !== "PENDENTE") return false;
          const diff = inicioDoDia(item.data_vencimento).getTime() - hoje.getTime();
          const dias = diff / (24 * 60 * 60 * 1000);
          return dias >= 0 && dias <= 7;
        }).length,
        variacaoRecebidoPeriodo,
      },
      graficos: {
        recebimentosPorPeriodo: Array.from(gruposPeriodo.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, valor]) => valor),
        distribuicaoStatus,
      },
      lista: listaPaginada,
      contadoresAbas: {
        todos: listaFiltradaBusca.length,
        recebidos: listaFiltradaBusca.filter((item) => item.status === "PAGO").length,
        a_vencer: listaFiltradaBusca.filter((item) => item.status === "PENDENTE").length,
        atrasados: listaFiltradaBusca.filter((item) => item.status === "ATRASADO").length,
      },
      filtrosAplicados: filtros,
      opcoes: {
        pdvs: Array.from(
          new Map(
            listaBase
              .filter((item) => item.pdv)
              .map((item) => [item.pdv?.id, item.pdv]),
          ).values(),
        ),
        responsaveis: Array.from(
          new Map(listaBase.map((item) => [item.responsavel.id, item.responsavel])).values(),
        ),
      },
      paginacao: {
        pagina: filtros.pagina,
        limite: filtros.limite,
        total,
        totalPaginas: Math.max(1, Math.ceil(total / filtros.limite)),
      },
    });
  });
}
