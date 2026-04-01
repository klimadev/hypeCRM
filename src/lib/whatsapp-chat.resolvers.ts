import { prisma } from "@/lib/prisma";
import { whereLeadsPorPerfil } from "@/lib/permissoes";
import { normalizarTelefoneParaWhatsapp } from "@/lib/phone";
import type { SessaoToken } from "@/lib/tipos";
import type { InstanciaResolvida, LeadComAcesso, LeadResolvidoPorTelefone } from "./whatsapp-chat.types";

export async function buscarLeadComAcesso(sessao: SessaoToken, leadId: string): Promise<LeadComAcesso | null> {
  const whereLeads = await whereLeadsPorPerfil(sessao);
  return prisma.lead.findFirst({
    where: {
      ...whereLeads,
      id: leadId,
    },
    select: {
      id: true,
      id_empresa: true,
      telefone: true,
      nome: true,
    },
  });
}

export async function buscarLeadPorTelefoneComAcesso(
  sessao: SessaoToken,
  telefoneOuJid: string,
): Promise<LeadResolvidoPorTelefone | null> {
  const whereLeads = await whereLeadsPorPerfil(sessao);
  const normalizado = normalizarTelefoneParaWhatsapp(telefoneOuJid);
  const candidatos = new Set<string>();
  const bruto = telefoneOuJid.replace(/\D/g, "");

  if (bruto) candidatos.add(bruto);
  if (normalizado.waNumber) candidatos.add(normalizado.waNumber);
  if (candidatos.size === 0) return null;

  const leads = await prisma.lead.findMany({
    where: {
      ...whereLeads,
      OR: Array.from(candidatos).map((numero) => ({ telefone: { contains: numero } })),
    },
    select: {
      id: true,
      nome: true,
      telefone: true,
      origem: true,
      EstagioFunil: {
        select: { nome: true },
      },
    },
    take: 10,
  });

  if (leads.length === 0) return null;

  const pontuar = (telefone: string) => {
    const digitos = telefone.replace(/\D/g, "");
    let score = 0;

    for (const candidato of candidatos) {
      if (digitos === candidato) score = Math.max(score, 3);
      else if (digitos.endsWith(candidato) || candidato.endsWith(digitos)) score = Math.max(score, 2);
      else if (digitos.includes(candidato) || candidato.includes(digitos)) score = Math.max(score, 1);
    }

    return score;
  };

  const melhor = leads
    .map((lead) => ({ lead, score: pontuar(lead.telefone) }))
    .sort((a, b) => b.score - a.score)[0];

  if (!melhor || melhor.score === 0) return null;

  return {
    id: melhor.lead.id,
    nome: melhor.lead.nome,
    telefone: melhor.lead.telefone,
    origem: melhor.lead.origem,
    estagioNome: melhor.lead.EstagioFunil?.nome ?? null,
  };
}

export async function resolverInstanciaDoLead(idEmpresa: string, leadId: string): Promise<InstanciaResolvida | null> {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, id_empresa: idEmpresa },
    select: {
      Funcionario: {
        select: {
          Pdv: {
            select: {
              id: true,
              nome: true,
              id_whatsapp_instancia: true,
            },
          },
        },
      },
    },
  });

  const instanciaId = lead?.Funcionario.Pdv.id_whatsapp_instancia;
  if (!instanciaId) return null;

  const instancia = await prisma.whatsappInstancia.findFirst({
    where: { id: instanciaId, id_empresa: idEmpresa },
    select: { id: true, instance_name: true },
  });

  if (!instancia) return null;

  return {
    pdvId: lead.Funcionario.Pdv.id,
    pdvNome: lead.Funcionario.Pdv.nome,
    id: instancia.id,
    instanceName: instancia.instance_name,
  };
}

export async function resolverInstanciaPorTelefone(idEmpresa: string, phoneNumber: string): Promise<InstanciaResolvida | null> {
  const normalizado = normalizarTelefoneParaWhatsapp(phoneNumber);
  const telefoneBusca = normalizado.waNumber || phoneNumber.replace(/\D/g, "");

  if (telefoneBusca) {
    const lead = await prisma.lead.findFirst({
      where: {
        id_empresa: idEmpresa,
        telefone: { contains: telefoneBusca },
      },
      select: {
        Funcionario: {
          select: {
            Pdv: {
              select: {
                id: true,
                nome: true,
                id_whatsapp_instancia: true,
              },
            },
          },
        },
      },
    });

    if (lead?.Funcionario?.Pdv?.id_whatsapp_instancia) {
      const instancia = await prisma.whatsappInstancia.findFirst({
        where: {
          id: lead.Funcionario.Pdv.id_whatsapp_instancia,
          id_empresa: idEmpresa,
        },
        select: {
          id: true,
          instance_name: true,
        },
      });

      if (instancia) {
        console.log(`[resolverInstanciaPorTelefone] Encontrada instância via PDV do lead: ${instancia.instance_name}`);
        return {
          pdvId: lead.Funcionario.Pdv.id,
          pdvNome: lead.Funcionario.Pdv.nome,
          id: instancia.id,
          instanceName: instancia.instance_name,
        };
      }
    }
  }

  const instancia = await prisma.whatsappInstancia.findFirst({
    where: {
      id_empresa: idEmpresa,
      status: { in: ["open", "connecting"] },
    },
    select: {
      id: true,
      instance_name: true,
    },
    orderBy: {
      criado_em: "asc",
    },
  });

  if (!instancia) {
    console.log(`[resolverInstanciaPorTelefone] Nenhuma instância encontrada para empresa ${idEmpresa}`);
    return null;
  }

  console.log(`[resolverInstanciaPorTelefone] Usando instância global: ${instancia.instance_name}`);
  return {
    pdvId: "",
    pdvNome: "",
    id: instancia.id,
    instanceName: instancia.instance_name,
  };
}

export async function buscarPdvDoLead(idEmpresa: string, leadId: string) {
  return prisma.lead.findFirst({
    where: {
      id: leadId,
      id_empresa: idEmpresa,
    },
    select: {
      Funcionario: {
        select: {
          Pdv: {
            select: {
              id: true,
              nome: true,
              id_whatsapp_instancia: true,
            },
          },
        },
      },
    },
  });
}

export function normalizarRemoteJidParaLead(telefone: string) {
  const normalizado = normalizarTelefoneParaWhatsapp(telefone);
  if (!normalizado.valido || !normalizado.waNumber) {
    return { ok: false as const, erro: normalizado.motivoErro ?? "Telefone invalido para WhatsApp." };
  }

  return {
    ok: true as const,
    waNumber: normalizado.waNumber,
    remoteJid: `${normalizado.waNumber}@s.whatsapp.net`,
  };
}
