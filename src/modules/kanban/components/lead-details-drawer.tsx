"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MENSAGENS_KANBAN } from "../utils/mensagens";
import type { ApiLeadContato } from "@/lib/api/leads";
import type { Estagio, Funcionario, Lead, PendenciaDinamica, StatusSalvamentoDetalhesNegocio } from "../types";
import { LeadDetailsDrawerHeader } from "./lead-details-drawer-header";
import { LeadDetailsDrawerTabs } from "./lead-details-drawer-tabs";
import { LeadDetailsRemoveDialog } from "./lead-details-remove-dialog";
import {
  criarDescricaoRemocaoLeads,
  criarStatusSalvarNegocio,
  formatarHorarioDetalhesNegocio,
  obterAtalhoSalvarNegocio,
  obterIdsLeadsRelacionadosNegocio,
} from "./lead-details-drawer.utils";

type NegocioDetailsDrawerProps = {
  negocioSelecionado: Lead | null;
  pendenciasNegocio: PendenciaDinamica[];
  onOpenChange: (aberto: boolean) => void;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  estagios: Estagio[];
  funcionarios: Funcionario[];
  onMudarNegocio: (negocioAtualizado: Lead) => void;
  salvando: boolean;
  salvo: boolean;
  salvandoAutomaticamente: boolean;
  salvamentoAutomaticoPendente: boolean;
  ultimaAtualizacaoSalvaEm: Date | null;
  statusSalvamentoDetalhes: StatusSalvamentoDetalhesNegocio;
  erroDetalhesNegocio: string | null;
  setErroDetalhesNegocio: (erro: string | null) => void;
  onSalvarDetalhesNegocio: (negocio: Lead) => Promise<void>;
  leadsDisponiveis: ApiLeadContato[];
  carregandoLeadsDisponiveis: boolean;
  salvandoVinculos: boolean;
  removendoNegocio: boolean;
  erroVinculos: string | null;
  setErroVinculos: (erro: string | null) => void;
  onSalvarVinculos: (leadIds: string[]) => Promise<void>;
  onRemoverNegocio: (opcoes: { removerLeadsVinculados: boolean }) => Promise<boolean>;
};

