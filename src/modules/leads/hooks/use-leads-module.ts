"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useToast } from "@/components/ui/toast";
import {
  atualizarLeadContato,
  criarLeadContato,
  listarLeadsApi,
  removerLeadContato,
  type ApiFuncionarioContato,
  type ApiLeadContato,
  type ApiPdvContato,
} from "@/lib/api/leads";
import {
  listarNegociosApi,
  vincularLeadAoNegocio,
  type ApiNegocioResumo,
} from "@/lib/api/negocios";
import type { ApiEstagioLead, FormularioNovoLead, UseLeadsModuleReturn } from "../types";
import {
  criarFormularioEdicaoLead,
  criarFormularioNovoLead,
  criarPayloadLeadContato,
  criarResumoLeads,
  criarMapaPdvs,
  filtrarLeads,
  filtrarNegociosParaVinculo,
  mapearLinhaLead,
  obterNegociosRelacionadosAoLead,
  rotuloNegocioLead,
} from "../utils";

export function useLeadsModule(): UseLeadsModuleReturn {
  const { addToast } = useToast();
  const [leads, setLeads] = useState<ApiLeadContato[]>([]);
  const [negocios, setNegocios] = useState<ApiNegocioResumo[]>([]);
  const [estagios, setEstagios] = useState<ApiEstagioLead[]>([]);
  const [funcionarios, setFuncionarios] = useState<ApiFuncionarioContato[]>([]);
  const [pdvs, setPdvs] = useState<ApiPdvContato[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dialogVinculoAberto, setDialogVinculoAberto] = useState(false);
  const [leadEmVinculo, setLeadEmVinculo] = useState<ApiLeadContato | null>(null);
  const [negocioSelecionadoId, setNegocioSelecionadoId] = useState("");
  const [buscaNegocio, setBuscaNegocio] = useState("");
  const [vinculando, setVinculando] = useState(false);
  const [erroVinculo, setErroVinculo] = useState<string | null>(null);
  const [leadParaRemover, setLeadParaRemover] = useState<ApiLeadContato | null>(null);
  const [removendoLead, setRemovendoLead] = useState(false);
  const [removerNegociosVinculados, setRemoverNegociosVinculados] = useState(false);
  const [erroRemocaoLead, setErroRemocaoLead] = useState<string | null>(null);
  const [dialogNovoLeadAberto, setDialogNovoLeadAberto] = useState(false);
  const [criandoLead, setCriandoLead] = useState(false);
  const [erroNovoLead, setErroNovoLead] = useState<string | null>(null);
  const [formularioNovoLead, setFormularioNovoLead] = useState<FormularioNovoLead>(() => criarFormularioNovoLead());
  const [leadEmEdicao, setLeadEmEdicao] = useState<ApiLeadContato | null>(null);

  const carregarDados = async (silencioso = false) => {
    if (silencioso) {
      setRecarregando(true);
    } else {
      setCarregando(true);
    }

    setErro(null);

    try {
      const [resultadoLeads, resultadoNegocios] = await Promise.all([
        listarLeadsApi(),
        listarNegociosApi(),
      ]);

      if (!resultadoLeads.ok) {
        throw new Error(resultadoLeads.erro);
      }

      if (!resultadoNegocios.ok) {
        throw new Error(resultadoNegocios.erro);
      }

      setLeads(resultadoLeads.dados.leads ?? []);
      setFuncionarios(resultadoLeads.dados.funcionarios ?? []);
      setPdvs(resultadoLeads.dados.pdvs ?? []);
      setNegocios(resultadoNegocios.dados.negocios ?? []);
      setEstagios(resultadoNegocios.dados.estagios ?? []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, []);

  useEffect(() => {
    setFormularioNovoLead((atual) => {
      if (atual.idFuncionario || funcionarios.length === 0) {
        return atual;
      }

      return {
        ...atual,
        idFuncionario: funcionarios[0]?.id ?? "",
      };
    });
  }, [funcionarios]);

  const estagiosPorId = useMemo(() => new Map(estagios.map((item) => [item.id, item] as const)), [estagios]);
  const funcionariosPorId = useMemo(() => new Map(funcionarios.map((item) => [item.id, item] as const)), [funcionarios]);
  const pdvsPorId = useMemo(() => criarMapaPdvs(pdvs), [pdvs]);
  const negociosPorId = useMemo(() => new Map(negocios.map((item) => [item.id, item] as const)), [negocios]);

  const leadsFiltrados = useMemo(
    () =>
      filtrarLeads({
        busca,
        leads,
        estagiosPorId,
        funcionariosPorId,
        pdvsPorId,
        negociosPorId,
      }),
    [busca, estagiosPorId, funcionariosPorId, leads, negociosPorId, pdvsPorId],
  );

  const linhasTabela = useMemo(
    () =>
      leadsFiltrados.map((lead) =>
        mapearLinhaLead({
          lead,
          estagiosPorId,
          funcionariosPorId,
          pdvsPorId,
          negociosPorId,
        }),
      ),
    [estagiosPorId, funcionariosPorId, leadsFiltrados, negociosPorId, pdvsPorId],
  );

  const negociosParaVinculo = useMemo(
    () => filtrarNegociosParaVinculo(buscaNegocio, negocios),
    [buscaNegocio, negocios],
  );

  const negociosRelacionadosAoLead = useMemo(
    () => obterNegociosRelacionadosAoLead(leadParaRemover, negocios),
    [leadParaRemover, negocios],
  );

  const abrirVinculo = (lead: ApiLeadContato) => {
    setLeadEmVinculo(lead);
    setNegocioSelecionadoId(lead.id_negocio && negociosPorId.has(lead.id_negocio) ? lead.id_negocio : negocios[0]?.id ?? "");
    setBuscaNegocio("");
    setErroVinculo(null);
    setDialogVinculoAberto(true);
  };

  const fecharVinculo = () => {
    if (vinculando) {
      return;
    }
    setDialogVinculoAberto(false);
    setLeadEmVinculo(null);
    setNegocioSelecionadoId("");
    setBuscaNegocio("");
    setErroVinculo(null);
  };

  const abrirRemocaoLead = (lead: ApiLeadContato) => {
    setLeadParaRemover(lead);
    setRemoverNegociosVinculados(false);
    setErroRemocaoLead(null);
  };

  const fecharRemocaoLead = () => {
    if (removendoLead) {
      return;
    }
    setLeadParaRemover(null);
    setRemoverNegociosVinculados(false);
    setErroRemocaoLead(null);
  };

  const abrirNovoLead = () => {
    setLeadEmEdicao(null);
    setFormularioNovoLead(criarFormularioNovoLead(funcionarios[0]?.id ?? ""));
    setErroNovoLead(null);
    setDialogNovoLeadAberto(true);
  };

  const abrirEdicaoLead = (lead: ApiLeadContato) => {
    setLeadEmEdicao(lead);
    setFormularioNovoLead(criarFormularioEdicaoLead(lead));
    setErroNovoLead(null);
    setDialogNovoLeadAberto(true);
  };

  const fecharNovoLead = () => {
    if (criandoLead) {
      return;
    }
    setDialogNovoLeadAberto(false);
    setErroNovoLead(null);
    setLeadEmEdicao(null);
  };

  const atualizarFormularioNovoLead = <Campo extends keyof FormularioNovoLead>(
    campo: Campo,
    valor: FormularioNovoLead[Campo],
  ) => {
    setFormularioNovoLead((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const confirmarRemocaoLead = async () => {
    if (!leadParaRemover || removendoLead) {
      return;
    }

    setRemovendoLead(true);
    setErroRemocaoLead(null);

    try {
      const resultado = await removerLeadContato(leadParaRemover.id, {
        remover_negocios_vinculados: removerNegociosVinculados,
      });

      if (!resultado.ok) {
        setErroRemocaoLead(resultado.erro);
        return;
      }

      setLeadParaRemover(null);
      setRemoverNegociosVinculados(false);
      setLeads((atual) => atual.filter((item) => item.id !== leadParaRemover.id));

      await carregarDados(true);

      addToast({
        type: "success",
        title: "Lead removido",
        description:
          removerNegociosVinculados && resultado.dados.negocios_removidos && resultado.dados.negocios_removidos > 0
            ? `${leadParaRemover.nome} e ${resultado.dados.negocios_removidos} negócio(s) vinculados foram removidos.`
            : `${leadParaRemover.nome} foi removido com sucesso.`,
      });
    } catch (error) {
      setErroRemocaoLead(error instanceof Error ? error.message : "Não foi possível remover o lead.");
    } finally {
      setRemovendoLead(false);
    }
  };

  const submitNovoLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (criandoLead) {
      return;
    }

    if (funcionarios.length > 1 && !formularioNovoLead.idFuncionario) {
      setErroNovoLead("Selecione um responsável para este lead.");
      return;
    }

    setCriandoLead(true);
    setErroNovoLead(null);

    try {
      const payloadBase = criarPayloadLeadContato(formularioNovoLead);

      const resultado = leadEmEdicao
        ? await atualizarLeadContato(leadEmEdicao.id, payloadBase)
        : await criarLeadContato({
            ...payloadBase,
            origem: "MANUAL",
          });

      if (!resultado.ok) {
        setErroNovoLead(resultado.erro);
        return;
      }

      setDialogNovoLeadAberto(false);
      setLeadEmEdicao(null);
      setFormularioNovoLead(criarFormularioNovoLead(funcionarios[0]?.id ?? ""));
      await carregarDados(true);
      addToast({
        type: "success",
        title: leadEmEdicao ? "Lead atualizado" : "Lead cadastrado",
        description: leadEmEdicao
          ? `${resultado.dados.lead.nome} foi atualizado com sucesso.`
          : `${resultado.dados.lead.nome} entrou na fila de leads com origem manual.`,
      });
    } catch (error) {
      setErroNovoLead(error instanceof Error ? error.message : `Não foi possível ${leadEmEdicao ? "atualizar" : "cadastrar"} o lead.`);
    } finally {
      setCriandoLead(false);
    }
  };

  const confirmarVinculo = async () => {
    if (!leadEmVinculo || !negocioSelecionadoId) {
      setErroVinculo("Selecione um negócio para vincular o lead.");
      return;
    }

    if (vinculando) {
      return;
    }

    setVinculando(true);
    setErroVinculo(null);

    try {
      const resultado = await vincularLeadAoNegocio(negocioSelecionadoId, leadEmVinculo.id);

      if (!resultado.ok) {
        setErroVinculo(resultado.erro);
        return;
      }

      setDialogVinculoAberto(false);
      setLeadEmVinculo(null);
      setNegocioSelecionadoId("");
      setBuscaNegocio("");

      await carregarDados(true);

      const negocioAtualizado = resultado.dados.negocio ?? negociosPorId.get(negocioSelecionadoId) ?? null;
      const negocioInfo = rotuloNegocioLead(negocioAtualizado);

      addToast({
        type: "success",
        title: "Lead vinculado",
        description: `${leadEmVinculo.nome} foi vinculado a ${negocioInfo.titulo}.`,
      });
    } catch (error) {
      setErroVinculo(error instanceof Error ? error.message : "Não foi possível vincular o lead.");
    } finally {
      setVinculando(false);
    }
  };

  const { title, resumoTotal } = criarResumoLeads(leadsFiltrados.length, leads.length);

  return {
    busca,
    setBusca,
    carregando,
    recarregando,
    erro,
    title,
    resumoTotal,
    leadsFiltrados,
    linhasTabela,
    funcionarios,
    negociosParaVinculo,
    dialogVinculoAberto,
    leadEmVinculo,
    negocioSelecionadoId,
    buscaNegocio,
    vinculando,
    erroVinculo,
    dialogNovoLeadAberto,
    criandoLead,
    erroNovoLead,
    formularioNovoLead,
    leadEmEdicao,
    leadParaRemover,
    removendoLead,
    removerNegociosVinculados,
    erroRemocaoLead,
    negociosRelacionadosAoLead,
    carregarDados,
    limparBusca: () => setBusca(""),
    abrirVinculo,
    fecharVinculo,
    setBuscaNegocio,
    setNegocioSelecionadoId,
    confirmarVinculo,
    abrirNovoLead,
    abrirEdicaoLead,
    fecharNovoLead,
    atualizarFormularioNovoLead,
    submitNovoLead,
    abrirRemocaoLead,
    fecharRemocaoLead,
    setRemoverNegociosVinculados,
    confirmarRemocaoLead,
  };
}
