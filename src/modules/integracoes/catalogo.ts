import type { SessaoToken } from "@/lib/tipos";
import type { IntegracaoCatalogoItem } from "./types";

const PERFIS_GESTAO: SessaoToken["perfil"][] = ["EMPRESA", "GERENTE"];

export function podeAcessarIntegracoes(perfil: SessaoToken["perfil"]) {
  return PERFIS_GESTAO.includes(perfil);
}

export function listarIntegracoesDisponiveis(): IntegracaoCatalogoItem[] {
  return [
    {
      slug: "calcom",
      nome: "Cal.com",
      tituloCurto: "Agendamentos e reunioes",
      resumoCurto: "Use para conectar sua agenda ao CRM.",
      descricao: "Centralize o calendario comercial, valide conexoes da equipe e acompanhe reunioes sem sair do CRM.",
      categoria: "Agenda",
      href: "/integracoes/calcom",
      statusLabel: "Disponivel agora",
      destaque: "Reaproveita a infraestrutura de agendamentos ja existente no HYPE CRM.",
      acaoLabel: "Abrir integracao",
      recursos: [
        "Conexao por API key com validacao de perfil",
        "Painel com proximas reunioes e event types",
        "Fluxo dedicado para testar e remover instancias",
      ],
      perfisPermitidos: PERFIS_GESTAO,
    },
  ];
}
