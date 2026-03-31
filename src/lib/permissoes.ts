import { NextRequest, NextResponse } from "next/server";
import { obterSessaoNaRequest } from "@/lib/autenticacao";
import { SessaoToken } from "@/lib/tipos";
import { prisma } from "@/lib/prisma";
import { calcularEstadoTrial, podeAcessarSistema, type DadosTrial } from "@/lib/trial";

function isAdmin(sessao: SessaoToken) {
  return sessao.perfil === "EMPRESA";
}

export async function verificarUsuarioExiste(sessao: SessaoToken): Promise<boolean> {
  try {
    if (sessao.perfil === "EMPRESA") {
      const empresa = await prisma.empresa.findUnique({
        where: { id: sessao.id_usuario },
        select: { id: true },
      });
      return empresa !== null;
    }

    const funcionario = await prisma.funcionario.findUnique({
      where: { id: sessao.id_usuario },
      select: { id: true, ativo: true },
    });

    return funcionario !== null && funcionario.ativo === true;
  } catch {
    return false;
  }
}

export async function verificarTrialExpirado(sessao: SessaoToken): Promise<{
  expirado: boolean;
  dadosTrial?: ReturnType<typeof calcularEstadoTrial>;
}> {
  if (sessao.perfil !== "EMPRESA") {
    return { expirado: false };
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: sessao.id_empresa },
    select: {
      status_assinatura: true,
      trial_inicio: true,
      trial_fim: true,
      assinatura_inicio: true,
      assinatura_fim: true,
      plano: true,
    },
  }) as unknown as DadosTrial | null;

  if (!empresa) {
    return { expirado: true };
  }

  if (!empresa) {
    return { expirado: true };
  }

  return { expirado: !podeAcessarSistema(empresa), dadosTrial: calcularEstadoTrial(empresa) };
}

export async function exigirSessao(request: NextRequest): Promise<
  | { sessao: SessaoToken; erro: null }
  | { sessao: null; erro: NextResponse }
> {
  const sessao = await obterSessaoNaRequest(request);
  if (!sessao) {
    return {
      sessao: null,
      erro: NextResponse.redirect(new URL("/login", request.url)),
    };
  }

  const usuarioValido = await verificarUsuarioExiste(sessao);
  if (!usuarioValido) {
    return {
      sessao: null,
      erro: NextResponse.redirect(new URL("/login", request.url)),
    };
  }

  return { sessao, erro: null };
}

export function podeGerenciarEmpresa(sessao: SessaoToken) {
  return isAdmin(sessao);
}

export function podeAdicionarFuncionario(sessao: SessaoToken) {
  // EMPRESA pode adicionar qualquer funcionário em qualquer PDV
  if (sessao.perfil === "EMPRESA") {
    return { pode: true, idPdvPermitido: null };
  }
  // GERENTE pode adicionar apenas COLABORADOR no próprio PDV
  if (sessao.perfil === "GERENTE" && sessao.id_pdv) {
    return { pode: true, idPdvPermitido: sessao.id_pdv };
  }
  return { pode: false, idPdvPermitido: null };
}

export function podeVerEquipe(sessao: SessaoToken) {
  return sessao.perfil === "EMPRESA" || sessao.perfil === "GERENTE";
}

export function podeEditarEquipe(sessao: SessaoToken) {
  // EMPRESA pode editar qualquer funcionário
  if (sessao.perfil === "EMPRESA") {
    return true;
  }
  // GERENTE pode editar (mas a API deve validar o PDV)
  if (sessao.perfil === "GERENTE" && sessao.id_pdv) {
    return true;
  }
  return false;
}

export function podeInativarComReatribuicao(sessao: SessaoToken) {
  // EMPRESA pode inativar qualquer funcionário
  if (sessao.perfil === "EMPRESA") {
    return true;
  }
  // GERENTE pode inativar apenas funcionários do próprio PDV (validação adicional na API)
  if (sessao.perfil === "GERENTE" && sessao.id_pdv) {
    return true;
  }
  return false;
}

export function podeExecutarAcoesEmLote(sessao: SessaoToken) {
  return sessao.perfil === "EMPRESA" || (sessao.perfil === "GERENTE" && Boolean(sessao.id_pdv));
}

export function podeAprovarLead(sessao: SessaoToken) {
  return isAdmin(sessao) || sessao.perfil === "GERENTE";
}

export function podeAcessarPainelMetas(sessao: SessaoToken) {
  return isAdmin(sessao) || sessao.perfil === "GERENTE";
}

export function podeAcessarMinhasMetas(sessao: SessaoToken) {
  return sessao.perfil === "COLABORADOR";
}

