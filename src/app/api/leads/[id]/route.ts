import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, podeGerenciarRecursoNoPdv, whereLeadsPorPerfil } from "@/lib/permissoes";
import { esquemaAtualizarLead, esquemaRemoverLead } from "@/lib/validacoes";
import { badRequest, forbidden, notFound } from "@/lib/api/http";
import { parseJson, validateBody } from "@/lib/api/route-validation";
import {
  atualizarLeadContato,
  desativarLeadContato,
  listarNegociosDoLead,
  obterLeadContatoPorId,
} from "@/lib/leads";
import { desativarNegocio, listarNegociosPrincipaisDoLead } from "@/lib/negocios";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { id } = await params;
  const whereLeads = await whereLeadsPorPerfil(auth.sessao);
  const lead = await obterLeadContatoPorId({
    idEmpresa: auth.sessao.id_empresa,
    idLead: id,
    where: whereLeads,
  });

  if (!lead) {
    return notFound("Lead nao encontrado.");
  }

  const negocios = await listarNegociosDoLead({
    idEmpresa: auth.sessao.id_empresa,
    idLead: lead.id,
  });

  return NextResponse.json({
    lead: {
      ...lead,
      negocio: negocios[0] ?? null,
    },
  });
}

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

  const validacao = validateBody(esquemaAtualizarLead, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const dadosValidados = validacao.data;
  const whereLeads = await whereLeadsPorPerfil(auth.sessao);
  const lead = await obterLeadContatoPorId({
    idEmpresa: auth.sessao.id_empresa,
    idLead: id,
    where: whereLeads,
  });

  if (!lead) {
    return notFound("Lead nao encontrado.");
  }

  let idFuncionarioDestino = dadosValidados.id_funcionario;
  if (auth.sessao.perfil === "COLABORADOR") {
    idFuncionarioDestino = auth.sessao.id_usuario;
  }

  if (idFuncionarioDestino && idFuncionarioDestino !== lead.id_funcionario) {
    const funcionarioDestino = await prisma.funcionario.findFirst({
      where: {
        id: idFuncionarioDestino,
        id_empresa: auth.sessao.id_empresa,
        ativo: true,
      },
      select: { id: true, id_pdv: true },
    });

    if (!funcionarioDestino) {
      return badRequest("Funcionario invalido.");
    }

    if (!podeGerenciarRecursoNoPdv(auth.sessao, funcionarioDestino.id_pdv)) {
      return forbidden("Voce nao pode transferir este lead para este colaborador.");
    }
  }

  try {
    const atualizado = await atualizarLeadContato({
      idEmpresa: auth.sessao.id_empresa,
      idLead: lead.id,
      nome: dadosValidados.nome,
      telefone: dadosValidados.telefone,
      email: dadosValidados.email,
      fonte: dadosValidados.fonte,
      empresaOrigem: dadosValidados.empresa_origem,
      observacoes: dadosValidados.observacoes,
      idFuncionario: idFuncionarioDestino,
      ativo: dadosValidados.ativo,
    });

    if (!atualizado) {
      return notFound("Lead nao encontrado.");
    }

    return NextResponse.json({ lead: atualizado });
  } catch (erro) {
    return badRequest(erro instanceof Error ? erro.message : "Erro ao atualizar lead.");
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = validateBody(esquemaRemoverLead, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const { id } = await params;
  const whereLeads = await whereLeadsPorPerfil(auth.sessao);
  const lead = await obterLeadContatoPorId({
    idEmpresa: auth.sessao.id_empresa,
    idLead: id,
    where: whereLeads,
    somenteAtivos: false,
  });

  if (!lead) {
    return notFound("Lead nao encontrado.");
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const leadRemovido = await desativarLeadContato({
      idEmpresa: auth.sessao.id_empresa,
      idLead: lead.id,
      client: tx,
    });

    if (!leadRemovido) {
      return null;
    }

    let negociosRemovidos = 0;
    if (validacao.data.remover_negocios_vinculados) {
      const idsNegocios = new Set<string>();
      if (lead.id_negocio) {
        idsNegocios.add(lead.id_negocio);
      }

      const negociosPrincipais = await listarNegociosPrincipaisDoLead({
        idEmpresa: auth.sessao.id_empresa,
        idLead: lead.id,
        client: tx,
      });

      for (const negocio of negociosPrincipais) {
        idsNegocios.add(negocio.id);
      }

      for (const idNegocio of idsNegocios) {
        const negocioRemovido = await desativarNegocio({
          idEmpresa: auth.sessao.id_empresa,
          idNegocio,
          client: tx,
          removerLeadsVinculados: false,
        });

        if (negocioRemovido) {
          negociosRemovidos++;
        }
      }
    }

    return {
      negociosRemovidos,
    };
  });

  if (!resultado) {
    return notFound("Lead nao encontrado.");
  }

  return NextResponse.json({
    sucesso: true,
    negocios_removidos: resultado.negociosRemovidos,
  });
}
