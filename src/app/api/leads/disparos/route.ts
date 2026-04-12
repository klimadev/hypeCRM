import { NextRequest, NextResponse } from "next/server";
import { esquemaLeadsDisparoCampanhaCreate, esquemaLeadsDisparoCampanhaListQuery } from "@/lib/validacoes.whatsapp";
import { mensagemErroValidacao } from "@/lib/validacoes";
import { exigirSessao, podeExecutarAcoesEmLote, whereLeadsPorPerfil } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { criarCampanhaDisparoLeads, listarCampanhasDisparoLeads } from "@/lib/leads-disparos";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const validacao = esquemaLeadsDisparoCampanhaListQuery.safeParse(query);
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const campanhas = await listarCampanhasDisparoLeads({
    idEmpresa: auth.sessao.id_empresa,
    limite: validacao.data.limite,
  });

  return NextResponse.json({ campanhas });
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (!podeExecutarAcoesEmLote(auth.sessao)) {
    return NextResponse.json({ erro: "Sem permissao para disparos em lote." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const validacao = esquemaLeadsDisparoCampanhaCreate.safeParse(payload);
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  const data = validacao.data;
  const inicioEm = data.iniciarAgora
    ? new Date(Date.now() + 2 * 60 * 1000).toISOString()
    : new Date(data.inicioEm as string).toISOString();

  const leads = await prisma.lead.findMany({
    where: {
      id_empresa: auth.sessao.id_empresa,
      ativo: true,
      id: { in: data.leadIds },
      ...whereLeadsPorPerfil(auth.sessao),
    },
    select: {
      id: true,
      nome: true,
      telefone: true,
      id_pdv: true,
      id_funcionario: true,
      Funcionario: { select: { id_pdv: true, nome: true } },
      EstagioFunil: { select: { nome: true } },
    },
  });

  if (leads.length === 0) {
    return NextResponse.json({ erro: "Nenhum lead valido encontrado para esta campanha." }, { status: 400 });
  }

  const resultado = await criarCampanhaDisparoLeads({
    idEmpresa: auth.sessao.id_empresa,
    idUsuario: auth.sessao.id_usuario,
    nome: data.nome,
    mensagemTemplate: data.mensagemTemplate,
    iniciarEmIso: inicioEm,
    delayMinSegundos: data.delayMinSegundos,
    delayMaxSegundos: data.delayMaxSegundos,
    jitterMsMax: data.jitterMsMax,
    leads: leads.map((lead) => ({
      id: lead.id,
      nome: lead.nome,
      telefone: lead.telefone,
      id_pdv: lead.id_pdv ?? lead.Funcionario?.id_pdv ?? null,
      id_funcionario: lead.id_funcionario,
      estagioNome: lead.EstagioFunil?.nome ?? "Lead",
      funcionarioNome: lead.Funcionario?.nome ?? "Equipe",
    })),
    pdvInstancias: data.pdvInstancias,
    fallbackInstanciaSemPdvId: data.fallbackInstanciaSemPdvId,
    filtrosSnapshot: data.filtrosSnapshot,
  });

  return NextResponse.json({
    ok: true,
    campanhaId: resultado.campanhaId,
    resumo: resultado.resumo,
    inelegiveis: resultado.inelegiveis,
    inicio: resultado.inicio,
    ultimoAgendamento: resultado.ultimoAgendamento,
  });
}
