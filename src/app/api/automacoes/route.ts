import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPerfis } from "@/lib/api/route-guards";
import { parseJson, validateBody } from "@/lib/api/route-validation";
import { badRequest, ok } from "@/lib/api/http";
import { esquemaCriarAutomacao } from "@/lib/validacoes";
import { STATUS_AGENDAMENTO } from "@/lib/validacoes";
import { automacaoArquivada, serializarConfigAutomacao } from "@/lib/automacoes/config";
import { validarRelacionamentosAutomacao } from "@/lib/automacoes/validacao";

export async function GET(request: NextRequest) {
  return withPerfis(request, ["EMPRESA", "GERENTE"], async ({ sessao }) => {
    const automacoes = await prisma.automacao.findMany({
      where: {
        id_empresa: sessao.id_empresa,
      },
      include: {
        acoes: {
          orderBy: { ordem: "asc" },
        },
        _count: {
          select: {
            agendamentos: {
              where: {
                tipo_origem: "WHATSAPP",
              },
            },
          },
        },
      },
      orderBy: { criado_em: "desc" },
    });

    const automacoesAtivasNoCatalogo = automacoes.filter(
      (automacao) => !automacaoArquivada(automacao.config_json),
    );

    const automacoesComStats = await Promise.all(
      automacoesAtivasNoCatalogo.map(async (automacao) => {
        const stats = await prisma.automacaoAgendamento.aggregate({
          where: {
            id_automacao: automacao.id,
          },
          _count: true,
          _sum: {
            tentativas: true,
          },
        });

        const enviados = await prisma.automacaoAgendamento.count({
          where: {
            id_automacao: automacao.id,
            status: STATUS_AGENDAMENTO.ENVIADO,
          },
        });

        const falhas = await prisma.automacaoAgendamento.count({
          where: {
            id_automacao: automacao.id,
            status: STATUS_AGENDAMENTO.FALHA,
          },
        });

        return {
          ...automacao,
          stats: {
            total_jobs: stats._count,
            enviados,
            falhas,
            taxa_sucesso: stats._count > 0 ? Math.round((enviados / stats._count) * 100) : 0,
          },
        };
      })
    );

    return ok({ automacoes: automacoesComStats }, 200, true);
  });
}

export async function POST(request: NextRequest) {
  return withPerfis(request, ["EMPRESA"], async ({ sessao }) => {
    const parseResult = await parseJson(request);
    if (!parseResult.ok) return parseResult.response;

    const validacao = validateBody(esquemaCriarAutomacao, parseResult.data);
    if (!validacao.ok) return validacao.response;

    const dados = validacao.data;

    const erroRelacionamento = await validarRelacionamentosAutomacao({
      idEmpresa: sessao.id_empresa,
      idEstagioDestino: dados.id_estagio_destino,
      acoes: dados.acoes,
    });
    if (erroRelacionamento) {
      return badRequest(erroRelacionamento);
    }

    const automacao = await prisma.automacao.create({
      data: {
        id_empresa: sessao.id_empresa,
        id_criador: sessao.id_usuario,
        nome: dados.nome,
        fonte: dados.fonte,
        gatilho: dados.gatilho,
        ativo: dados.ativo ?? true,
        config_json: serializarConfigAutomacao({
          id_estagio_destino: dados.id_estagio_destino,
        }),
        acoes: {
          create: dados.acoes.map((acao, index) => ({
            tipo: acao.tipo,
            ordem: acao.ordem ?? index,
            delay_minutos: acao.delay_minutos ?? 0,
            id_instancia_whatsapp: acao.id_instancia_whatsapp || null,
            telefone_destino: acao.telefone_destino || null,
            id_lead_destino: acao.id_lead_destino || null,
            mensagem: acao.mensagem,
          })),
        },
      },
      include: {
        acoes: { orderBy: { ordem: "asc" } },
      },
    });

    return ok({ automacao }, 201);
  });
}
