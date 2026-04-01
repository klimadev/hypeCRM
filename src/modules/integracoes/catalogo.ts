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
      disponibilidade: "disponivel",
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
    {
      slug: "instagram",
      nome: "Instagram",
      tituloCurto: "Mensageria e presenca social oficial",
      resumoCurto: "Conecte o Instagram Business oficial da empresa via OAuth da Meta e veja a conta salva no CRM.",
      descricao: "Inicia o Instagram Business Login, troca o code por token no callback oficial e mostra a conta conectada vinculada a empresa atual.",
      categoria: "Social",
      href: "/integracoes/instagram",
      disponibilidade: "disponivel",
      statusLabel: "Disponivel agora",
      destaque: "Usa o callback oficial da Meta para salvar e exibir a conta conectada diretamente no CRM.",
      acaoLabel: "Abrir integracao",
      recursos: [
        "OAuth oficial do Instagram Business Login com callback em producao",
        "Persistencia da conta conectada por empresa com exibicao do perfil salvo",
        "Remocao manual da conta conectada direto na tela de integracoes",
      ],
      perfisPermitidos: PERFIS_GESTAO,
    },
  ];
}
