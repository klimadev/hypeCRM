import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, whereNegociosPorPerfil } from "@/lib/permissoes";
import { esquemaMoverNegocio } from "@/lib/validacoes";
import { badRequest, notFound } from "@/lib/api/http";
import { parseJson, validateBody } from "@/lib/api/route-validation";
import { moverNegocioDeEstagio, montarDtoNegocio, obterNegocioPorId } from "@/lib/negocios";

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

  const validacao = validateBody(esquemaMoverNegocio, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const estagioDestino = await prisma.estagioFunil.findFirst({
    where: {
      id: validacao.data.id_estagio,
      id_empresa: auth.sessao.id_empresa,
    },
    select: { id: true, tipo: true },
  });

  if (!estagioDestino) {
    return notFound("Estagio destino invalido.");
  }

  if (estagioDestino.tipo === "PERDIDO" && !validacao.data.motivo_perda?.trim()) {
    return badRequest("Motivo de perda e obrigatorio.");
  }

  const wherePermitido = await whereNegociosPorPerfil(auth.sessao);
  const negocio = await obterNegocioPorId({
    idEmpresa: auth.sessao.id_empresa,
    idNegocio: id,
    whereExtra: wherePermitido,
  });

  if (!negocio) {
    return notFound("Negocio nao encontrado.");
  }

  try {
    const resultado = await moverNegocioDeEstagio({
      idEmpresa: auth.sessao.id_empresa,
      idNegocio: negocio.id,
      idEstagioDestino: estagioDestino.id,
      motivoPerda: validacao.data.motivo_perda,
    });

    if (!resultado?.negocio) {
      return notFound("Estagio destino invalido.");
    }

    return NextResponse.json({
      negocio: montarDtoNegocio(resultado.negocio),
      noop: resultado.noop,
    });
  } catch (erro) {
    return badRequest(erro instanceof Error ? erro.message : "Nao foi possivel mover o negocio.");
  }
}
