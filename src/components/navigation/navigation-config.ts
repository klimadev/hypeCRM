import { BarChart3, Blocks, GitBranch, LayoutGrid, MessageCircle, MessageSquare, Package, Settings2, Shield, Target, Users, WalletCards } from "lucide-react";
import type { SessaoToken } from "@/lib/tipos";
import { obterItemIntegracoesNavegacao, podeExibirIntegracoesNaNavegacao } from "@/modules/integracoes/navegacao";
import type { NavigationSection } from "./navigation-types";

const SIGLA_PERFIL: Record<SessaoToken["perfil"], string> = { EMPRESA: "ADM", GERENTE: "GTE", COLABORADOR: "CLB" };
const LABEL_PERFIL: Record<SessaoToken["perfil"], string> = { EMPRESA: "Administrador", GERENTE: "Gerente", COLABORADOR: "Colaborador" };

function getItemDescricao(label: string) {
  const mapa: Record<string, string> = {
    Resumo: "Visão geral da operação",
    Leads: "Carteira e originação",
    Produtos: "Catálogo de produtos e serviços",
    Negócios: "Pipeline e movimentações",
    Recebimentos: "Fluxo financeiro e caixa",
    Equipe: "Gestão de pessoas e metas",
    Metas: "Objetivos e acompanhamento",
    "Minhas Metas": "Acompanhamento individual",
    Integrações: "Conexões e agenda externa",
    Automações: "Builder visual e jornadas",
    WhatsApp: "Automação e atendimento",
    Chat: "Conversas unificadas",
    Configurações: "Preferências da empresa",
  };
  return mapa[label] ?? "Acesso rápido da área";
}

export function gerarIniciais(nome: string | undefined, perfil: SessaoToken["perfil"]) {
  const nomeTratado = nome?.trim();
  if (!nomeTratado) return SIGLA_PERFIL[perfil];
  const partesNome = nomeTratado.split(/\s+/).filter(Boolean);
  if (partesNome.length === 1) return partesNome[0].slice(0, 2).toUpperCase();
  return `${partesNome[0][0] ?? ""}${partesNome[partesNome.length - 1][0] ?? ""}`.toUpperCase();
}

export function obterLabelPerfil(perfil: SessaoToken["perfil"]) {
  return LABEL_PERFIL[perfil];
}

export function construirSecoesNavegacao(sessao: SessaoToken): NavigationSection[] {
  const itemIntegracoes = obterItemIntegracoesNavegacao();
  const secoes: NavigationSection[] = [
    { titulo: "Geral", itens: [{ href: "/resumo", label: "Resumo", descricao: getItemDescricao("Resumo"), icon: BarChart3 }] },
    {
      titulo: "Operação",
      itens: [
        { href: "/leads", label: "Leads", descricao: getItemDescricao("Leads"), icon: Users, limpo: true },
        { href: "/produtos", label: "Produtos", descricao: getItemDescricao("Produtos"), icon: Package },
        { href: "/kanban", label: "Negócios", descricao: getItemDescricao("Negócios"), icon: LayoutGrid, limpo: true },
        { href: "/chat", label: "Chat", descricao: getItemDescricao("Chat"), icon: MessageSquare },
        
        ...(sessao.perfil === "EMPRESA" ? [{ href: "/recebimentos", label: "Recebimentos", descricao: getItemDescricao("Recebimentos"), icon: WalletCards, limpo: true }] : []),
        ...(sessao.perfil !== "COLABORADOR" ? [{ href: "/equipe", label: "Equipe", descricao: getItemDescricao("Equipe"), icon: Target }] : [{ href: "/minhas-metas", label: "Minhas Metas", descricao: getItemDescricao("Minhas Metas"), icon: Target }]),
      ],
    },
    {
      titulo: "Sistema",
        itens: [
          ...(podeExibirIntegracoesNaNavegacao(sessao.perfil) ? [{ href: itemIntegracoes.href, label: itemIntegracoes.label, descricao: itemIntegracoes.descricao, icon: Blocks }] : []),
          ...(sessao.perfil === "EMPRESA" || sessao.perfil === "GERENTE" ? [{ href: "/automacoes", label: "Automações", descricao: getItemDescricao("Automações"), icon: GitBranch }] : []),
          ...(sessao.perfil === "EMPRESA" || sessao.perfil === "GERENTE" ? [{ href: "/whatsapp", label: "WhatsApp", descricao: getItemDescricao("WhatsApp"), icon: MessageCircle }] : []),
          ...(sessao.perfil === "EMPRESA" ? [{ href: "/configs", label: "Configurações", descricao: getItemDescricao("Configurações"), icon: Settings2 }] : []),
        ],
    },
  ];

  if (sessao.isSuperAdmin) {
    secoes.push({
      titulo: "Super Admin",
      itens: [
        { href: "/super-admin/usuarios", label: "Usuários", descricao: "Gerenciamento global de usuários", icon: Shield },
        { href: "/super-admin/feedbacks", label: "Feedbacks", descricao: "Bugs e sugestões", icon: MessageSquare },
      ],
    });
  }

  return secoes;
}
