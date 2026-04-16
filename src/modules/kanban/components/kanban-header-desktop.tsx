"use client";

import { ArrowUpDown, Bell, BellOff, Filter, Gauge, Megaphone, MessageCircle, PenLine, RefreshCw, Search, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { cn } from "@/lib/utils";
import type { KanbanFilters, KpiKanban, OrdenacaoKanban, OrigemStats, Pipeline, ResumoPendencias } from "../types";
import { PendenciaBadge } from "./pendencia-badge";
import { ActionButton } from "./action-button";
import { NovoNegocioDialog } from "./novo-negocio-dialog";
import { FILTROS_RAPIDOS_KANBAN, filtroRapidoKanbanAtivo, type ContatoDisponivelNegocio, type FiltroRapidoKanban } from "./kanban-header.utils";

type KanbanHeaderDesktopProps = {
  subtitleResumo: string;
  busca: string;
  setBusca: (busca: string) => void;
  inputBuscaRef: React.RefObject<HTMLInputElement | null>;
  ordenacao: OrdenacaoKanban;
  setOrdenacao: (ordenacao: OrdenacaoKanban) => void;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  pdvs: Array<{ id: string; nome: string }>;
  pipelines: Pipeline[];
  pipelineSelecionadaId: string;
  setPipelineSelecionadaId: (pipelineId: string) => void;
  filtros: KanbanFilters;
  setFiltros: (filtros: KanbanFilters) => void;
  resumoPendencias: ResumoPendencias | null;
  modoFocoPendencias: boolean;
  setModoFocoPendencias: (ativo: boolean) => void;
  notificacoesAtivadas: boolean;
  onToggleNotificacoes: () => Promise<void>;
  dialogNovoNegocioAberto: boolean;
  onDialogNovoNegocioChange: (aberto: boolean) => void;
  criarNegocio: (evento: React.FormEvent<HTMLFormElement>) => Promise<void>;
  inputNomeNovoNegocioRef: React.RefObject<HTMLInputElement | null>;
  criandoNegocio: boolean;
  valorNovoNegocio: string;
  setValorNovoNegocio: (valor: string) => void;
  estagioNovoNegocio: string;
  estagioAberto: string;
  setEstagioNovoNegocio: (estagio: string) => void;
  cargoNovoNegocio: { id_funcionario: string } | null;
  setCargoNovoNegocio: (cargo: { id_funcionario: string } | null) => void;
  contatosDisponiveis: ContatoDisponivelNegocio[];
  carregandoContatosDisponiveis: boolean;
  contatosSelecionados: string[];
  setContatosSelecionados: (ids: string[]) => void;
  funcionarios: Array<{ id: string; nome: string }>;
  estagios: Array<{ id: string; nome: string }>;
  erroNovoNegocio: string | null;
  redistribuindoNegociosEmAtendimento?: boolean;
  onRedistribuir?: () => Promise<void>;
  kpis: KpiKanban[];
  pendenciasCriticas: number;
  origemStats: OrigemStats;
  onFiltroRapido: (tipo: FiltroRapidoKanban) => void;
  filtrosAtivos: boolean;
  limparFiltros: () => void;
};

export function KanbanHeaderDesktop(props: KanbanHeaderDesktopProps) {
  const {
    subtitleResumo,
    busca,
    setBusca,
    inputBuscaRef,
    ordenacao,
  setOrdenacao,
  perfil,
  pipelines,
  pipelineSelecionadaId,
  setPipelineSelecionadaId,
  pdvs,
    filtros,
    setFiltros,
    resumoPendencias,
    modoFocoPendencias,
    setModoFocoPendencias,
    notificacoesAtivadas,
    onToggleNotificacoes,
    dialogNovoNegocioAberto,
    onDialogNovoNegocioChange,
    criarNegocio,
    inputNomeNovoNegocioRef,
    criandoNegocio,
    valorNovoNegocio,
    setValorNovoNegocio,
    estagioNovoNegocio,
    estagioAberto,
    setEstagioNovoNegocio,
    cargoNovoNegocio,
    setCargoNovoNegocio,
    contatosDisponiveis,
    carregandoContatosDisponiveis,
    contatosSelecionados,
    setContatosSelecionados,
    funcionarios,
    estagios,
    erroNovoNegocio,
    redistribuindoNegociosEmAtendimento,
    onRedistribuir,
    kpis,
    pendenciasCriticas,
    origemStats,
    onFiltroRapido,
    filtrosAtivos,
    limparFiltros,
  } = props;

  return (
    <div className="hidden md:block">
      <ModulePageHeader
        title="Kanban comercial"
        subtitle={subtitleResumo}
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {pipelines.length > 1 ? (
              <Select value={pipelineSelecionadaId} onValueChange={setPipelineSelecionadaId}>
                <SelectTrigger className="h-9 w-56 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
                  <SelectValue placeholder="Selecione o funil" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                ref={inputBuscaRef}
                type="text"
                placeholder="Buscar negócio... (Ctrl+K ou /)"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-9 w-48 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-[var(--focus-ring)]"
              />
              {busca ? (
                <button onClick={() => setBusca("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.05)] p-0.5 hover:bg-[color:rgba(255,255,255,0.08)]">
                  <X className="h-3 w-3 text-[var(--text-secondary)]" />
                </button>
              ) : null}
            </div>

            <Select value={ordenacao} onValueChange={(v) => setOrdenacao(v as OrdenacaoKanban)}>
              <SelectTrigger className="h-9 w-36 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recente">Mais recente</SelectItem>
                <SelectItem value="antigo">Mais antigo</SelectItem>
                <SelectItem value="valor_maior">Maior valor</SelectItem>
                <SelectItem value="valor_menor">Menor valor</SelectItem>
                <SelectItem value="nome">Nome A-Z</SelectItem>
              </SelectContent>
            </Select>

            {perfil === "EMPRESA" && pdvs.length > 0 ? (
              <Select value={filtros.pdv ?? "todos"} onValueChange={(v) => setFiltros({ ...filtros, pdv: v === "todos" ? null : v })}>
                <SelectTrigger className="h-9 w-36 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
                  <Store className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Loja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as lojas</SelectItem>
                  {pdvs.map((pdv) => (
                    <SelectItem key={pdv.id} value={pdv.id}>{pdv.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            <Select value={filtros.origem} onValueChange={(v) => setFiltros({ ...filtros, origem: v as KanbanFilters["origem"] })}>
              <SelectTrigger className={cn("h-9 w-40 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium", filtros.origem !== "todos" ? "border-[color:rgba(139,92,246,0.4)] bg-[color:rgba(139,92,246,0.14)] text-[color:#ddd6fe]" : "text-[var(--text-secondary)]")}>
                <div className="flex items-center gap-1.5">
                  {filtros.origem === "ANUNCIO_CTWA" ? <Megaphone className="h-3.5 w-3.5" /> : null}
                  {filtros.origem === "SINCRONIZACAO_WHATSAPP" ? <MessageCircle className="h-3.5 w-3.5" /> : null}
                  {filtros.origem === "MANUAL" ? <PenLine className="h-3.5 w-3.5" /> : null}
                  <SelectValue placeholder="Como chegou" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-zinc-400" /> Todas as origens</span></SelectItem>
                <SelectItem value="ANUNCIO_CTWA"><span className="flex items-center gap-2"><Megaphone className="h-3.5 w-3.5 text-purple-500" /> Anúncio</span></SelectItem>
                <SelectItem value="SINCRONIZACAO_WHATSAPP"><span className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp</span></SelectItem>
                <SelectItem value="MANUAL"><span className="flex items-center gap-2"><PenLine className="h-3.5 w-3.5 text-blue-500" /> Manual</span></SelectItem>
              </SelectContent>
            </Select>

            {resumoPendencias ? <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.04)] px-3 py-2"><PendenciaBadge resumo={resumoPendencias} tamanho="md" modoExpansivo /></div> : null}

            <Button variant={modoFocoPendencias ? "default" : "outline"} size="sm" onClick={() => setModoFocoPendencias(!modoFocoPendencias)} className={cn("rounded-xl text-sm font-medium", modoFocoPendencias ? "bg-[var(--danger)] hover:bg-[color:#fb7185]" : "border-[var(--border-subtle)]")} title={modoFocoPendencias ? "Mostrar todos os negócios" : "Mostrar apenas negócios com pendências"}>
              <Gauge className="mr-2 h-4 w-4" />
              {modoFocoPendencias ? "Mostrando urgências" : "Apenas urgências"}
            </Button>

            <Button variant="outline" size="sm" onClick={() => void onToggleNotificacoes()} className={cn("rounded-xl text-sm font-medium", notificacoesAtivadas ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" : "border-[var(--border-subtle)]")} title={notificacoesAtivadas ? "Notificações ativadas - clique para desativar" : "Ativar notificações de novas pendências"}>
              {notificacoesAtivadas ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>

            <div className="flex items-center gap-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-2 py-1.5">
              <div className="flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                <Select value={filtros.status} onValueChange={(v) => setFiltros({ ...filtros, status: v as KanbanFilters["status"] })}>
                  <SelectTrigger className="h-8 w-36 border-0 bg-transparent text-sm font-medium text-[var(--text-secondary)] focus:ring-0"><SelectValue placeholder="Pendência" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-zinc-400" /> Todos</span></SelectItem>
                    <SelectItem value="com_pendencia"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> Com pendência</span></SelectItem>
                    <SelectItem value="sem_pendencia"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Sem pendência</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="h-5 w-px bg-[var(--border-subtle)]" />

              <div className="flex items-center gap-1">
                <Select value={filtros.gravidade} onValueChange={(v) => setFiltros({ ...filtros, gravidade: v as KanbanFilters["gravidade"] })}>
                  <SelectTrigger className="h-8 w-28 border-0 bg-transparent text-sm font-medium text-[var(--text-secondary)] focus:ring-0"><SelectValue placeholder="Nível" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-zinc-400" /> Todos</span></SelectItem>
                    <SelectItem value="critica"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-500" /> Crítico</span></SelectItem>
                    <SelectItem value="alerta"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> Alerta</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filtrosAtivos ? (
                <button onClick={limparFiltros} className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-[color:rgba(255,255,255,0.06)] text-[var(--text-secondary)] transition-colors hover:bg-[color:rgba(255,255,255,0.1)]" title="Limpar filtros">
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <NovoNegocioDialog
              open={dialogNovoNegocioAberto}
              onOpenChange={onDialogNovoNegocioChange}
              onSubmit={criarNegocio}
              inputNomeRef={inputNomeNovoNegocioRef}
              criandoNegocio={criandoNegocio}
              valorNovoNegocio={valorNovoNegocio}
              setValorNovoNegocio={setValorNovoNegocio}
              estagioNovoNegocio={estagioNovoNegocio}
              estagioAberto={estagioAberto}
              setEstagioNovoNegocio={setEstagioNovoNegocio}
              cargoNovoNegocio={cargoNovoNegocio}
              setCargoNovoNegocio={setCargoNovoNegocio}
              contatosDisponiveis={contatosDisponiveis}
              carregandoContatosDisponiveis={carregandoContatosDisponiveis}
              contatosSelecionados={contatosSelecionados}
              setContatosSelecionados={setContatosSelecionados}
              perfil={perfil}
              funcionarios={funcionarios}
              estagios={estagios}
              erroNovoNegocio={erroNovoNegocio}
              trigger={<Button className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-medium text-white shadow-md transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg md:w-auto" title="Atalho: Alt+N"><svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Novo negócio</Button>}
            />

            <ActionButton
              variant="outline"
              className="rounded-xl border-[var(--border-subtle)] bg-[var(--surface-elevated)]"
              disabled={!onRedistribuir || redistribuindoNegociosEmAtendimento}
              loading={redistribuindoNegociosEmAtendimento}
              loadingText="Redistribuindo..."
              onClick={() => void onRedistribuir?.()}
              title="Reatribuir negócios sem atendimento recente para outros colaboradores"
              iconeEsquerda={<RefreshCw className={cn("h-4 w-4", redistribuindoNegociosEmAtendimento ? "animate-spin" : "")} />}
            >
              Redistribuir
            </ActionButton>
          </div>
        }
      />

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center gap-2">
            {FILTROS_RAPIDOS_KANBAN.map((filtroRapido) => (
              <button
                key={filtroRapido.id}
                type="button"
                onClick={() => onFiltroRapido(filtroRapido.id)}
                className={cn(
                  "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                  filtroRapidoKanbanAtivo({ tipo: filtroRapido.id, filtros, modoFocoPendencias })
                    ? "border-[color:rgba(139,92,246,0.3)] bg-[color:rgba(139,92,246,0.16)] text-[var(--text-primary)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]",
                )}
              >
                {filtroRapido.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.id}
                className={cn(
                  "rounded-[18px] border bg-[var(--surface-elevated)] p-4",
                  kpi.destaque === "brand" && "border-[color:rgba(139,92,246,0.22)] bg-[color:rgba(139,92,246,0.12)]",
                  kpi.destaque === "success" && "border-[color:rgba(16,185,129,0.22)] bg-[color:rgba(16,185,129,0.1)]",
                  kpi.destaque === "warning" && "border-[color:rgba(245,158,11,0.22)] bg-[color:rgba(245,158,11,0.1)]",
                  kpi.destaque === "info" && "border-[color:rgba(56,189,248,0.22)] bg-[color:rgba(56,189,248,0.1)]",
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{kpi.label}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-primary)]">{kpi.valor}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{kpi.descricao}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Leitura rápida</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{pendenciasCriticas}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">urgências críticas no funil</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{origemStats.whatsapp}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">negócios vindos do WhatsApp</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{origemStats.anuncios}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">entradas por anúncio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
