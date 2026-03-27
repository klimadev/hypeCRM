"use client";

import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  aplicaMascaraMoedaBr,
  aplicaMascaraTelefoneBr,
} from "@/lib/utils";
import type { Estagio, Funcionario, KanbanFilters, ResumoPendencias, OrdenacaoKanban, Pdv, OrigemStats } from "../types";
import { PendenciaBadge } from "./pendencia-badge";
import { cn } from "@/lib/utils";
import { Filter, X, Bell, BellOff, Search, ArrowUpDown, RefreshCw, Megaphone, MessageCircle, PenLine, Store, Gauge } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ActionButton } from "./action-button";

type KanbanHeaderProps = {
  dialogNovoLeadAberto: boolean;
  setDialogNovoLeadAberto: (aberto: boolean) => void;
  criarLead: (evento: React.FormEvent<HTMLFormElement>) => Promise<void>;
  estagios: Estagio[];
  funcionarios: Funcionario[];
  pdvs: Pdv[];
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  telefoneNovoLead: string;
  setTelefoneNovoLead: (telefone: string) => void;
  valorNovoLead: string;
  setValorNovoLead: (valor: string) => void;
  erroNovoLead: string | null;
  setErroNovoLead: (erro: string | null) => void;
  criandoLead: boolean;
  cargoNovoLead: { id_funcionario: string } | null;
  estagioAberto: string;
  estagioNovoLead: string;
  setEstagioNovoLead: (estagio: string) => void;
  setCargoNovoLead: (cargo: { id_funcionario: string } | null) => void;
  filtros: KanbanFilters;
  setFiltros: (filtros: KanbanFilters) => void;
  busca: string;
  setBusca: (busca: string) => void;
  ordenacao: OrdenacaoKanban;
  setOrdenacao: (ordenacao: OrdenacaoKanban) => void;
  modoFocoPendencias: boolean;
  setModoFocoPendencias: (ativo: boolean) => void;
  resumoPendencias: ResumoPendencias | null;
  totalLeads?: number;
  pendenciasCriticas?: number;
  origemStats: OrigemStats;
  ultimaSincronizacaoWhatsapp: Date | null;
  instanciasAtivasCount: number;
  notificacoesAtivadas: boolean;
  alternarNotificacoes: () => Promise<boolean>;
  permissaoNotificacao: () => NotificationPermission | "unknown";
  sincronizandoWhatsapp: boolean;
  sincronizarWhatsapp: (params?: string) => Promise<{
    ok: boolean;
    erro?: string;
    criados?: number;
    timestampSync?: Date;
    instanciasIgnoradas?: Array<{ id: string; nome: string; motivo: string }>;
  }>;
  redistribuindoEmAtendimento?: boolean;
  redistribuirLeadsEmAtendimento?: () => Promise<
    | { ok: false; erro: string }
    | {
      ok: true;
      avaliados: number;
      elegiveis: number;
      reatribuidos: number;
      ignoradosSemDestino: number;
    }
  >;
};

