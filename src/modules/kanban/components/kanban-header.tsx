"use client";

import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { Estagio, Funcionario, KanbanFilters, KpiKanban, OrdenacaoKanban, OrigemStats, Pdv, ResumoPendencias } from "../types";
import { KanbanHeaderDesktop } from "./kanban-header-desktop";
import { KanbanHeaderMobile } from "./kanban-header-mobile";
import {
  aplicarFiltroRapidoKanban,
  criarResumoKanban,
  temFiltrosKanbanAtivos,
  type ContatoDisponivelNegocio,
  type FiltroRapidoKanban,
} from "./kanban-header.utils";

type KanbanHeaderProps = {
  dialogNovoNegocioAberto: boolean;
  setDialogNovoNegocioAberto: (aberto: boolean) => void;
  criarNegocio: (evento: React.FormEvent<HTMLFormElement>) => Promise<void>;
  estagios: Estagio[];
  funcionarios: Funcionario[];
  pdvs: Pdv[];
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  valorNovoNegocio: string;
  setValorNovoNegocio: (valor: string) => void;
  erroNovoNegocio: string | null;
  setErroNovoNegocio: (erro: string | null) => void;
  criandoNegocio: boolean;
  cargoNovoNegocio: { id_funcionario: string } | null;
  estagioAberto: string;
  estagioNovoNegocio: string;
  setEstagioNovoNegocio: (estagio: string) => void;
  setCargoNovoNegocio: (cargo: { id_funcionario: string } | null) => void;
  filtros: KanbanFilters;
  setFiltros: (filtros: KanbanFilters) => void;
  busca: string;
  setBusca: (busca: string) => void;
  ordenacao: OrdenacaoKanban;
  setOrdenacao: (ordenacao: OrdenacaoKanban) => void;
  modoFocoPendencias: boolean;
  setModoFocoPendencias: (ativo: boolean) => void;
  resumoPendencias: ResumoPendencias | null;
  totalNegocios?: number;
  totalPipeline?: number;
  negociosParados?: number;
  pendenciasCriticas?: number;
  kpis: KpiKanban[];
  origemStats: OrigemStats;
  notificacoesAtivadas: boolean;
  alternarNotificacoes: () => Promise<boolean>;
  permissaoNotificacao: () => NotificationPermission | "unknown";
  redistribuindoNegociosEmAtendimento?: boolean;
  redistribuirNegociosEmAtendimento?: () => Promise<
    | { ok: false; erro: string }
    | { ok: true; avaliados: number; elegiveis: number; reatribuidos: number; ignoradosSemDestino: number }
  >;
};

