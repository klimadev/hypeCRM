import { z } from "zod";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, whereLeadsPorPerfil } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { obterEstagioIndefinido } from "@/lib/estagios-fixos";
import { badRequest, forbidden, notFound, serverError } from "@/lib/api/http";
import { parseJson, validateBody } from "@/lib/api/route-validation";
import { disparaAutomacoesPorEvento } from "@/lib/automacoes";

const esquemaCriarNegocio = z.object({
  telefone: z.string().trim().refine((v) => v.replace(/\D/g, "").length >= 10, "Telefone invalido."),
  nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres.").optional(),
  id_pdv: z.string().trim().optional(),
  id_funcionario: z.string().trim().optional(),
  id_estagio: z.string().trim().optional(),
  id_lead: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = validateBody(esquemaCriarNegocio, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const { telefone, nome, id_pdv, id_funcionario, id_estagio, id_lead } = validacao.data;

  const whereLeads = await whereLeadsPorPerfil(auth.sessao);
  const leadExistente = id_lead
    ? await prisma.lead.findFirst({
        where: {
          ...whereLeads,
          id: id_lead,
        },
        select: {
          id: true,
          nome: true,
          telefone: true,
          id_funcionario: true,
          id_pdv: true,
          id_estagio: true,
        },
      })
    : null;

  if (id_lead && !leadExistente) {
    return notFound("Lead nao encontrado.");
  }

  let idFuncFinal: string;
  let idPdvFinal: string | undefined;

  if (auth.sessao.perfil === "COLABORADOR") {
    idFuncFinal = auth.sessao.id_usuario;
    const func = await prisma.funcionario.findUnique({
      where: { id: idFuncFinal },
      select: { id_pdv: true },
    });
    idPdvFinal = func?.id_pdv ?? undefined;
  } else if (auth.sessao.perfil === "GERENTE") {
    if (!auth.sessao.id_pdv) {
      return forbidden("Gerente sem PDV vinculado.");
    }
    if (id_pdv && id_pdv !== auth.sessao.id_pdv) {
      return forbidden("Gerente nao pode criar negocio fora do proprio PDV.");
    }
    idPdvFinal = auth.sessao.id_pdv;
    idFuncFinal = id_funcionario ?? leadExistente?.id_funcionario ?? auth.sessao.id_usuario;
    const func = await prisma.funcionario.findFirst({
      where: { id: idFuncFinal, id_pdv: idPdvFinal, id_empresa: auth.sessao.id_empresa, ativo: true },
    });
    if (!func) {
      return forbidden("Funcionario nao pertence ao seu PDV.");
    }
  } else {
    idPdvFinal = id_pdv ?? leadExistente?.id_pdv ?? undefined;
    idFuncFinal = id_funcionario ?? leadExistente?.id_funcionario ?? auth.sessao.id_usuario;

    let func = await prisma.funcionario.findFirst({
      where: { id: idFuncFinal, id_empresa: auth.sessao.id_empresa, ativo: true },
      select: { id: true, id_pdv: true },
    });

    if (!func && auth.sessao.perfil === "EMPRESA" && !id_funcionario) {
      func = await prisma.funcionario.findFirst({
        where: { id_empresa: auth.sessao.id_empresa, ativo: true },
        orderBy: { criado_em: "asc" },
        select: { id: true, id_pdv: true },
      });
      if (func) {
        idFuncFinal = func.id;
      }
    }

    if (!func) {
      return badRequest("Funcionario invalido.");
    }
    if (idPdvFinal) {
      if (func.id_pdv !== idPdvFinal) {
        return badRequest("Funcionario nao pertence ao PDV informado.");
      }
    } else {
      idPdvFinal = func.id_pdv ?? undefined;
    }
  }

  const estagioIndefinido = await obterEstagioIndefinido(auth.sessao.id_empresa);
  const estagioIdPreferido = id_estagio ?? leadExistente?.id_estagio ?? estagioIndefinido.id;
  const estagioSelecionado = await prisma.estagioFunil.findFirst({
    where: {
      id: estagioIdPreferido,
      id_empresa: auth.sessao.id_empresa,
    },
    select: { id: true, id_funil: true },
  });

  if (!estagioSelecionado) {
    return badRequest("Estagio invalido.");
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const lead = leadExistente
        ? await tx.lead.update({
            where: { id: leadExistente.id },
            data: {
              nome: nome ?? leadExistente.nome,
              id_funcionario: idFuncFinal,
              id_pdv: idPdvFinal ?? null,
              id_estagio: estagioSelecionado.id,
              telefone,
            },
          })
        : await tx.lead.create({
            data: {
              id: randomUUID(),
              nome: nome ?? telefone,
              telefone,
              id_empresa: auth.sessao.id_empresa,
              id_funcionario: idFuncFinal,
              id_pdv: idPdvFinal ?? null,
              id_estagio: estagioSelecionado.id,
              origem: "MANUAL",
            },
          });

      const funil = await tx.funil.findFirst({
        where: { id: estagioSelecionado.id_funil, id_empresa: auth.sessao.id_empresa },
        select: { id: true },
      });

      if (!funil) {
        throw new Error("Funil padrao nao encontrado.");
      }

      const negocio = await tx.negocio.create({
        data: {
          id: randomUUID(),
          id_empresa: auth.sessao.id_empresa,
          id_lead: lead.id,
          id_funil: funil.id,
          id_estagio: estagioSelecionado.id,
          id_funcionario: idFuncFinal,
          titulo: nome ?? lead.nome ?? telefone,
          valor_estimado: 0,
          data_abertura: new Date(),
        },
      });

      await tx.lead.update({
        where: { id: lead.id },
        data: { id_negocio: negocio.id },
      });

      return { lead, negocio, criouNovoLead: !leadExistente };
    });

    if (resultado.criouNovoLead) {
      disparaAutomacoesPorEvento(auth.sessao.id_empresa, "lead_criado", {
        empresaId: auth.sessao.id_empresa,
        leadId: resultado.lead.id,
        lead: { id: resultado.lead.id, nome: resultado.lead.nome, telefone: resultado.lead.telefone },
      }).catch(() => {});
    }

    return NextResponse.json({ lead: resultado.lead, negocio: resultado.negocio }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar negocio a partir de orphan:", error);
    if (error instanceof Error && error.message === "Funil padrao nao encontrado.") {
      return serverError("Funil padrao nao configurado.");
    }
    return serverError("Erro ao criar negocio.");
  }
}