export function KanbanHeader({
  dialogNovoLeadAberto,
  setDialogNovoLeadAberto,
  criarLead,
  estagios,
  funcionarios,
  pdvs,
  perfil,
  telefoneNovoLead,
  setTelefoneNovoLead,
  valorNovoLead,
  setValorNovoLead,
  erroNovoLead,
  setErroNovoLead,
  criandoLead,
  cargoNovoLead,
  estagioAberto,
  estagioNovoLead,
  setEstagioNovoLead,
  setCargoNovoLead,
  filtros,
  setFiltros,
  busca,
  setBusca,
  ordenacao,
  setOrdenacao,
  modoFocoPendencias,
  setModoFocoPendencias,
  resumoPendencias,
  totalLeads = 0,
  pendenciasCriticas = 0,
  origemStats,
  ultimaSincronizacaoWhatsapp,
  instanciasAtivasCount,
  notificacoesAtivadas,
  alternarNotificacoes,
  permissaoNotificacao,
  sincronizandoWhatsapp,
  sincronizarWhatsapp,
  redistribuindoEmAtendimento,
  redistribuirLeadsEmAtendimento,
}: KanbanHeaderProps) {
  const { addToast } = useToast();
  const [apenasAnuncios, setApenasAnuncios] = useState(false);
  const [dialogSincronizacaoAberto, setDialogSincronizacaoAberto] = useState(false);
  const [agoraMs, setAgoraMs] = useState<number>(() => Date.now());
  const filtrosAtivos = filtros.status !== "todos" || filtros.gravidade !== "todas" || filtros.tipo !== "todos" || filtros.pdv !== null || filtros.origem !== "todos";
  const inputBuscaRef = useRef<HTMLInputElement>(null);
  const inputNomeNovoLeadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const alvoEditavel =
        alvo instanceof HTMLInputElement ||
        alvo instanceof HTMLTextAreaElement ||
        alvo instanceof HTMLSelectElement ||
        alvo?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputBuscaRef.current?.focus();
      }
      if (!alvoEditavel && !dialogNovoLeadAberto && e.key === "/") {
        e.preventDefault();
        inputBuscaRef.current?.focus();
      }
      if (e.altKey && e.key.toLowerCase() === "n" && !dialogNovoLeadAberto) {
        e.preventDefault();
        setDialogNovoLeadAberto(true);
        setErroNovoLead(null);
      }
      if (e.key === "Escape" && document.activeElement === inputBuscaRef.current) {
        setBusca("");
        inputBuscaRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogNovoLeadAberto, setBusca, setDialogNovoLeadAberto, setErroNovoLead]);

  useEffect(() => {
    if (!dialogNovoLeadAberto) {
      return;
    }

    const timeout = window.setTimeout(() => {
      inputNomeNovoLeadRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [dialogNovoLeadAberto]);

  const limparFiltros = () => {
    setFiltros({ status: "todos", gravidade: "todas", tipo: "todos", pdv: null, origem: "todos" });
  };

  useEffect(() => {
    const intervalo = window.setInterval(() => setAgoraMs(Date.now()), 60000);
    return () => window.clearInterval(intervalo);
  }, []);

  const tempoUltimaSincronizacao = (() => {
    if (!ultimaSincronizacaoWhatsapp) {
      return null;
    }

    const diff = agoraMs - ultimaSincronizacaoWhatsapp.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "agora";
    if (minutes < 60) return `${minutes}min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);
    return `${days}d`;
  })();

  const subtitleResumo = (() => {
    const partes: string[] = [];

    partes.push(`${totalLeads} lead${totalLeads !== 1 ? "s" : ""} ativo${totalLeads !== 1 ? "s" : ""}`);

    if (pendenciasCriticas > 0) {
      partes.push(`${pendenciasCriticas} pendência${pendenciasCriticas !== 1 ? "s" : ""} crítica${pendenciasCriticas !== 1 ? "s" : ""}`);
    }

    if (origemStats?.anuncios > 0) {
      partes.push(`${origemStats.anuncios} anúncio${origemStats.anuncios !== 1 ? "s" : ""}`);
    }

    return partes.join(" • ");
  })();

  const blocoMobile = (
    <div className="md:hidden space-y-3">
      <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.94))] p-3 shadow-[var(--shadow-sm)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Leads</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">Kanban</h1>
            <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">{subtitleResumo}</p>
          </div>

          <Dialog
            open={dialogNovoLeadAberto}
            onOpenChange={(aberto) => {
              if (!aberto && criandoLead) {
                return;
              }

              setDialogNovoLeadAberto(aberto);
              if (!aberto) {
                setErroNovoLead(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="h-11 min-w-11 rounded-[var(--radius-control)] bg-[var(--brand)] px-4 text-sm font-medium text-white hover:bg-[var(--brand-strong)]" title="Atalho: Alt+N">
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar lead</DialogTitle>
              </DialogHeader>

              <form className="space-y-3" onSubmit={criarLead}>
                <Input
                  ref={inputNomeNovoLeadRef}
                  className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:bg-[var(--surface-elevated)] focus:ring-[var(--focus-ring)]"
                  name="nome"
                  placeholder="Nome"
                  disabled={criandoLead}
                  required
                />
                <Input
                  className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:bg-[var(--surface-elevated)] focus:ring-[var(--focus-ring)]"
                  name="telefone"
                  placeholder="Telefone"
                  value={telefoneNovoLead}
                  onChange={(e) => setTelefoneNovoLead(aplicaMascaraTelefoneBr(e.target.value))}
                  disabled={criandoLead}
                  required
                />
                <Input
                  className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:bg-[var(--surface-elevated)] focus:ring-[var(--focus-ring)]"
                  name="valor_consorcio"
                  placeholder="Valor"
                  inputMode="numeric"
                  value={valorNovoLead}
                  onChange={(e) => setValorNovoLead(aplicaMascaraMoedaBr(e.target.value))}
                  disabled={criandoLead}
                  required
                />

                <input type="hidden" name="id_estagio" value={estagioNovoLead || estagioAberto} />
                <input type="hidden" name="id_funcionario" value={cargoNovoLead?.id_funcionario ?? ""} />

                <Select disabled={criandoLead} value={estagioNovoLead || estagioAberto} onValueChange={setEstagioNovoLead}>
                  <SelectTrigger className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
                    <SelectValue placeholder="Estagio" />
                  </SelectTrigger>
                  <SelectContent>
                    {estagios.map((estagio) => (
                      <SelectItem key={estagio.id} value={estagio.id}>
                        {estagio.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {perfil !== "COLABORADOR" ? (
                  <Select
                    disabled={criandoLead}
                    value={cargoNovoLead?.id_funcionario ?? undefined}
                    onValueChange={(valor) => setCargoNovoLead({ id_funcionario: valor })}
                  >
                    <SelectTrigger className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
                      <SelectValue placeholder="Funcionario" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}

                {erroNovoLead ? <p className="text-sm font-medium text-[var(--danger)]">{erroNovoLead}</p> : null}

                <ActionButton
                  className="h-11 w-full rounded-[var(--radius-control)] bg-[var(--brand)] font-medium text-white hover:bg-[var(--brand-strong)]"
                  type="submit"
                  loading={criandoLead}
                  loadingText="Criando lead..."
                >
                  Criar lead
                </ActionButton>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            ref={inputBuscaRef}
            type="text"
            placeholder="Buscar lead..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] pl-9 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-[var(--focus-ring)]"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.05)] text-[var(--text-secondary)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
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

          <Select
            value={filtros.status}
            onValueChange={(v) => setFiltros({ ...filtros, status: v as KanbanFilters["status"] })}
          >
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
              className={cn(
                "h-11 rounded-[18px] px-3 text-sm font-medium shadow-none",
                modoFocoPendencias ? "bg-[var(--danger)] hover:bg-[color:#fb7185]" : "border-[var(--border-subtle)]",
              )}
              title={modoFocoPendencias ? "Mostrar todos os leads" : "Mostrar apenas leads com pendências"}
            >
              <Gauge className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-2">
                {modoFocoPendencias ? "Urgências" : "Pendências"}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const permissao = permissaoNotificacao();
                if (permissao === "denied") {
                  addToast({ type: "warning", title: "Notificações bloqueadas", description: "Habilite nas configurações do navegador." });
                  return;
                }
                await alternarNotificacoes();
              }}
              className={cn(
                "h-11 rounded-[18px] border-[var(--border-subtle)] px-3 text-sm font-medium shadow-none",
                notificacoesAtivadas
                  ? "border-[color:rgba(59,130,246,0.28)] bg-[color:rgba(59,130,246,0.14)] text-[color:#dbeafe]"
                  : "",
              )}
              title={notificacoesAtivadas ? "Notificações ativadas - clique para desativar" : "Ativar notificações de novas pendências"}
            >
              {notificacoesAtivadas ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              <span className="sr-only sm:not-sr-only sm:ml-2">Alertas</span>
            </Button>

            <Dialog open={dialogSincronizacaoAberto} onOpenChange={setDialogSincronizacaoAberto}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 rounded-[18px] border-[var(--border-subtle)] px-3 text-sm font-medium text-[var(--text-secondary)] shadow-none"
                  title="Escolher a origem da sincronização"
                >
                  <span className="flex items-center gap-2">
                    {apenasAnuncios ? <Megaphone className="h-4 w-4 text-[var(--brand)]" /> : <MessageCircle className="h-4 w-4 text-[var(--text-tertiary)]" />}
                    <span className="sr-only sm:not-sr-only">
                      {apenasAnuncios ? "Anúncios" : "WhatsApp"}
                    </span>
                  </span>
                  <RefreshCw className="ml-2 h-4 w-4 text-[var(--text-tertiary)]" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[92vw] p-4">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-base">Sincronizar contatos</DialogTitle>
                  <DialogDescription className="text-sm text-[var(--text-secondary)]">
                    Escolha se a importação vai trazer todos os contatos ou apenas os vindos de anúncios.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    disabled={sincronizandoWhatsapp}
                    onClick={async () => {
                      setApenasAnuncios(false);
                      const resultado = await sincronizarWhatsapp("");
                      if (!resultado.ok) {
                        addToast({
                          type: "error",
                          title: "Falha na sincronização",
                          description: resultado.erro ?? "Não foi possível importar novos contatos do WhatsApp.",
                        });
                        return;
                      }

                      addToast({
                        type: "success",
                        title: "Sincronização concluída",
                        description:
                          resultado.criados && resultado.criados > 0
                            ? `${resultado.criados} novo(s) lead(s) importado(s) do WhatsApp.`
                            : "Nenhum contato novo para importar do WhatsApp.",
                      });

                      if (resultado.instanciasIgnoradas && resultado.instanciasIgnoradas.length > 0) {
                        addToast({
                          type: "warning",
                          title: "Instâncias ignoradas",
                          description: resultado.instanciasIgnoradas
                            .map((instancia) => `${instancia.nome}: ${instancia.motivo}`)
                            .join(" "),
                        });
                      }

                      setDialogSincronizacaoAberto(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[var(--radius-control)] border px-4 py-3 text-left text-sm transition-colors",
                      sincronizandoWhatsapp
                        ? "cursor-not-allowed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-disabled)]"
                        : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[color:rgba(255,255,255,0.04)]",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-[var(--text-tertiary)]" />
                      <span>Importar do WhatsApp</span>
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">Tudo</span>
                  </button>

                  <button
                    type="button"
                    disabled={sincronizandoWhatsapp}
                    onClick={async () => {
                      setApenasAnuncios(true);
                      const resultado = await sincronizarWhatsapp("?origem=anuncio");
                      if (!resultado.ok) {
                        addToast({
                          type: "error",
                          title: "Falha na sincronização",
                          description: resultado.erro ?? "Não foi possível importar novos contatos do WhatsApp.",
                        });
                        return;
                      }

                      addToast({
                        type: "success",
                        title: "Sincronização concluída",
                        description:
                          resultado.criados && resultado.criados > 0
                            ? `${resultado.criados} novo(s) lead(s) importado(s) de anúncios.`
                            : "Nenhum contato novo para importar de anúncios.",
                      });

                      if (resultado.instanciasIgnoradas && resultado.instanciasIgnoradas.length > 0) {
                        addToast({
                          type: "warning",
                          title: "Instâncias ignoradas",
                          description: resultado.instanciasIgnoradas
                            .map((instancia) => `${instancia.nome}: ${instancia.motivo}`)
                            .join(" "),
                        });
                      }

                      setDialogSincronizacaoAberto(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[var(--radius-control)] border px-4 py-3 text-left text-sm transition-colors",
                      sincronizandoWhatsapp
                        ? "cursor-not-allowed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-disabled)]"
                        : "border-[color:rgba(139,92,246,0.28)] bg-[color:rgba(139,92,246,0.12)] text-[color:#e9d5ff] hover:border-[color:rgba(139,92,246,0.42)] hover:bg-[color:rgba(139,92,246,0.18)]",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-[var(--brand)]" />
                      <span>Apenas anúncios</span>
                    </span>
                    <span className="text-xs text-[color:#c4b5fd]">CTWA</span>
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-[var(--text-tertiary)]">
                    Atual: {apenasAnuncios ? "somente anúncios" : "todos os contatos"}
                  </p>
                  <ActionButton
                    variant="outline"
                    className="h-10 rounded-[var(--radius-control)] border-[var(--border-subtle)] px-4"
                    disabled={sincronizandoWhatsapp}
                    loading={sincronizandoWhatsapp}
                    loadingText="Sincronizando..."
                    onClick={async () => {
                      const params = apenasAnuncios ? "?origem=anuncio" : "";
                      const resultado = await sincronizarWhatsapp(params);
                      if (!resultado.ok) {
                        addToast({
                          type: "error",
                          title: "Falha na sincronização",
                          description: resultado.erro ?? "Não foi possível importar novos contatos do WhatsApp.",
                        });
                        return;
                      }

                      const tipoImportacao = apenasAnuncios ? "de anúncios" : "do WhatsApp";
                      addToast({
                        type: "success",
                        title: "Sincronização concluída",
                        description:
                          resultado.criados && resultado.criados > 0
                            ? `${resultado.criados} novo(s) lead(s) importado(s) ${tipoImportacao}.`
                            : `Nenhum contato novo para importar ${tipoImportacao}.`,
                      });

                      if (resultado.instanciasIgnoradas && resultado.instanciasIgnoradas.length > 0) {
                        addToast({
                          type: "warning",
                          title: "Instâncias ignoradas",
                          description: resultado.instanciasIgnoradas
                            .map((instancia) => `${instancia.nome}: ${instancia.motivo}`)
                            .join(" "),
                        });
                      }

                      setDialogSincronizacaoAberto(false);
                    }}
                    iconeEsquerda={<RefreshCw className={cn("h-4 w-4", sincronizandoWhatsapp && "animate-spin")} />}
                  >
                    Sincronizar
                  </ActionButton>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {blocoMobile}
      <div className="hidden md:block">
        <ModulePageHeader
      title="Leads"
      subtitle={subtitleResumo}
      icon={(
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      )}
      actions={<div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            ref={inputBuscaRef}
            type="text"
            placeholder="Buscar lead... (Ctrl+K ou /)"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-9 w-48 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-[var(--focus-ring)]"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.05)] p-0.5 hover:bg-[color:rgba(255,255,255,0.08)]"
            >
              <X className="h-3 w-3 text-[var(--text-secondary)]" />
            </button>
          )}
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

        {perfil === "EMPRESA" && pdvs.length > 0 && (
          <Select
            value={filtros.pdv ?? "todos"}
            onValueChange={(v) => setFiltros({ ...filtros, pdv: v === "todos" ? null : v })}
          >
            <SelectTrigger className="h-9 w-36 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
              <Store className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Loja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as lojas</SelectItem>
              {pdvs.map((pdv) => (
                <SelectItem key={pdv.id} value={pdv.id}>
                  {pdv.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Filter by Origin - renamed to "Como chegou" for clarity */}
        <Select
          value={filtros.origem}
          onValueChange={(v) => setFiltros({ ...filtros, origem: v as KanbanFilters["origem"] })}
        >
          <SelectTrigger className={cn(
            "h-9 w-40 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium",
            filtros.origem !== "todos" ? "border-[color:rgba(139,92,246,0.4)] bg-[color:rgba(139,92,246,0.14)] text-[color:#ddd6fe]" : "text-[var(--text-secondary)]"
          )}>
            <div className="flex items-center gap-1.5">
              {filtros.origem === "ANUNCIO_CTWA" && <Megaphone className="h-3.5 w-3.5" />}
              {filtros.origem === "SINCRONIZACAO_WHATSAPP" && <MessageCircle className="h-3.5 w-3.5" />}
              {filtros.origem === "MANUAL" && <PenLine className="h-3.5 w-3.5" />}
              <SelectValue placeholder="Como chegou" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400" /> Todas as origens
              </span>
            </SelectItem>
            <SelectItem value="ANUNCIO_CTWA">
              <span className="flex items-center gap-2">
                <Megaphone className="h-3.5 w-3.5 text-purple-500" /> Anúncio
              </span>
            </SelectItem>
            <SelectItem value="SINCRONIZACAO_WHATSAPP">
              <span className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
              </span>
            </SelectItem>
            <SelectItem value="MANUAL">
              <span className="flex items-center gap-2">
                <PenLine className="h-3.5 w-3.5 text-blue-500" /> Manual
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {resumoPendencias && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <PendenciaBadge resumo={resumoPendencias} tamanho="md" modoExpansivo />
          </div>
        )}

        <Button
          variant={modoFocoPendencias ? "default" : "outline"}
          size="sm"
          onClick={() => setModoFocoPendencias(!modoFocoPendencias)}
          className={cn(
            "rounded-xl text-sm font-medium",
            modoFocoPendencias ? "bg-[var(--danger)] hover:bg-[color:#fb7185]" : "border-[var(--border-subtle)]"
          )}
          title={modoFocoPendencias ? "Mostrar todos os leads" : "Mostrar apenas leads com pendências"}
        >
          <Gauge className="mr-2 h-4 w-4" />
          {modoFocoPendencias ? "Mostrando urgências" : "Apenas urgências"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const permissao = permissaoNotificacao();
            if (permissao === "denied") {
              addToast({ type: "warning", title: "Notificações bloqueadas", description: "Habilite nas configurações do navegador." });
              return;
            }
            await alternarNotificacoes();
          }}
          className={cn(
            "rounded-xl text-sm font-medium",
            notificacoesAtivadas
              ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
              : "border-[var(--border-subtle)]"
          )}
          title={
            notificacoesAtivadas
              ? "Notificações ativadas - clique para desativar"
              : "Ativar notificações de novas pendências"
          }
        >
          {notificacoesAtivadas ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </Button>

        {/* Filters group - pendências */}
        <div className="flex items-center gap-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-2 py-1.5">
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <Select
              value={filtros.status}
              onValueChange={(v) => setFiltros({ ...filtros, status: v as KanbanFilters["status"] })}
            >
              <SelectTrigger className="h-8 w-36 border-0 bg-transparent text-sm font-medium text-[var(--text-secondary)] focus:ring-0">
                <SelectValue placeholder="Pendência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400" /> Todos
                  </span>
                </SelectItem>
                <SelectItem value="com_pendencia">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Com pendência
                  </span>
                </SelectItem>
                <SelectItem value="sem_pendencia">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Sem pendência
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-1">
            <Select
              value={filtros.gravidade}
              onValueChange={(v) => setFiltros({ ...filtros, gravidade: v as KanbanFilters["gravidade"] })}
            >
              <SelectTrigger className="h-8 w-28 border-0 bg-transparent text-sm font-medium text-[var(--text-secondary)] focus:ring-0">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400" /> Todos
                  </span>
                </SelectItem>
                <SelectItem value="critica">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Crítico
                  </span>
                </SelectItem>
                <SelectItem value="alerta">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Alerta
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtrosAtivos && (
            <button
              onClick={limparFiltros}
                className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-[color:rgba(255,255,255,0.06)] text-[var(--text-secondary)] transition-colors hover:bg-[color:rgba(255,255,255,0.1)]"
              title="Limpar filtros"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Dialog
          open={dialogNovoLeadAberto}
          onOpenChange={(aberto) => {
            if (!aberto && criandoLead) {
              return;
            }

            setDialogNovoLeadAberto(aberto);
            if (!aberto) {
              setErroNovoLead(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-medium text-white hover:from-emerald-600 hover:to-emerald-700 md:w-auto shadow-md hover:shadow-lg transition-all duration-200" title="Atalho: Alt+N">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Novo lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar lead</DialogTitle>
            </DialogHeader>

            <form className="space-y-3" onSubmit={criarLead}>
              <Input
                ref={inputNomeNovoLeadRef}
                className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:bg-[var(--surface-elevated)] focus:ring-[var(--focus-ring)]"
                name="nome"
                placeholder="Nome"
                disabled={criandoLead}
                required
              />
              <Input
                className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:bg-[var(--surface-elevated)] focus:ring-[var(--focus-ring)]"
                name="telefone"
                placeholder="Telefone"
                value={telefoneNovoLead}
                onChange={(e) => setTelefoneNovoLead(aplicaMascaraTelefoneBr(e.target.value))}
                disabled={criandoLead}
                required
              />
              <Input
                className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:bg-[var(--surface-elevated)] focus:ring-[var(--focus-ring)]"
                name="valor_consorcio"
                placeholder="Valor"
                inputMode="numeric"
                value={valorNovoLead}
                onChange={(e) => setValorNovoLead(aplicaMascaraMoedaBr(e.target.value))}
                disabled={criandoLead}
                required
              />

              <input type="hidden" name="id_estagio" value={estagioNovoLead || estagioAberto} />
              <input type="hidden" name="id_funcionario" value={cargoNovoLead?.id_funcionario ?? ""} />

              <Select disabled={criandoLead} value={estagioNovoLead || estagioAberto} onValueChange={setEstagioNovoLead}>
                <SelectTrigger className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
                  <SelectValue placeholder="Estagio" />
                </SelectTrigger>
                <SelectContent>
                  {estagios.map((estagio) => (
                    <SelectItem key={estagio.id} value={estagio.id}>
                      {estagio.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {perfil !== "COLABORADOR" ? (
                <Select
                  disabled={criandoLead}
                  value={cargoNovoLead?.id_funcionario ?? undefined}
                  onValueChange={(valor) => setCargoNovoLead({ id_funcionario: valor })}
                >
                <SelectTrigger className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-medium text-[var(--text-secondary)]">
                    <SelectValue placeholder="Funcionario" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.map((funcionario) => (
                      <SelectItem key={funcionario.id} value={funcionario.id}>
                        {funcionario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {erroNovoLead ? <p className="text-sm font-medium text-red-600">{erroNovoLead}</p> : null}

              <ActionButton
                className="w-full rounded-xl bg-slate-800 font-medium text-white hover:bg-slate-700"
                type="submit"
                loading={criandoLead}
                loadingText="Criando lead..."
              >
                Criar lead
              </ActionButton>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogSincronizacaoAberto} onOpenChange={setDialogSincronizacaoAberto}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="rounded-xl border-[var(--border-subtle)] text-sm font-medium text-[var(--text-secondary)]"
              title="Escolher a origem da sincronização"
            >
              <span className="flex items-center gap-2">
                {apenasAnuncios ? <Megaphone className="h-4 w-4 text-[var(--brand)]" /> : <MessageCircle className="h-4 w-4 text-[var(--text-tertiary)]" />}
                <span>{apenasAnuncios ? "Anúncios" : "WhatsApp"}</span>
              </span>
              <RefreshCw className="ml-3 h-4 w-4 text-[var(--text-tertiary)]" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[28rem] p-5">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base">Sincronizar contatos</DialogTitle>
              <DialogDescription className="text-sm text-[var(--text-secondary)]">
                Escolha se a importação vai trazer todos os contatos ou apenas os vindos de anúncios.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                disabled={sincronizandoWhatsapp}
                onClick={async () => {
                  setApenasAnuncios(false);
                  const resultado = await sincronizarWhatsapp("");
                  if (!resultado.ok) {
                    addToast({
                      type: "error",
                      title: "Falha na sincronização",
                      description: resultado.erro ?? "Não foi possível importar novos contatos do WhatsApp.",
                    });
                    return;
                  }

                  const tipoImportacao = "do WhatsApp";
                  addToast({
                    type: "success",
                    title: "Sincronização concluída",
                    description:
                      resultado.criados && resultado.criados > 0
                        ? `${resultado.criados} novo(s) lead(s) importado(s) ${tipoImportacao}.`
                        : `Nenhum contato novo para importar ${tipoImportacao}.`,
                  });

                  if (resultado.instanciasIgnoradas && resultado.instanciasIgnoradas.length > 0) {
                    addToast({
                      type: "warning",
                      title: "Instâncias ignoradas",
                      description: resultado.instanciasIgnoradas
                        .map((instancia) => `${instancia.nome}: ${instancia.motivo}`)
                        .join(" "),
                    });
                  }

                  setDialogSincronizacaoAberto(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-[var(--radius-control)] border px-4 py-3 text-left text-sm transition-colors",
                  sincronizandoWhatsapp
                    ? "cursor-not-allowed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-disabled)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[color:rgba(255,255,255,0.04)]",
                )}
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <span>Importar do WhatsApp</span>
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">Tudo</span>
              </button>

              <button
                type="button"
                disabled={sincronizandoWhatsapp}
                onClick={async () => {
                  setApenasAnuncios(true);
                  const resultado = await sincronizarWhatsapp("?origem=anuncio");
                  if (!resultado.ok) {
                    addToast({
                      type: "error",
                      title: "Falha na sincronização",
                      description: resultado.erro ?? "Não foi possível importar novos contatos do WhatsApp.",
                    });
                    return;
                  }

                  const tipoImportacao = "de anúncios";
                  addToast({
                    type: "success",
                    title: "Sincronização concluída",
                    description:
                      resultado.criados && resultado.criados > 0
                        ? `${resultado.criados} novo(s) lead(s) importado(s) ${tipoImportacao}.`
                        : `Nenhum contato novo para importar ${tipoImportacao}.`,
                  });

                  if (resultado.instanciasIgnoradas && resultado.instanciasIgnoradas.length > 0) {
                    addToast({
                      type: "warning",
                      title: "Instâncias ignoradas",
                      description: resultado.instanciasIgnoradas
                        .map((instancia) => `${instancia.nome}: ${instancia.motivo}`)
                        .join(" "),
                    });
                  }

                  setDialogSincronizacaoAberto(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-[var(--radius-control)] border px-4 py-3 text-left text-sm transition-colors",
                  sincronizandoWhatsapp
                    ? "cursor-not-allowed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-disabled)]"
                    : "border-[color:rgba(139,92,246,0.28)] bg-[color:rgba(139,92,246,0.12)] text-[color:#e9d5ff] hover:border-[color:rgba(139,92,246,0.42)] hover:bg-[color:rgba(139,92,246,0.18)]",
                )}
              >
                <span className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-[var(--brand)]" />
                  <span>Apenas anúncios</span>
                </span>
                <span className="text-xs text-[color:#c4b5fd]">CTWA</span>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Atual: {apenasAnuncios ? "somente anúncios" : "todos os contatos"}
              </p>
              <ActionButton
                variant="outline"
                className="h-10 rounded-[var(--radius-control)] border-[var(--border-subtle)] px-4"
                disabled={sincronizandoWhatsapp}
                loading={sincronizandoWhatsapp}
                loadingText="Sincronizando..."
                onClick={async () => {
                  const params = apenasAnuncios ? "?origem=anuncio" : "";
                  const resultado = await sincronizarWhatsapp(params);
                  if (!resultado.ok) {
                    addToast({
                      type: "error",
                      title: "Falha na sincronização",
                      description: resultado.erro ?? "Não foi possível importar novos contatos do WhatsApp.",
                    });
                    return;
                  }

                  const tipoImportacao = apenasAnuncios ? "de anúncios" : "do WhatsApp";
                  addToast({
                    type: "success",
                    title: "Sincronização concluída",
                    description:
                      resultado.criados && resultado.criados > 0
                        ? `${resultado.criados} novo(s) lead(s) importado(s) ${tipoImportacao}.`
                        : `Nenhum contato novo para importar ${tipoImportacao}.`,
                  });

                  if (resultado.instanciasIgnoradas && resultado.instanciasIgnoradas.length > 0) {
                    addToast({
                      type: "warning",
                      title: "Instâncias ignoradas",
                      description: resultado.instanciasIgnoradas
                        .map((instancia) => `${instancia.nome}: ${instancia.motivo}`)
                        .join(" "),
                    });
                  }

                  setDialogSincronizacaoAberto(false);
                }}
                iconeEsquerda={<RefreshCw className={cn("h-4 w-4", sincronizandoWhatsapp && "animate-spin")} />}
              >
                Sincronizar
              </ActionButton>
            </div>
          </DialogContent>
        </Dialog>

        <ActionButton
          variant="outline"
          className="rounded-xl border-slate-200"
          disabled={!redistribuirLeadsEmAtendimento || redistribuindoEmAtendimento}
          loading={redistribuindoEmAtendimento}
          loadingText="Redistribuindo..."
          onClick={async () => {
            if (!redistribuirLeadsEmAtendimento) {
              addToast({
                type: "warning",
                title: "Funcionalidade indisponível",
                description: "A função de redistribuição não está disponível.",
              });
              return;
            }

            const resultado = await redistribuirLeadsEmAtendimento();
            
            if (!resultado.ok) {
              addToast({
                type: "error",
                title: "Falha na redistribuição",
                description: resultado.erro ?? "Não foi possível redistribuir os leads.",
              });
              return;
            }

            addToast({
              type: "success",
              title: "Redistribuição concluída",
              description: `${resultado.reatribuidos} lead(s) reatribuído(s). ${resultado.ignoradosSemDestino} ignorado(s) por falta de destino.`,
            });
          }}
          title="Reatribuir leads sem atendimento recente para outros colaboradores"
          iconeEsquerda={<RefreshCw className={cn("h-4 w-4", redistribuindoEmAtendimento && "animate-spin")} />}
        >
          Redistribuir
        </ActionButton>
      </div>}
        />
      </div>
    </>
  );
}
