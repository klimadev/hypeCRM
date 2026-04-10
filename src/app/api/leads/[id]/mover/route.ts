import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/permissoes";
import { esquemaMoverLead } from "@/lib/validacoes";
import { badRequest, forbidden, notFound } from "@/lib/api/http";
import { parseJson, validateBody } from "@/lib/api/route-validation";

type LeadMovimentacaoPayload = {
  id: string;
  id_empresa: string;
  id_funcionario: string;
  id_estagio: string;
  nome: string;
  telefone: string;
  email: string | null;
  Funcionario: {
    id_pdv: string;
  };
  EstagioFunil: {
    id: string;
    nome: string;
    tipo: string;
  };
  Empresa: {
    nome: string;
  } | null;
  empresa?: {
    nome: string;
  } | null;
  estagio?: {
    id: string;
    nome: string;
    tipo: string;
  };
  funcionario?: {
    id_pdv: string;
  };
};

type LeadAtualizadoPayload = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  EstagioFunil: {
    id: string;
    nome: string;
    tipo: string;
    ordem: bigint;
  };
  estagio?: {
    id: string;
    nome: string;
    tipo: string;
    ordem?: bigint;
  };
};

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
      Empresa: {
        select: {
          nome: true,
        },
      },
      EstagioFunil: {
        select: {
          id: true,
          nome: true,
          tipo: true,
        },
      },
      Funcionario: {
        select: {
          id_pdv: true,
        },
      },
    },
  }) as LeadMovimentacaoPayload | null;

  if (!lead) {
    return notFound("Lead nao encontrado.");
  }

  const estagioAtualLead = lead.EstagioFunil ?? lead.estagio;
  const funcionarioLead = lead.Funcionario ?? lead.funcionario;

  // Validação de PDV para GERENTE
  if (auth.sessao.perfil === "GERENTE" && auth.sessao.id_pdv) {
    if (funcionarioLead?.id_pdv !== auth.sessao.id_pdv) {
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

  if (estagioAtualLead?.id === estagioEfetivo.id) {
    return NextResponse.json({
      lead,
      mensagem: "Lead ja esta neste estagio.",
      noop: true,
    });
  }

  const { leadAtualizado } = await prisma.$transaction(async (tx) => {
    const leadMovido = await tx.lead.update({
      where: { id: lead.id },
      data: {
        id_estagio: estagioEfetivo.id,
        motivo_perda: estagioEfetivo.tipo === "PERDIDO" ? dadosValidados.motivo_perda?.trim() : null,
      },
      include: { EstagioFunil: true },
    }) as LeadAtualizadoPayload;

    await tx.leadEstagioLog.create({
      data: {
        id: randomUUID(),
        id_lead: lead.id,
        id_estagio_anterior: estagioAtualLead?.id,
        id_estagio_novo: estagioEfetivo.id,
        empresa_id: auth.sessao.id_empresa,
      },
    });

    return {
      leadAtualizado: leadMovido,
    };
  });

  const estagioAtualizado = leadAtualizado.EstagioFunil ?? leadAtualizado.estagio;

  return NextResponse.json({
    lead: {
      ...leadAtualizado,
      estagio: estagioAtualizado
        ? {
            ...estagioAtualizado,
            ordem: Number(estagioAtualizado.ordem ?? 0),
          }
        : null,
    },
  });
}
