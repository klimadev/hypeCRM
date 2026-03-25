import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/permissoes";
import { esquemaMoverLead } from "@/lib/validacoes";
import { badRequest, forbidden, notFound } from "@/lib/api/http";
import { parseJson, validateBody } from "@/lib/api/route-validation";
import { executarAutomacoesLeadStageChanged } from "@/lib/whatsapp-automations";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id } = await params;
  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = validateBody(esquemaMoverLead, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const dadosValidados = validacao.data;

  const lead = await prisma.lead.findFirst({
    where: {
      id,
      id_empresa: auth.sessao.id_empresa,
      ...(auth.sessao.perfil === "COLABORADOR"
        ? { id_funcionario: auth.sessao.id_usuario }
        : {}),
    },
    include: {
      empresa: {
        select: {
          nome: true,
        },
      },
      estagio: {
        select: {
          id: true,
          nome: true,
          tipo: true,
        },
      },
      funcionario: {
        select: {
          id_pdv: true,
        },
      },
    },
  });

  if (!lead) {
    return notFound("Lead nao encontrado.");
  }

  // Validação de PDV para GERENTE
  if (auth.sessao.perfil === "GERENTE" && auth.sessao.id_pdv) {
    if (lead.funcionario.id_pdv !== auth.sessao.id_pdv) {
      return forbidden("Voce só pode mover leads do seu PDV.");
    }
  }

  const estagioDestino = await prisma.estagioFunil.findFirst({
    where: {
      id: dadosValidados.id_estagio,
      id_empresa: auth.sessao.id_empresa,
    },
  });

  if (!estagioDestino) {
    return badRequest("Estagio destino invalido.");
  }

  if (estagioDestino.tipo === "PERDIDO" && !dadosValidados.motivo_perda?.trim()) {
    return badRequest("Motivo de perda e obrigatorio.");
  }

  const estagioEfetivo = estagioDestino;

  // Same-stage no-op guard: skip automation scheduling if lead is already in destination stage
  if (lead.estagio.id === estagioEfetivo.id) {
    return NextResponse.json({ 
      lead, 
      mensagem: "Lead ja esta neste estagio.",
      noop: true 
    });
  }

  const { leadAtualizado, logMovimentacao } = await prisma.$transaction(async (tx) => {
    const leadMovido = await tx.lead.update({
      where: { id: lead.id },
      data: {
        id_estagio: estagioEfetivo.id,
        motivo_perda: estagioEfetivo.tipo === "PERDIDO" ? dadosValidados.motivo_perda?.trim() : null,
      },
      include: { estagio: true },
    });

    const log = await tx.leadEstagioLog.create({
      data: {
        id_lead: lead.id,
        id_estagio_anterior: lead.estagio.id,
        id_estagio_novo: estagioEfetivo.id,
        empresa_id: auth.sessao.id_empresa,
      },
    });

    return {
      leadAtualizado: leadMovido,
      logMovimentacao: log,
    };
  });

  // Disparar automações em background para não bloquear a resposta
  void (async () => {
    try {
      await executarAutomacoesLeadStageChanged({
        idEmpresa: auth.sessao.id_empresa,
        leadEstagioLogId: logMovimentacao.id,
        lead: {
          id: leadAtualizado.id,
          nome: leadAtualizado.nome,
          telefone: leadAtualizado.telefone,
          email: leadAtualizado.email,
        },
        estagioAnterior: {
          id: lead.estagio.id,
          nome: lead.estagio.nome,
        },
        estagioAtual: {
          id: estagioEfetivo.id,
          nome: estagioEfetivo.nome,
        },
        empresa: {
          nome: lead.empresa?.nome ?? null,
        },
        disparadoEm: logMovimentacao.criado_em,
      });
    } catch (error) {
      console.error("Falha ao disparar automacoes de mudanca de estagio:", error);
    }
  })();

  return NextResponse.json({
    lead: {
      ...leadAtualizado,
      estagio: {
        ...leadAtualizado.estagio,
        ordem: Number(leadAtualizado.estagio.ordem),
      },
    },
  });
}
