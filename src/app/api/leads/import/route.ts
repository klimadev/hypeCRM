import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden } from "@/lib/api/http";
import { parseJson, validateBody } from "@/lib/api/route-validation";
import { obterEstagioIndefinido } from "@/lib/estagios-fixos";
import { normalizarTelefoneParaWhatsapp } from "@/lib/phone";
import { exigirSessao, podeGerenciarRecursoNoPdv } from "@/lib/permissoes";
import { esquemaImportarLeads } from "@/lib/validacoes";

type LeadImportavel = {
  nome: string;
  telefone: string;
  email: string | null;
  fonte: string | null;
  empresa_origem: string | null;
  observacoes: string | null;
};

function normalizarEmail(email: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

function chaveInternaLead(lead: LeadImportavel) {
  const telefoneNormalizado = normalizarTelefoneParaWhatsapp(lead.telefone);
  const emailNormalizado = normalizarEmail(lead.email);
  return {
    telefone: telefoneNormalizado.valido ? telefoneNormalizado.waNumber : null,
    email: emailNormalizado,
    telefoneValido: telefoneNormalizado.valido,
  };
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const body = await parseJson<unknown>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = validateBody(esquemaImportarLeads, body.data);
  if (!validacao.ok) {
    return validacao.response;
  }

  const dados = validacao.data;
  const idFuncionario = auth.sessao.perfil === "COLABORADOR"
    ? auth.sessao.id_usuario
    : dados.id_funcionario;

  const funcionario = await prisma.funcionario.findFirst({
    where: {
      id: idFuncionario,
      id_empresa: auth.sessao.id_empresa,
      ativo: true,
    },
    select: { id: true, id_pdv: true },
  });

  if (!funcionario) {
    return badRequest("Funcionario invalido.");
  }

  if (!podeGerenciarRecursoNoPdv(auth.sessao, funcionario.id_pdv)) {
    return forbidden("Sem permissao para importar leads para este colaborador.");
  }

  const leadsNormalizados = dados.leads.map<LeadImportavel>((lead) => ({
    nome: lead.nome.trim(),
    telefone: lead.telefone.trim(),
    email: lead.email?.trim() || null,
    fonte: lead.fonte?.trim() || null,
    empresa_origem: lead.empresa_origem?.trim() || null,
    observacoes: lead.observacoes?.trim() || null,
  }));

  const estagio = await obterEstagioIndefinido(auth.sessao.id_empresa);
  const dedupeInternaTelefones = new Set<string>();
  const dedupeInternaEmails = new Set<string>();

  const telefonesConsulta = new Set<string>();
  const emailsConsulta = new Set<string>();

  for (const lead of leadsNormalizados) {
    const chave = chaveInternaLead(lead);
    if (chave.telefone) telefonesConsulta.add(chave.telefone);
    if (chave.email) emailsConsulta.add(chave.email);
  }

  const podeConsultarExistentes = telefonesConsulta.size > 0 || emailsConsulta.size > 0;

  const leadsExistentes = dados.deduplicar && podeConsultarExistentes
    ? await prisma.lead.findMany({
        where: {
          id_empresa: auth.sessao.id_empresa,
          ativo: true,
          OR: [
            telefonesConsulta.size > 0 ? { telefone: { in: Array.from(telefonesConsulta) } } : undefined,
            emailsConsulta.size > 0 ? { email: { in: Array.from(emailsConsulta) } } : undefined,
          ].filter((item): item is NonNullable<typeof item> => Boolean(item)),
        },
        select: { id: true, telefone: true, email: true },
      })
    : [];

  const telefonesExistentes = new Set(
    leadsExistentes
      .map((lead) => normalizarTelefoneParaWhatsapp(lead.telefone))
      .filter((telefone) => telefone.valido && Boolean(telefone.waNumber))
      .map((telefone) => telefone.waNumber)
      .filter((telefone): telefone is string => Boolean(telefone)),
  );
  const emailsExistentes = new Set(
    leadsExistentes
      .map((lead) => normalizarEmail(lead.email))
      .filter((email): email is string => Boolean(email)),
  );

  const paraCriar: Array<LeadImportavel & { telefonePersistido: string }> = [];
  let invalidos = 0;
  let duplicadosNoArquivo = 0;
  let duplicadosNoSistema = 0;

  for (const lead of leadsNormalizados) {
    const telefoneNormalizado = normalizarTelefoneParaWhatsapp(lead.telefone);
    if (!telefoneNormalizado.valido || !telefoneNormalizado.waNumber) {
      invalidos += 1;
      continue;
    }

    const telefoneChave = telefoneNormalizado.waNumber;
    const emailChave = normalizarEmail(lead.email);

    if (dados.deduplicar) {
      if (dedupeInternaTelefones.has(telefoneChave) || (emailChave && dedupeInternaEmails.has(emailChave))) {
        duplicadosNoArquivo += 1;
        continue;
      }

      if (telefonesExistentes.has(telefoneChave) || (emailChave && emailsExistentes.has(emailChave))) {
        duplicadosNoSistema += 1;
        continue;
      }
    }

    dedupeInternaTelefones.add(telefoneChave);
    if (emailChave) dedupeInternaEmails.add(emailChave);

    paraCriar.push({
      ...lead,
      telefonePersistido: telefoneChave,
      email: emailChave,
    });
  }

  if (paraCriar.length === 0) {
    return NextResponse.json({
      criados: 0,
      ignorados: leadsNormalizados.length,
      invalidos,
      duplicadosNoArquivo,
      duplicadosNoSistema,
    });
  }

  await prisma.lead.createMany({
    data: paraCriar.map((lead) => ({
      id: randomUUID(),
      id_empresa: auth.sessao.id_empresa,
      id_funcionario: funcionario.id,
      id_pdv: funcionario.id_pdv,
      id_estagio: estagio.id,
      nome: lead.nome,
      telefone: lead.telefonePersistido,
      email: lead.email,
      fonte: lead.fonte,
      empresa_origem: lead.empresa_origem,
      observacoes: lead.observacoes,
      origem: "MANUAL",
      ativo: true,
      valor_oportunidade: 0,
      probabilidade: 0.5,
      atualizado_em: new Date(),
    })),
  });

  return NextResponse.json({
    criados: paraCriar.length,
    ignorados: leadsNormalizados.length - paraCriar.length,
    invalidos,
    duplicadosNoArquivo,
    duplicadosNoSistema,
  });
}