export function podeDefinirMetaGlobal(sessao: SessaoToken) {
  return isAdmin(sessao);
}

export function podeGerenciarMetaDoPdv(sessao: SessaoToken, idPdvAlvo: string) {
  if (isAdmin(sessao)) {
    return true;
  }

  return sessao.perfil === "GERENTE" && Boolean(sessao.id_pdv) && sessao.id_pdv === idPdvAlvo;
}

export async function podeGerenciarMetaIndividual(sessao: SessaoToken, idFuncionarioAlvo: string) {
  if (isAdmin(sessao)) {
    return true;
  }

  if (sessao.perfil !== "GERENTE" || !sessao.id_pdv) {
    return false;
  }

  const funcionario = await prisma.funcionario.findFirst({
    where: {
      id: idFuncionarioAlvo,
      id_empresa: sessao.id_empresa,
      id_pdv: sessao.id_pdv,
    },
    select: { id: true },
  });

  return Boolean(funcionario);
}

export function podeVerMetaDeOutros(sessao: SessaoToken) {
  return sessao.perfil !== "COLABORADOR";
}

export function podeVerValoresAbsolutosMetas(sessao: SessaoToken) {
  return isAdmin(sessao) || sessao.perfil === "GERENTE";
}

export function podeGerenciarRecursoNoPdv(sessao: SessaoToken, idPdvRecurso?: string | null) {
  if (sessao.perfil !== "GERENTE") {
    return true;
  }

  if (!sessao.id_pdv || !idPdvRecurso) {
    return false;
  }

  return sessao.id_pdv === idPdvRecurso;
}

export function podeAdicionarColaboradorNoPdv(
  sessao: SessaoToken,
  cargo: string,
  idPdv: string,
) {
  if (sessao.perfil === "EMPRESA") {
    return true;
  }

  if (sessao.perfil !== "GERENTE") {
    return false;
  }

  return cargo === "COLABORADOR" && Boolean(sessao.id_pdv) && sessao.id_pdv === idPdv;
}

export function podeEditarFuncionarioNoPdv(
  sessao: SessaoToken,
  idPdvFuncionario: string,
  cargoFuncionario: string,
  cargoNovo: string,
  idPdvNovo: string,
) {
  if (sessao.perfil === "EMPRESA") {
    return true;
  }

  if (sessao.perfil !== "GERENTE") {
    return false;
  }

  if (!sessao.id_pdv || sessao.id_pdv !== idPdvFuncionario) {
    return false;
  }

  if (cargoFuncionario !== "COLABORADOR") {
    return false;
  }

  return cargoNovo === "COLABORADOR" && idPdvNovo === idPdvFuncionario;
}

export function podeVerAuditoriaEquipe(sessao: SessaoToken) {
  return sessao.perfil === "EMPRESA" || sessao.perfil === "GERENTE";
}

export function respostaSemPermissao() {
  return NextResponse.json({ erro: "Sem permissao." }, { status: 403 });
}

export async function whereLeadsPorPerfil(sessao: SessaoToken) {
  // COLABORADOR: only sees leads where they are the responsible
  if (sessao.perfil === "COLABORADOR") {
    return {
      id_empresa: sessao.id_empresa,
      id_funcionario: sessao.id_usuario,
    };
  }

  // GERENTE: sees leads from their PDV only
  if (sessao.perfil === "GERENTE" && sessao.id_pdv) {
    const funcionariosDoPdv = await prisma.funcionario.findMany({
      where: { id_pdv: sessao.id_pdv },
      select: { id: true },
    });
    const idsFuncionarios = funcionariosDoPdv.map((f) => f.id);

    return {
      id_empresa: sessao.id_empresa,
      id_funcionario: { in: idsFuncionarios },
    };
  }

  // EMPRESA: sees all company leads
  return { id_empresa: sessao.id_empresa };
}

export async function whereNegociosPorPerfil(sessao: SessaoToken) {
  if (sessao.perfil === "COLABORADOR") {
    return {
      id_empresa: sessao.id_empresa,
      id_funcionario: sessao.id_usuario,
    };
  }

  if (sessao.perfil === "GERENTE" && sessao.id_pdv) {
    const funcionariosDoPdv = await prisma.funcionario.findMany({
      where: { id_pdv: sessao.id_pdv },
      select: { id: true },
    });
    const idsFuncionarios = funcionariosDoPdv.map((f) => f.id);

    return {
      id_empresa: sessao.id_empresa,
      id_funcionario: { in: idsFuncionarios },
    };
  }

  return { id_empresa: sessao.id_empresa };
}
