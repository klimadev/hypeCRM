import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { exigirSessao, podeGerenciarEmpresa } from "@/lib/permissoes";
import { esquemaCriarPdv } from "@/lib/validacoes";
import { badRequest, forbidden } from "@/lib/api/http";
import { handleRouteError } from "@/lib/api/route-errors";
import { parseJson, validateBody } from "@/lib/api/route-validation";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const podeListarTodosPdvs = podeGerenciarEmpresa(auth.sessao);
  const podeListarPdvGerenciado = auth.sessao.perfil === "GERENTE" && Boolean(auth.sessao.id_pdv);

  if (!podeListarTodosPdvs && !podeListarPdvGerenciado) {
    return forbidden("Sem permissao para listar PDVs.");
  }

  const wherePdvs = podeListarTodosPdvs
    ? { id_empresa: auth.sessao.id_empresa }
    : { id_empresa: auth.sessao.id_empresa, id: auth.sessao.id_pdv ?? undefined };

  const pdvs = await prisma.pdv.findMany({
    where: wherePdvs,
    select: {
      id: true,
      nome: true,
      id_whatsapp_instancia: true,
      WhatsappInstancia: {
        select: {
          id: true,
          nome: true,
          status: true,
        },
      },
      Funcionario: {
        where: {
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          cargo: true,
          ativo: true,
        },
        orderBy: { nome: "asc" },
      },
    },
    orderBy: { nome: "asc" },
  });

  const pdvsFormatados = pdvs.map((pdv) => ({
    ...pdv,
    funcionarios: pdv.Funcionario,
    whatsapp_instancia: pdv.WhatsappInstancia,
  }));

  return NextResponse.json({ pdvs: pdvsFormatados });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  if (!podeGerenciarEmpresa(auth.sessao)) {
    return forbidden("Somente EMPRESA pode alterar PDVs.");
  }

  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }
  const validacao = validateBody(esquemaCriarPdv, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const { nome, id_whatsapp_instancia } = validacao.data;

  if (id_whatsapp_instancia) {
    const instancia = await prisma.whatsappInstancia.findFirst({
      where: {
        id: id_whatsapp_instancia,
        id_empresa: auth.sessao.id_empresa,
      },
      select: { id: true },
    });

    if (!instancia) {
      return badRequest("Instancia WhatsApp invalida para a empresa.");
    }
  }

  try {
    const pdv = await prisma.pdv.create({
      data: {
        id: randomUUID(),
        nome,
        id_empresa: auth.sessao.id_empresa,
        id_whatsapp_instancia: id_whatsapp_instancia ?? null,
      },
    });

    return NextResponse.json({ pdv });
  } catch (erro) {
    return handleRouteError(erro, "Erro ao criar PDV.", "Erro ao criar PDV:");
  }
}
