import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPerfis } from "@/lib/api/route-guards";
import { parseJson, validateBody } from "@/lib/api/route-validation";
import { badRequest, ok, notFound } from "@/lib/api/http";
import { esquemaAtualizarAutomacao } from "@/lib/validacoes";
import { automacaoArquivada, parseConfigAutomacao, serializarConfigAutomacao } from "@/lib/automacoes/config";
import { validarRelacionamentosAutomacao } from "@/lib/automacoes/validacao";
import { cancelarAgendamentosDaAutomacaoWhatsapp } from "@/lib/whatsapp-automations";

type RouteParams = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  return withPerfis(request, ["EMPRESA", "GERENTE"], async ({ sessao }) => {
    const { id } = await params;

    const automacao = await prisma.automacao.findFirst({
      where: {
        id,
        id_empresa: sessao.id_empresa,
      },
      include: {
        acoes: { orderBy: { ordem: "asc" } },
      },
    });

    if (!automacao) {
      return notFound("Automacao nao encontrada.");
    }

    if (automacaoArquivada(automacao.config_json)) {
      return notFound("Automacao nao encontrada.");
    }

    return ok({ automacao }, 200, true);
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  return withPerfis(request, ["EMPRESA"], async ({ sessao }) => {
    const { id } = await params;

    const existente = await prisma.automacao.findFirst({
      where: {
        id,
        id_empresa: sessao.id_empresa,
      },
      include: {
        acoes: true,
      },
    });

    if (!existente) {
      return notFound("Automacao nao encontrada.");
    }

    if (automacaoArquivada(existente.config_json)) {
      return notFound("Automacao nao encontrada.");
    }

    const parseResult = await parseJson(request);
    if (!parseResult.ok) return parseResult.response;

    const validacao = validateBody(esquemaAtualizarAutomacao, parseResult.data);
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

    const updateData: Record<string, unknown> = {};
    if (dados.nome !== undefined) updateData.nome = dados.nome;
    if (dados.ativo !== undefined) updateData.ativo = dados.ativo;

    if (dados.id_estagio_destino !== undefined) {
      const config = parseConfigAutomacao(existente.config_json);
      config.id_estagio_destino = dados.id_estagio_destino;
      updateData.config_json = serializarConfigAutomacao(config);
    }

    const automacao = await prisma.$transaction(async (tx) => {
      if (dados.acoes !== undefined) {
        await tx.automacaoAcao.deleteMany({
          where: { id_automacao: id },
        });

        await tx.automacaoAcao.createMany({
          data: dados.acoes.map((acao, index) => ({
            id_automacao: id,
            tipo: acao.tipo,
            ordem: acao.ordem ?? index,
            delay_minutos: acao.delay_minutos ?? 0,
            id_instancia_whatsapp: acao.id_instancia_whatsapp || null,
            telefone_destino: acao.telefone_destino || null,
            id_lead_destino: acao.id_lead_destino || null,
            mensagem: acao.mensagem,
          })),
        });
      }

      return tx.automacao.update({
        where: { id },
        data: updateData,
        include: {
          acoes: { orderBy: { ordem: "asc" } },
        },
      });
    });

    if (dados.ativo === false || dados.id_estagio_destino !== undefined || dados.acoes !== undefined) {
      await cancelarAgendamentosDaAutomacaoWhatsapp(
        id,
        dados.ativo === false ? "Automacao desativada." : "Automacao atualizada.",
      );
    }

    return ok({ automacao }, 200, true);
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  return withPerfis(request, ["EMPRESA"], async ({ sessao }) => {
    const { id } = await params;

    const automacao = await prisma.automacao.findFirst({
      where: {
        id,
        id_empresa: sessao.id_empresa,
      },
    });

    if (!automacao) {
      return notFound("Automacao nao encontrada.");
    }

    if (automacaoArquivada(automacao.config_json)) {
      return notFound("Automacao nao encontrada.");
    }

    await cancelarAgendamentosDaAutomacaoWhatsapp(id, "Automacao arquivada.");

    const config = parseConfigAutomacao(automacao.config_json);

    await prisma.automacao.update({
      where: { id },
      data: {
        ativo: false,
        config_json: serializarConfigAutomacao({
          ...config,
          arquivada: true,
        }),
      },
    });

    return ok({ mensagem: "Automacao removida com sucesso." }, 200, true);
  });
}