export function NegocioDetailsDrawer(props: NegocioDetailsDrawerProps) {
  const {
    negocioSelecionado,
    pendenciasNegocio,
    onOpenChange,
    perfil,
    estagios,
    funcionarios,
    onMudarNegocio,
    salvando,
    salvo,
    salvandoAutomaticamente,
    salvamentoAutomaticoPendente,
    ultimaAtualizacaoSalvaEm,
    statusSalvamentoDetalhes,
    erroDetalhesNegocio,
    setErroDetalhesNegocio,
    onSalvarDetalhesNegocio,
    leadsDisponiveis,
    carregandoLeadsDisponiveis,
    salvandoVinculos,
    removendoNegocio,
    erroVinculos,
    setErroVinculos,
    onSalvarVinculos,
    onRemoverNegocio,
  } = props;

  const [temAlteracoes, setTemAlteracoes] = useState(false);
  const [tabAtiva, setTabAtiva] = useState("detalhes");
  const [fecharConfirmado, setFecharConfirmado] = useState(false);
  const [dialogRemocaoAberto, setDialogRemocaoAberto] = useState(false);
  const [removerLeadsVinculados, setRemoverLeadsVinculados] = useState(false);

  const textoUltimaAtualizacao = useMemo(() => {
    if (!ultimaAtualizacaoSalvaEm) return null;

    return formatarHorarioDetalhesNegocio(ultimaAtualizacaoSalvaEm);
  }, [ultimaAtualizacaoSalvaEm]);

  const atalhoSalvar = useMemo(() => {
    return obterAtalhoSalvarNegocio(typeof navigator !== "undefined" ? navigator.platform : null);
  }, []);

  const leadsRelacionados = useMemo(() => {
    return obterIdsLeadsRelacionadosNegocio(negocioSelecionado);
  }, [negocioSelecionado]);

  const quantidadeLeadsRelacionados = leadsRelacionados.length;

  const descricaoRemocao = useMemo(() => {
    return criarDescricaoRemocaoLeads(quantidadeLeadsRelacionados);
  }, [quantidadeLeadsRelacionados]);

  const statusSalvar = useMemo(() => {
    return criarStatusSalvarNegocio({
      atalhoSalvar,
      erroDetalhesNegocio,
      temAlteracoes,
      salvando,
      salvandoAutomaticamente,
      salvamentoAutomaticoPendente,
      salvo,
      statusSalvamentoDetalhes,
      textoUltimaAtualizacao,
    });
  }, [atalhoSalvar, erroDetalhesNegocio, temAlteracoes, salvando, salvandoAutomaticamente, salvamentoAutomaticoPendente, salvo, statusSalvamentoDetalhes, textoUltimaAtualizacao]);

  const handleOpenChange = useCallback((aberto: boolean) => {
    if (aberto) {
      onOpenChange(true);
      return;
    }

    let fechamentoConfirmadoAgora = false;

    if (!aberto && !fecharConfirmado && temAlteracoes) {
      const confirmar = window.confirm(MENSAGENS_KANBAN.confirmacao.descartarAlteracoes);
      if (!confirmar) return;
      setFecharConfirmado(true);
      fechamentoConfirmadoAgora = true;
    }

    if (!temAlteracoes || fecharConfirmado || fechamentoConfirmadoAgora) {
      onOpenChange(false);
      setFecharConfirmado(false);
      setTemAlteracoes(false);
      setTabAtiva("detalhes");
      setDialogRemocaoAberto(false);
      setRemoverLeadsVinculados(false);
    }
  }, [fecharConfirmado, temAlteracoes, onOpenChange]);

  const handleSalvar = useCallback(async () => {
    if (!negocioSelecionado) return;
    await onSalvarDetalhesNegocio(negocioSelecionado);
    setTemAlteracoes(false);
  }, [negocioSelecionado, onSalvarDetalhesNegocio]);

  const handleRemoverNegocio = useCallback(async () => {
    if (!negocioSelecionado) return;

    const sucesso = await onRemoverNegocio({ removerLeadsVinculados });
    if (!sucesso) {
      return;
    }

    setDialogRemocaoAberto(false);
    setRemoverLeadsVinculados(false);
    onOpenChange(false);
  }, [negocioSelecionado, onOpenChange, onRemoverNegocio, removerLeadsVinculados]);

  useEffect(() => {
    if (!negocioSelecionado) return;

    const handleAtalhos = (event: KeyboardEvent) => {
      const tecla = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && tecla === "s") {
        if (!temAlteracoes || salvando) return;
        event.preventDefault();
        void handleSalvar();
        return;
      }

      if (event.key !== "Escape") return;

      event.preventDefault();
      handleOpenChange(false);
    };

    window.addEventListener("keydown", handleAtalhos, true);
    return () => window.removeEventListener("keydown", handleAtalhos, true);
  }, [handleOpenChange, handleSalvar, temAlteracoes, negocioSelecionado, salvando]);

  return (
    <>
      <Sheet open={Boolean(negocioSelecionado)} onOpenChange={handleOpenChange}>
        <SheetContent key={negocioSelecionado?.id ?? "sem-negocio"} side="right" className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-2xl">
          <LeadDetailsDrawerHeader
            atalhoSalvar={atalhoSalvar}
            negocioSelecionado={negocioSelecionado}
            onAbrirRemocao={() => {
              setRemoverLeadsVinculados(false);
              setDialogRemocaoAberto(true);
            }}
            onFechar={() => handleOpenChange(false)}
            removendoNegocio={removendoNegocio}
            statusSalvar={statusSalvar}
          />

          <LeadDetailsDrawerTabs
            negocioSelecionado={negocioSelecionado}
            perfil={perfil}
            estagios={estagios}
            funcionarios={funcionarios}
            pendenciasNegocio={pendenciasNegocio}
            salvando={salvando}
            erroDetalhesNegocio={erroDetalhesNegocio}
            setErroDetalhesNegocio={setErroDetalhesNegocio}
            onMudarNegocio={onMudarNegocio}
            onSalvar={handleSalvar}
            temAlteracoes={temAlteracoes}
            setTemAlteracoes={setTemAlteracoes}
            tabAtiva={tabAtiva}
            setTabAtiva={setTabAtiva}
            leadsDisponiveis={leadsDisponiveis}
            carregandoLeadsDisponiveis={carregandoLeadsDisponiveis}
            salvandoVinculos={salvandoVinculos}
            erroVinculos={erroVinculos}
            setErroVinculos={setErroVinculos}
            onSalvarVinculos={onSalvarVinculos}
          />
        </SheetContent>
      </Sheet>

      <LeadDetailsRemoveDialog
        descricaoRemocao={descricaoRemocao}
        dialogRemocaoAberto={dialogRemocaoAberto}
        negocioSelecionado={negocioSelecionado}
        quantidadeLeadsRelacionados={quantidadeLeadsRelacionados}
        removerLeadsVinculados={removerLeadsVinculados}
        removendoNegocio={removendoNegocio}
        setRemoverLeadsVinculados={setRemoverLeadsVinculados}
        onConfirmar={() => void handleRemoverNegocio()}
        onOpenChange={(aberto) => {
          if (aberto) {
            setDialogRemocaoAberto(true);
            return;
          }

          if (removendoNegocio) {
            return;
          }

          setDialogRemocaoAberto(false);
          setRemoverLeadsVinculados(false);
        }}
      />
    </>
  );
}
