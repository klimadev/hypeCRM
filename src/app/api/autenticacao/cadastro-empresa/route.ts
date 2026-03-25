import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { criarTokenSessao, definirCookieSessao } from "@/lib/autenticacao";
import {
  esquemaCadastroEmpresa,
  mensagemErroValidacao,
  MAX_REGISTROS_POR_IP,
  JANELA_BLOQUEIO_IP_DIAS,
  TRIAL_DURACAO_DIAS,
} from "@/lib/validacoes";
import { ESTAGIOS_FIXOS_PADRAO } from "@/lib/estagios-fixos";
type CorpoCadastroEmpresa = {
  nome?: string;
  email?: string;
  senha?: string;
};

function extrairIpDoRequest(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email.toLowerCase()).digest("hex");
}

async function verificarBloqueioIp(ipAddress: string) {
  if (ipAddress === "unknown") {
    return { bloqueado: false };
  }

  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - JANELA_BLOQUEIO_IP_DIAS);

  const registrosRecentes = await prisma.registroIP.count({
    where: { ip_address: ipAddress, criado_em: { gte: dataLimite } },
  });

  if (registrosRecentes >= MAX_REGISTROS_POR_IP) {
    return {
      bloqueado: true,
      motivo: `Limite de ${MAX_REGISTROS_POR_IP} registros atingido para este endereco de rede.`,
    };
  }

  return { bloqueado: false };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CorpoCadastroEmpresa;
    const validacao = esquemaCadastroEmpresa.safeParse(body);
    if (!validacao.success) {
      return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
    }

    const nome = validacao.data.nome.trim();
    const email = validacao.data.email.trim().toLowerCase();
    const senha = validacao.data.senha;
    const ipAddress = extrairIpDoRequest(request);
    const emailHash = hashEmail(email);

    const bloqueioIp = await verificarBloqueioIp(ipAddress);
    if (bloqueioIp.bloqueado) {
      return NextResponse.json({ erro: bloqueioIp.motivo }, { status: 429 });
    }

    const jaExiste = await prisma.empresa.findUnique({ where: { email } });
    if (jaExiste) {
      return NextResponse.json({ erro: "Ja existe uma empresa com esse e-mail." }, { status: 409 });
    }

    const emailTrialDuplicado = await prisma.registroIP.findFirst({ where: { email_hash: emailHash } });
    if (emailTrialDuplicado) {
      return NextResponse.json(
        { erro: "Este e-mail ja possui um trial registrado. Faca login ou use outro e-mail." },
        { status: 409 },
      );
    }

    const senha_hash = await bcrypt.hash(senha, 10);
    const agora = new Date();
    const trialFim = new Date(agora);
    trialFim.setDate(trialFim.getDate() + TRIAL_DURACAO_DIAS);

    const empresa = await prisma.$transaction(async (tx) => {
      const novaEmpresa = await tx.empresa.create({
        data: {
          nome,
          email,
          senha_hash,
          status_assinatura: "TRIAL",
          trial_inicio: agora,
          trial_fim: trialFim,
          plano: "trial",
        },
      });

      await tx.estagioFunil.createMany({
        data: ESTAGIOS_FIXOS_PADRAO.map((estagio) => ({
          id_empresa: novaEmpresa.id,
          nome: estagio.nome,
          tipo: estagio.tipo,
          ordem: estagio.ordem,
        })),
      });

      await tx.registroIP.create({
        data: {
          ip_address: ipAddress,
          email_hash: emailHash,
          id_empresa: novaEmpresa.id,
          user_agent: request.headers.get("user-agent") ?? null,
        },
      });

      return novaEmpresa;
    });

    const token = await criarTokenSessao({
      id_usuario: empresa.id,
      id_empresa: empresa.id,
      perfil: "EMPRESA",
      id_pdv: null,
    });

    const resposta = NextResponse.json({ ok: true });
    definirCookieSessao(resposta, token);
    return resposta;
  } catch (erro) {
    if (erro && typeof erro === "object" && "code" in erro) {
      const codigo = (erro as { code?: string }).code;
      if (codigo === "P2002") {
        return NextResponse.json(
          { erro: "Ja existe um cadastro com esses dados. Tente fazer login." },
          { status: 409 },
        );
      }
    }

    console.error("[cadastro-empresa] erro inesperado", erro);
    return NextResponse.json(
      { erro: "Falha ao criar a conta. Tente novamente em instantes." },
      { status: 500 },
    );
  }
}
