import { z } from "zod";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { obterEstagioIndefinido } from "@/lib/estagios-fixos";
import { badRequest, forbidden, serverError } from "@/lib/api/http";
import { parseJson, validateBody } from "@/lib/api/route-validation";

const esquemaRegistrarLead = z.object({
  telefone: z.string().trim().refine((v) => v.replace(/\D/g, "").length >= 10, "Telefone invalido."),
  nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres.").optional(),
  id_pdv: z.string().trim().optional(),
  id_funcionario: z.string().trim().optional(),
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

  const validacao = validateBody(esquemaRegistrarLead, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const { telefone, nome, id_pdv, id_funcionario } = validacao.data;

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
    idPdvFinal = id_pdv ?? auth.sessao.id_pdv;
    idFuncFinal = id_funcionario ?? auth.sessao.id_usuario;
    const func = await prisma.funcionario.findFirst({
      where: { id: idFuncFinal, id_pdv: idPdvFinal, id_empresa: auth.sessao.id_empresa, ativo: true },
    });
    if (!func) {
      return forbidden("Funcionario nao pertence ao seu PDV.");
    }
  } else {
    idPdvFinal = id_pdv;
    idFuncFinal = id_funcionario ?? auth.sessao.id_usuario;
    const func = await prisma.funcionario.findFirst({
      where: { id: idFuncFinal, id_empresa: auth.sessao.id_empresa, ativo: true },
    });
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

  try {
    const lead = await prisma.lead.create({
      data: {
        id: randomUUID(),
        nome: nome ?? telefone,
        telefone,
        id_empresa: auth.sessao.id_empresa,
        id_funcionario: idFuncFinal,
        id_pdv: idPdvFinal ?? null,
        id_estagio: estagioIndefinido.id,
        origem: "MANUAL",
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar lead a partir de orphan:", error);
    return serverError("Erro ao registrar lead.");
  }
}