export function KanbanHeader({
  dialogNovoNegocioAberto,
  setDialogNovoNegocioAberto,
  criarNegocio,
  estagios,
  funcionarios,
  pdvs,
  perfil,
  valorNovoNegocio,
  setValorNovoNegocio,
  erroNovoNegocio,
  setErroNovoNegocio,
  criandoNegocio,
  cargoNovoNegocio,
  estagioAberto,
  estagioNovoNegocio,
  setEstagioNovoNegocio,
  setCargoNovoNegocio,
  filtros,
  setFiltros,
  busca,
  setBusca,
  ordenacao,
  setOrdenacao,
  modoFocoPendencias,
  setModoFocoPendencias,
  resumoPendencias,
  totalNegocios = 0,
  totalPipeline = 0,
  negociosParados = 0,
  pendenciasCriticas = 0,
  kpis,
  origemStats,
  notificacoesAtivadas,
  alternarNotificacoes,
  permissaoNotificacao,
  redistribuindoNegociosEmAtendimento,
  redistribuirNegociosEmAtendimento,
}: KanbanHeaderProps) {
  const { addToast } = useToast();
  const [contatosDisponiveis, setContatosDisponiveis] = useState<ContatoDisponivelNegocio[]>([]);
  const [carregandoContatosDisponiveis, setCarregandoContatosDisponiveis] = useState(false);
  const [contatosSelecionados, setContatosSelecionados] = useState<string[]>([]);
  const inputBuscaRef = useRef<HTMLInputElement>(null);
  const inputNomeNovoNegocioRef = useRef<HTMLInputElement>(null);
  const filtrosAtivos = temFiltrosKanbanAtivos(filtros);
  const subtitleResumo = criarResumoKanban({ totalNegocios, totalPipeline, negociosParados });

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
      if (!alvoEditavel && !dialogNovoNegocioAberto && e.key === "/") {
        e.preventDefault();
        inputBuscaRef.current?.focus();
      }
      if (e.altKey && e.key.toLowerCase() === "n" && !dialogNovoNegocioAberto) {
        e.preventDefault();
        setDialogNovoNegocioAberto(true);
        setErroNovoNegocio(null);
      }
      if (e.key === "Escape" && document.activeElement === inputBuscaRef.current) {
        setBusca("");
        inputBuscaRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogNovoNegocioAberto, setBusca, setDialogNovoNegocioAberto, setErroNovoNegocio]);

  useEffect(() => {
    if (!dialogNovoNegocioAberto) {
      setContatosSelecionados([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      inputNomeNovoNegocioRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [dialogNovoNegocioAberto]);

  useEffect(() => {
    if (!dialogNovoNegocioAberto) {
      return;
    }

    let ativo = true;

    const carregarContatosDisponiveis = async () => {
      setCarregandoContatosDisponiveis(true);
      try {
        const resposta = await fetch("/api/leads", { cache: "no-store" });
        const json = (await resposta.json().catch(() => ({}))) as { leads?: ContatoDisponivelNegocio[] };
        if (!ativo || !resposta.ok) {
          return;
        }

        setContatosDisponiveis(json.leads ?? []);
      } catch {
        if (ativo) {
          setContatosDisponiveis([]);
        }
      } finally {
        if (ativo) {
          setCarregandoContatosDisponiveis(false);
        }
      }
    };

    void carregarContatosDisponiveis();

    return () => {
      ativo = false;
    };
  }, [dialogNovoNegocioAberto]);

  const limparFiltros = () => {
    setFiltros({ status: "todos", gravidade: "todas", tipo: "todos", pdv: null, origem: "todos" });
    setModoFocoPendencias(false);
  };

  const onDialogNovoNegocioChange = (aberto: boolean) => {
    if (!aberto && criandoNegocio) {
      return;
    }

    setDialogNovoNegocioAberto(aberto);
    if (!aberto) {
      setErroNovoNegocio(null);
    }
  };

  const onFiltroRapido = (tipo: FiltroRapidoKanban) => {
    const proximoEstado = aplicarFiltroRapidoKanban({ tipo, filtros, modoFocoPendencias });
    setModoFocoPendencias(proximoEstado.modoFocoPendencias);
    setFiltros(proximoEstado.filtros);
  };

  const onToggleNotificacoes = async () => {
    const permissao = permissaoNotificacao();
    if (permissao === "denied") {
      addToast({ type: "warning", title: "Notificações bloqueadas", description: "Habilite nas configurações do navegador." });
      return;
    }
    await alternarNotificacoes();
  };

  const onRedistribuir = async () => {
    if (!redistribuirNegociosEmAtendimento) {
      addToast({ type: "warning", title: "Funcionalidade indisponível", description: "A função de redistribuição não está disponível." });
      return;
    }

    const resultado = await redistribuirNegociosEmAtendimento();
    if (!resultado.ok) {
      addToast({ type: "error", title: "Falha na redistribuição", description: resultado.erro ?? "Não foi possível redistribuir os negócios." });
      return;
    }

    addToast({
      type: "success",
      title: "Redistribuição concluída",
      description: `${resultado.reatribuidos} negócio(s) reatribuído(s). ${resultado.ignoradosSemDestino} ignorado(s) por falta de destino.`,
    });
  };

  return (
    <>
      <KanbanHeaderMobile
        subtitleResumo={subtitleResumo}
        dialogNovoNegocioAberto={dialogNovoNegocioAberto}
        onDialogNovoNegocioChange={onDialogNovoNegocioChange}
        criarNegocio={criarNegocio}
        inputNomeNovoNegocioRef={inputNomeNovoNegocioRef}
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
        busca={busca}
        setBusca={setBusca}
        inputBuscaRef={inputBuscaRef}
        kpis={kpis}
        filtros={filtros}
        ordenacao={ordenacao}
        setOrdenacao={setOrdenacao}
        setFiltros={setFiltros}
        modoFocoPendencias={modoFocoPendencias}
        setModoFocoPendencias={setModoFocoPendencias}
        notificacoesAtivadas={notificacoesAtivadas}
        onToggleNotificacoes={onToggleNotificacoes}
        onFiltroRapido={onFiltroRapido}
      />

      <KanbanHeaderDesktop
        subtitleResumo={subtitleResumo}
        busca={busca}
        setBusca={setBusca}
        inputBuscaRef={inputBuscaRef}
        ordenacao={ordenacao}
        setOrdenacao={setOrdenacao}
        perfil={perfil}
        pdvs={pdvs}
        filtros={filtros}
        setFiltros={setFiltros}
        resumoPendencias={resumoPendencias}
        modoFocoPendencias={modoFocoPendencias}
        setModoFocoPendencias={setModoFocoPendencias}
        notificacoesAtivadas={notificacoesAtivadas}
        onToggleNotificacoes={onToggleNotificacoes}
        dialogNovoNegocioAberto={dialogNovoNegocioAberto}
        onDialogNovoNegocioChange={onDialogNovoNegocioChange}
        criarNegocio={criarNegocio}
        inputNomeNovoNegocioRef={inputNomeNovoNegocioRef}
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
        funcionarios={funcionarios}
        estagios={estagios}
        erroNovoNegocio={erroNovoNegocio}
        redistribuindoNegociosEmAtendimento={redistribuindoNegociosEmAtendimento}
        onRedistribuir={onRedistribuir}
        kpis={kpis}
        pendenciasCriticas={pendenciasCriticas}
        origemStats={origemStats}
        onFiltroRapido={onFiltroRapido}
        filtrosAtivos={filtrosAtivos}
        limparFiltros={limparFiltros}
      />
    </>
  );
}
