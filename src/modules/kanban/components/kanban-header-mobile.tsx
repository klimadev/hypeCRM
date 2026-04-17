"use client";

import { ArrowUpDown, Bell, BellOff, Filter, Gauge, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { KanbanFilters, KpiKanban, OrdenacaoKanban, Pipeline } from "../types";
import { NovoNegocioDialog } from "./novo-negocio-dialog";
import { FILTROS_RAPIDOS_KANBAN, filtroRapidoKanbanAtivo, type ContatoDisponivelNegocio, type FiltroRapidoKanban } from "./kanban-header.utils";

type KanbanHeaderMobileProps = {
  subtitleResumo: string;
  pipelines: Pipeline[];
  pipelineSelecionadaId: string;
  setPipelineSelecionadaId: (pipelineId: string) => void;
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
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  funcionarios: Array<{ id: string; nome: string }>;
  estagios: Array<{ id: string; nome: string }>;
  erroNovoNegocio: string | null;
  busca: string;
  setBusca: (busca: string) => void;
  inputBuscaRef: React.RefObject<HTMLInputElement | null>;
  kpis: KpiKanban[];
  filtros: KanbanFilters;
  ordenacao: OrdenacaoKanban;
  setOrdenacao: (ordenacao: OrdenacaoKanban) => void;
  setFiltros: (filtros: KanbanFilters) => void;
  modoFocoPendencias: boolean;
  setModoFocoPendencias: (ativo: boolean) => void;
  notificacoesAtivadas: boolean;
  onToggleNotificacoes: () => Promise<void>;
  onFiltroRapido: (tipo: FiltroRapidoKanban) => void;
};

export function KanbanHeaderMobile(props: KanbanHeaderMobileProps) {
  const {
    subtitleResumo,
    pipelines,
    pipelineSelecionadaId,
    setPipelineSelecionadaId,
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
    perfil,
    funcionarios,
    estagios,
    erroNovoNegocio,
    busca,
    setBusca,
    inputBuscaRef,
    kpis,
    filtros,
    ordenacao,
    setOrdenacao,
    setFiltros,
    modoFocoPendencias,
    setModoFocoPendencias,
    notificacoesAtivadas,
    onToggleNotificacoes,
    onFiltroRapido,
  } = props;

  return (
    <div className="space-y-3 md:hidden">
      <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Kanban comercial</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">Entenda o funil em 3 segundos</h1>
            <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">{subtitleResumo}</p>
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
            buttonClassName="h-11 w-full rounded-[var(--radius-control)] bg-[var(--brand)] font-medium text-white hover:bg-[var(--brand-strong)]"
            trigger={<Button className="h-11 min-w-11 rounded-[var(--radius-control)] bg-[var(--brand)] px-4 text-sm font-medium text-white hover:bg-[var(--brand-strong)]" title="Atalho: Alt+N">Novo</Button>}
          />
        </div>

        {pipelines.length > 1 ? (
          <div className="mt-3">
            <Select value={pipelineSelecionadaId} onValueChange={setPipelineSelecionadaId}>
              <SelectTrigger className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
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
          </div>
        ) : null}

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            ref={inputBuscaRef}
            type="text"
            placeholder="Buscar negócio..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] pl-9 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-[var(--focus-ring)]"
          />
          {busca ? (
            <button type="button" onClick={() => setBusca("")} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-soft)] text-[var(--text-secondary)]">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className={cn(
                "rounded-[20px] border p-3 shadow-[var(--shadow-sm)]",
                kpi.destaque === "brand" && "border-[color-mix(in_srgb,var(--brand)_26%,transparent)] bg-[var(--brand-soft)]",
                kpi.destaque === "success" && "border-[color-mix(in_srgb,var(--success)_26%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)]",
                kpi.destaque === "warning" && "border-[color-mix(in_srgb,var(--warning)_26%,transparent)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)]",
                kpi.destaque === "info" && "border-[color-mix(in_srgb,var(--info)_26%,transparent)] bg-[color-mix(in_srgb,var(--info)_12%,transparent)]",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{kpi.label}</p>
              <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">{kpi.valor}</p>
              <p className="mt-1 text-[11px] leading-4 text-[var(--text-secondary)]">{kpi.descricao}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTROS_RAPIDOS_KANBAN.map((filtroRapido) => (
            <button
              key={filtroRapido.id}
              type="button"
              onClick={() => onFiltroRapido(filtroRapido.id)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                filtroRapidoKanbanAtivo({ tipo: filtroRapido.id, filtros, modoFocoPendencias })
                  ? "border-[color-mix(in_srgb,var(--brand)_34%,transparent)] bg-[var(--brand-soft)] text-[var(--text-primary)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]",
              )}
            >
              {filtroRapido.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Select value={ordenacao} onValueChange={(v) => setOrdenacao(v as OrdenacaoKanban)}>
            <SelectTrigger className="h-11 min-w-36 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
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

          <Select value={filtros.status} onValueChange={(v) => setFiltros({ ...filtros, status: v as KanbanFilters["status"] })}>
            <SelectTrigger className="h-11 min-w-36 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Pendência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="com_pendencia">Com pendência</SelectItem>
              <SelectItem value="sem_pendencia">Sem pendência</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-glass)] p-2 shadow-[var(--shadow-md)]">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={modoFocoPendencias ? "default" : "outline"}
              size="sm"
              onClick={() => setModoFocoPendencias(!modoFocoPendencias)}
              className={cn("h-11 rounded-[18px] px-3 text-sm font-medium shadow-none", modoFocoPendencias ? "bg-[var(--danger)] hover:bg-[var(--danger-strong)]" : "border-[var(--border-subtle)]")}
              title={modoFocoPendencias ? "Mostrar todos os negócios" : "Mostrar apenas negócios com pendências"}
            >
              <Gauge className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-2">{modoFocoPendencias ? "Urgências" : "Pendências"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void onToggleNotificacoes()}
              className={cn(
                "h-11 rounded-[18px] border-[var(--border-subtle)] px-3 text-sm font-medium shadow-none",
                notificacoesAtivadas ? "border-[color-mix(in_srgb,var(--info)_30%,transparent)] bg-[color-mix(in_srgb,var(--info)_14%,transparent)] text-[var(--info)]" : "",
              )}
              title={notificacoesAtivadas ? "Notificações ativadas - clique para desativar" : "Ativar notificações de novas pendências"}
            >
              {notificacoesAtivadas ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              <span className="sr-only sm:not-sr-only sm:ml-2">Alertas</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
