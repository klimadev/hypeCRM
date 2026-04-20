import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessaoToken } from "@/lib/tipos";

export type DadosUsuarioLogado = {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  nomeEmpresa: string;
};

export const NOME_COOKIE_SESSAO = "hype_sessao";

const segredo = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "segredo-dev-trocar-em-producao",
);

export async function criarTokenSessao(sessao: SessaoToken) {
  return new SignJWT(sessao)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(segredo);
}

export async function validarTokenSessao(token: string) {
  try {
    const { payload } = await jwtVerify(token, segredo);
    return payload as SessaoToken;
  } catch {
    return null;
  }
}

export async function validarSuperAdmin(sessao: SessaoToken | null): Promise<boolean> {
  if (!sessao) return false;
  
  if (sessao.perfil === "EMPRESA") {
    const empresa = await prisma.empresa.findUnique({
      where: { id: sessao.id_usuario },
      select: { isSuperAdmin: true },
    });
    return empresa?.isSuperAdmin === true;
  }
  
  return false;
}

export function definirCookieSessao(resposta: NextResponse, token: string) {
  resposta.cookies.set(NOME_COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function limparCookieSessao(resposta: NextResponse) {
  resposta.cookies.set(NOME_COOKIE_SESSAO, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: new Date(0),
  });
}

export async function obterSessaoNoServidor() {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_COOKIE_SESSAO)?.value;
  if (!token) {
    return null;
  }

  return validarTokenSessao(token);
}

export async function obterSessaoNaRequest(request: NextRequest) {
  const token = request.cookies.get(NOME_COOKIE_SESSAO)?.value;
  if (!token) {
    return null;
  }

  return validarTokenSessao(token);
}

export async function obterDadosUsuarioLogado(
  sessao: SessaoToken,
): Promise<DadosUsuarioLogado | null> {
  try {
    if (sessao.perfil === "EMPRESA") {
      const empresa = await prisma.empresa.findUnique({
        where: { id: sessao.id_usuario },
      });

      if (!empresa) {
        return null;
      }

      const cargoExibido = sessao.isSuperAdmin ? "Super Admin" : "Administrador";

      return {
        id: empresa.id,
        nome: empresa.nome,
        email: empresa.email,
        cargo: cargoExibido,
        nomeEmpresa: empresa.nome,
      };
    }

    // GERENTE e COLABORADOR: id_usuario refere-se ao ID do funcionário
    const funcionario = await prisma.funcionario.findUnique({
      where: { id: sessao.id_usuario },
      include: { Empresa: true },
    }) as unknown as {
      id: string;
      nome: string;
      email: string;
      Empresa: { nome: string };
    } | null;

    if (!funcionario) {
      return null;
    }

    // Normaliza cargo baseado no perfil real do usuário no sistema
    const cargoExibido = sessao.perfil === "GERENTE" ? "Gerente" 
      : sessao.perfil === "COLABORADOR" ? "Colaborador"
      : "Administrador";

    return {
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      cargo: cargoExibido,
      nomeEmpresa: funcionario.Empresa.nome,
    };
  } catch {
    return null;
  }
}
