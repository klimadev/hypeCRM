import type { SessaoToken } from "@/lib/tipos";

type ItemIntegracoesNavegacao = {
  href: string;
  label: string;
  descricao: string;
};

const PERFIS_COM_ACESSO_INTEGRACOES: SessaoToken["perfil"][] = ["EMPRESA", "GERENTE"];

export function podeExibirIntegracoesNaNavegacao(perfil: SessaoToken["perfil"]) {
  return PERFIS_COM_ACESSO_INTEGRACOES.includes(perfil);
}

export function obterItemIntegracoesNavegacao(): ItemIntegracoesNavegacao {
  return {
    href: "/integracoes",
    label: "Integrações",
    descricao: "Conexões e agenda externa",
  };
}
