"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { BarChart3, Blocks, LayoutGrid, MessageCircle, Package, Settings2, Target, Users, WalletCards, Zap } from "lucide-react";
import { BotaoSair } from "@/components/botao-sair";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { obterItemIntegracoesNavegacao, podeExibirIntegracoesNaNavegacao } from "@/modules/integracoes/navegacao";
import { usePendenciasGlobais } from "@/modules/kanban/hooks/use-pendencias-globais";
import { TOUR_TARGETS } from "@/modules/onboarding/lib/selectors";
import type { DadosUsuarioLogado } from "@/lib/autenticacao";
import type { SessaoToken } from "@/lib/tipos";

type ItemMenu = { href: string; label: string; descricao: string; icon: React.ComponentType<{ className?: string }>; tourTarget?: string; children?: ItemMenu[] };
type Props = { sessao: SessaoToken; dadosUsuario: DadosUsuarioLogado | null };
type Secao = { titulo: string; itens: ItemMenu[] };

const SIGLA_PERFIL: Record<SessaoToken["perfil"], string> = { EMPRESA: "ADM", GERENTE: "GTE", COLABORADOR: "CLB" };
const LABEL_PERFIL: Record<SessaoToken["perfil"], string> = { EMPRESA: "Administrador", GERENTE: "Gerente", COLABORADOR: "Colaborador" };

function gerarIniciais(nome: string | undefined, perfil: SessaoToken["perfil"]) { const nomeTratado = nome?.trim(); if (!nomeTratado) return SIGLA_PERFIL[perfil]; const partesNome = nomeTratado.split(/\s+/).filter(Boolean); if (partesNome.length === 1) return partesNome[0].slice(0, 2).toUpperCase(); return `${partesNome[0][0] ?? ""}${partesNome[partesNome.length - 1][0] ?? ""}`.toUpperCase(); }

function getItemDescricao(label: string) { const mapa: Record<string, string> = { Resumo: "Visão geral da operação", Leads: "Carteira e originação", Produtos: "Catálogo de produtos e serviços", Negócios: "Pipeline e movimentações", Recebimentos: "Fluxo financeiro e caixa", Equipe: "Gestão de pessoas e metas", Metas: "Objetivos e acompanhamento", "Minhas Metas": "Acompanhamento individual", Integrações: "Conexões e agenda externa", WhatsApp: "Automação e atendimento", Automações: "Regras e gatilhos", Configurações: "Preferências da empresa" }; return mapa[label] ?? "Acesso rápido da área"; }

