import type { AcaoAutomacaoInput } from "@/lib/validacoes";
import { prisma } from "@/lib/prisma";

export async function validarRelacionamentosAutomacao(params: {
  idEmpresa: string;
  idEstagioDestino?: string;
  acoes?: AcaoAutomacaoInput[];
}): Promise<string | null> {
  if (params.idEstagioDestino) {
    const estagio = await prisma.estagioFunil.findFirst({
      where: {
        id: params.idEstagioDestino,
        id_empresa: params.idEmpresa,
      },
      select: { id: true },
    });

    if (!estagio) {
      return "Estagio destino invalido.";
    }
  }

  const idsInstancia = Array.from(
    new Set(
      (params.acoes ?? [])
        .map((acao) => acao.id_instancia_whatsapp?.trim())
        .filter((valor): valor is string => Boolean(valor)),
    ),
  );

  if (idsInstancia.length > 0) {
    const instancias = await prisma.whatsappInstancia.findMany({
      where: {
        id_empresa: params.idEmpresa,
        id: { in: idsInstancia },
      },
      select: { id: true },
    });

    if (instancias.length !== idsInstancia.length) {
      return "Instancia WhatsApp invalida.";
    }
  }

  const idsLeadDestino = Array.from(
    new Set(
      (params.acoes ?? [])
        .map((acao) => acao.id_lead_destino?.trim())
        .filter((valor): valor is string => Boolean(valor)),
    ),
  );

  if (idsLeadDestino.length > 0) {
    const leads = await prisma.lead.findMany({
      where: {
        id_empresa: params.idEmpresa,
        id: { in: idsLeadDestino },
      },
      select: { id: true },
    });

    if (leads.length !== idsLeadDestino.length) {
      return "Lead destino invalido.";
    }
  }

  return null;
}