function NavItem({ item, ativo, onNavigate, resumo }: { item: ItemMenu; ativo: boolean; onNavigate: () => void; resumo?: { total: number; porGravidade: Record<string, number> } | null }) {
  const Icone = item.icon; const temFilhos = Boolean(item.children?.length);
  const badge = item.href === "/kanban" && resumo?.total ? resumo.total : null;

  if (temFilhos) {
    return (
      <Popover>
        <Tooltip content={<><span className="block text-[11px] font-semibold text-[var(--text-primary)]">{item.label}</span><span className="block text-[10px] leading-4 text-[var(--text-secondary)]">{item.descricao}</span></>}>
          <PopoverTrigger
            aria-label={`${item.label}: ${item.descricao}`}
            className={cn("group relative flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-transparent text-[var(--text-secondary)] transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-[var(--ease-productive)] hover:-translate-y-[1px] hover:border-[var(--border-subtle)] hover:bg-white/5 hover:text-[var(--text-primary)] active:scale-[0.98]", ativo && "border-[color:rgba(139,92,246,0.28)] bg-[var(--brand-soft)] text-[var(--text-primary)] shadow-[0_12px_30px_-22px_rgba(139,92,246,0.7)]")}
          >
            <Icone className={cn("h-[18px] w-[18px]", ativo && "text-[var(--brand)]")} />
            {badge ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--warning)] px-1 text-[9px] font-semibold text-[#09090b]">{badge > 9 ? "9+" : badge}</span> : null}
          </PopoverTrigger>
        </Tooltip>
        <PopoverContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">{item.descricao}</p>
            </div>
            <div className="space-y-1">
              {item.children?.map((child) => {
                const ChildIcon = child.icon; const childAtivo = false;
                return (
                  <Link key={child.href} href={child.href} onClick={onNavigate} className={cn("flex items-center gap-2 rounded-[var(--radius-control)] border border-transparent px-3 py-2 text-[13px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-subtle)] hover:bg-white/5 hover:text-[var(--text-primary)]", childAtivo && "border-[color:rgba(139,92,246,0.22)] bg-[var(--brand-soft)] text-[var(--text-primary)]")}>
                    <ChildIcon className={cn("h-4 w-4", childAtivo && "text-[var(--brand)]")} />
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip content={<><span className="block text-[11px] font-semibold text-[var(--text-primary)]">{item.label}</span><span className="block text-[10px] leading-4 text-[var(--text-secondary)]">{item.descricao}</span></>}>
      <Link href={item.href} onClick={onNavigate} data-tour={item.tourTarget} aria-label={`${item.label}: ${item.descricao}`} className={cn("relative flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-transparent text-[var(--text-secondary)] transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-[var(--ease-productive)] hover:-translate-y-[1px] hover:border-[var(--border-subtle)] hover:bg-white/5 hover:text-[var(--text-primary)] active:scale-[0.98]", ativo && "border-[color:rgba(139,92,246,0.28)] bg-[var(--brand-soft)] text-[var(--text-primary)] shadow-[0_12px_30px_-22px_rgba(139,92,246,0.7)]") }>
        <Icone className={cn("h-[18px] w-[18px]", ativo && "text-[var(--brand)]")} />
        {badge ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-semibold text-white">{badge > 9 ? "9+" : badge}</span> : null}
      </Link>
    </Tooltip>
  );
}

export function SidebarPrincipal({ sessao, dadosUsuario }: Props) {
  const pathname = usePathname();
  const { resumo } = usePendenciasGlobais();
  const onNavigate = () => undefined;
  const itemIntegracoes = obterItemIntegracoesNavegacao();

  const secoes: Secao[] = useMemo(() => [
    { titulo: "GERAL", itens: [{ href: "/resumo", label: "Resumo", descricao: getItemDescricao("Resumo"), icon: BarChart3, tourTarget: TOUR_TARGETS.sidebarResumo }] },
    { titulo: "OPERAÇÃO", itens: [
      { href: "/leads", label: "Leads", descricao: getItemDescricao("Leads"), icon: Users, tourTarget: TOUR_TARGETS.sidebarLeads },
      { href: "/produtos", label: "Produtos", descricao: "Catálogo de produtos e serviços", icon: Package },
      { href: "/kanban", label: "Negócios", descricao: getItemDescricao("Negócios"), icon: LayoutGrid, tourTarget: TOUR_TARGETS.sidebarNegocios },
      ...(sessao.perfil === "EMPRESA" ? [{ href: "/recebimentos", label: "Recebimentos", descricao: getItemDescricao("Recebimentos"), icon: WalletCards }] : []),
      ...(sessao.perfil !== "COLABORADOR" ? [{ href: "/equipe", label: "Equipe", descricao: getItemDescricao("Equipe"), icon: Target, tourTarget: TOUR_TARGETS.sidebarEquipe }] : [{ href: "/minhas-metas", label: "Minhas Metas", descricao: getItemDescricao("Minhas Metas"), icon: Target }]),
    ] },
    { titulo: "SISTEMA", itens: [
      ...(podeExibirIntegracoesNaNavegacao(sessao.perfil) ? [{ href: itemIntegracoes.href, label: itemIntegracoes.label, descricao: itemIntegracoes.descricao, icon: Blocks }] : []),
      ...(sessao.perfil === "EMPRESA" || sessao.perfil === "GERENTE" ? [{ href: "/whatsapp", label: "WhatsApp", descricao: getItemDescricao("WhatsApp"), icon: MessageCircle, tourTarget: TOUR_TARGETS.sidebarWhatsapp }] : []),
      ...(sessao.perfil === "EMPRESA" || sessao.perfil === "GERENTE" ? [{ href: "/automacoes", label: "Automações", descricao: getItemDescricao("Automações"), icon: Zap }] : []),
      ...(sessao.perfil === "EMPRESA" ? [{ href: "/configs", label: "Configurações", descricao: getItemDescricao("Configurações"), icon: Settings2, tourTarget: TOUR_TARGETS.sidebarConfigs }] : []),
    ] },
  ], [itemIntegracoes.descricao, itemIntegracoes.href, itemIntegracoes.label, sessao.perfil]);

  const nomeExibicao = dadosUsuario?.nome?.trim() || "Sem nome";
  const cargoExibicao = dadosUsuario?.cargo?.trim() || LABEL_PERFIL[sessao.perfil];
  const iniciaisNome = gerarIniciais(dadosUsuario?.nome, sessao.perfil);
  const nomeEmpresaExibicao = dadosUsuario?.nomeEmpresa?.trim();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[4.75rem] shrink-0 p-2 lg:block">
      <div className="relative flex h-full flex-col rounded-[24px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.98))] p-3 shadow-[var(--shadow-overlay)]">
        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_28%)] opacity-80" />
        <div className="relative flex justify-center pb-4">
          <div className="relative h-10 w-10 overflow-hidden rounded-[14px] border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]"><Image src="/logo.png" alt="HYPE CRM" fill className="object-cover" /></div>
        </div>
        <nav className="relative flex flex-1 flex-col items-center gap-2" aria-label="Navegação principal">
          {secoes.flatMap((secao) => secao.itens).map((item) => {
            const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return <NavItem key={item.href} item={item} ativo={ativo} onNavigate={onNavigate} resumo={resumo ?? undefined} />;
          })}
        </nav>
        <div className="relative mt-auto flex flex-col items-center gap-3 pt-3">
          <Tooltip content={<span>{nomeExibicao}<br /><span className="text-[10px] text-[var(--text-tertiary)]">{cargoExibicao}</span></span>}>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:rgba(139,92,246,0.3)] bg-[linear-gradient(135deg,rgba(139,92,246,0.9),rgba(34,211,238,0.7))] text-[11px] font-semibold uppercase text-[#09090b] shadow-[0_12px_24px_-10px_rgba(139,92,246,0.6)]" aria-label={`${nomeExibicao}, ${cargoExibicao}`}>
              {iniciaisNome}
            </button>
          </Tooltip>
          {nomeEmpresaExibicao ? <span className="max-w-full truncate rounded-full border border-[var(--border-subtle)] bg-white/5 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">{nomeEmpresaExibicao}</span> : null}
          <BotaoSair apenasIcone className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </aside>
  );
}
