"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useToast } from "@/components/ui/toast";
import {
  atualizarLeadContato,
  cancelarCampanhaDisparoLeadsApi,
  criarCampanhaDisparoLeadsApi,
  criarLeadContato,
  importarLeadsCsvApi,
  detalharCampanhaDisparoLeadsApi,
  listarCampanhasDisparoLeadsApi,
  listarLeadsApi,
  removerLeadContato,
  removerLeadsEmMassa,
  type ApiFuncionarioContato,
  type ApiLeadContato,
  type ApiPdvContato,
  type PayloadCriarCampanhaDisparo,
} from "@/lib/api/leads";
import { listarInstanciasWhatsapp } from "@/lib/api/whatsapp.instances";
import {
  listarNegociosApi,
  vincularLeadAoNegocio,
  criarNegocioApi,
  type ApiNegocioResumo,
} from "@/lib/api/negocios";
import type { ApiEstagioLead, FormularioNovoLead, UseLeadsModuleReturn } from "../types";
import {
  criarFormularioEdicaoLead,
  criarFormularioNovoLead,
  criarMapaPdvs,
  calcularResumoSelecaoDisparo,
  obterLeadsSelecionados,
  criarPayloadLeadContato,
  criarResumoLeads,
  filtrarLeads,
  filtrarNegociosParaVinculo,
  mapearLinhaLead,
  obterNegociosRelacionadosAoLead,
  rotuloNegocioLead,
} from "../utils";

function criarFormularioCampanhaBase(leadIds: string[]): PayloadCriarCampanhaDisparo {
  return {
    nome: "Campanha de disparo",
    leadIds,
    mensagemTemplate: "Oi {{lead_nome}}, tudo bem?",
    iniciarAgora: true,
    delayMinSegundos: 120,
    delayMaxSegundos: 240,
    jitterMsMax: 999,
    filtrosSnapshot: {},
    pdvInstancias: [],
    fallbackInstanciaSemPdvId: "",
  };
}

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
  const [erroDisparo, setErroDisparo] = useState<string | null>(null);
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
  const [dialogRemocaoMassaAberto, setDialogRemocaoMassaAberto] = useState(false);
  const [removendoLeadsEmMassa, setRemovendoLeadsEmMassa] = useState(false);
  const [dialogNovoLeadAberto, setDialogNovoLeadAberto] = useState(false);
  const [dialogImportacaoAberto, setDialogImportacaoAberto] = useState(false);
  const [importandoCsv, setImportandoCsv] = useState(false);
  const [erroImportacaoCsv, setErroImportacaoCsv] = useState<string | null>(null);
  const [criandoLead, setCriandoLead] = useState(false);
  const [erroNovoLead, setErroNovoLead] = useState<string | null>(null);
  const [formularioNovoLead, setFormularioNovoLead] = useState<FormularioNovoLead>(() => criarFormularioNovoLead());
  const [leadEmEdicao, setLeadEmEdicao] = useState<ApiLeadContato | null>(null);
  const [idsSelecionados, setIdsSelecionados] = useState<string[]>([]);
  const [dialogDisparoAberto, setDialogDisparoAberto] = useState(false);
  const [disparandoCampanha, setDisparandoCampanha] = useState(false);
  const [carregandoCampanhas, setCarregandoCampanhas] = useState(false);
  const [carregandoDetalheCampanha, setCarregandoDetalheCampanha] = useState(false);
  const [campanhas, setCampanhas] = useState<UseLeadsModuleReturn["campanhas"]>([]);
  const [campanhaDetalhe, setCampanhaDetalhe] = useState<UseLeadsModuleReturn["campanhaDetalhe"]>(null);
  const [campanhaDetalheIdAberta, setCampanhaDetalheIdAberta] = useState<string | null>(null);
  const [instanciasWhatsapp, setInstanciasWhatsapp] = useState<UseLeadsModuleReturn["instanciasWhatsapp"]>([]);
  const [formularioDisparo, setFormularioDisparo] = useState<PayloadCriarCampanhaDisparo>(() => criarFormularioCampanhaBase([]));
  const [dialogConversaoAberto, setDialogConversaoAberto] = useState(false);
  const [convertendoLeads, setConvertendoLeads] = useState(false);
  const [erroConversao, setErroConversao] = useState<string | null>(null);
  const [formularioConversao, setFormularioConversao] = useState({
    idEstagio: "",
    idFuncionario: "",
    usarResponsavelAutomatico: false,
  });
  const [leadsComNegocio, setLeadsComNegocio] = useState<ApiLeadContato[]>([]);
  const [leadsSemNegocio, setLeadsSemNegocio] = useState<ApiLeadContato[]>([]);
  const [dialogConflitoAberto, setDialogConflitoAberto] = useState(false);
  const [acaoConflito, setAcaoConflito] = useState<"substituir" | "ignorar" | "criar_novo" | null>(null);

  const carregarDados = async (silencioso = false) => {
    if (silencioso) {
      setRecarregando(true);
    } else {
      setCarregando(true);
    }
    setErro(null);

    try {
      const [resultadoLeads, resultadoNegocios, resultadoInstancias] = await Promise.all([
        listarLeadsApi(),
        listarNegociosApi(),
        listarInstanciasWhatsapp(),
      ]);

      if (!resultadoLeads.ok) throw new Error(resultadoLeads.erro);
      if (!resultadoNegocios.ok) throw new Error(resultadoNegocios.erro);

      setLeads(resultadoLeads.dados.leads ?? []);
      setFuncionarios(resultadoLeads.dados.funcionarios ?? []);
      setPdvs(resultadoLeads.dados.pdvs ?? []);
      setNegocios(resultadoNegocios.dados.negocios ?? []);
      setEstagios(resultadoNegocios.dados.estagios ?? []);
      setInstanciasWhatsapp(
        resultadoInstancias.ok
          ? (resultadoInstancias.dados.instancias ?? []).map((item) => ({
              id: item.id,
              nome: item.nome,
              instance_name: item.instance_name,
            }))
          : [],
      );
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  };

  const carregarCampanhas = async () => {
    setCarregandoCampanhas(true);
    try {
      const resultado = await listarCampanhasDisparoLeadsApi(20);
      if (resultado.ok) {
        setCampanhas(resultado.dados.campanhas);
        setErroDisparo(null);
      } else {
        setErroDisparo(resultado.erro);
      }
    } catch (error) {
      setErroDisparo(error instanceof Error ? error.message : "Não foi possível carregar as campanhas.");
    } finally {
      setCarregandoCampanhas(false);
    }
  };

  useEffect(() => {
    void Promise.all([carregarDados(), carregarCampanhas()]);
  }, []);

  useEffect(() => {
    setFormularioNovoLead((atual) => {
      if (atual.idFuncionario || funcionarios.length === 0) return atual;
      return { ...atual, idFuncionario: funcionarios[0]?.id ?? "" };
    });
  }, [funcionarios]);

  const estagiosPorId = useMemo(() => new Map(estagios.map((item) => [item.id, item] as const)), [estagios]);
  const funcionariosPorId = useMemo(() => new Map(funcionarios.map((item) => [item.id, item] as const)), [funcionarios]);
  const pdvsPorId = useMemo(() => criarMapaPdvs(pdvs), [pdvs]);
  const negociosPorId = useMemo(() => new Map(negocios.map((item) => [item.id, item] as const)), [negocios]);

  const leadsFiltrados = useMemo(
    () =>
      filtrarLeads({ busca, leads, estagiosPorId, funcionariosPorId, pdvsPorId, negociosPorId }),
    [busca, estagiosPorId, funcionariosPorId, leads, negociosPorId, pdvsPorId],
  );

  const linhasTabela = useMemo(
    () =>
      leadsFiltrados.map((lead) =>
        mapearLinhaLead({ lead, estagiosPorId, funcionariosPorId, pdvsPorId, negociosPorId }),
      ),
    [estagiosPorId, funcionariosPorId, leadsFiltrados, negociosPorId, pdvsPorId],
  );

  const negociosParaVinculo = useMemo(() => filtrarNegociosParaVinculo(buscaNegocio, negocios), [buscaNegocio, negocios]);
  const negociosRelacionadosAoLead = useMemo(() => obterNegociosRelacionadosAoLead(leadParaRemover, negocios), [leadParaRemover, negocios]);
  const idsPagina = useMemo(() => linhasTabela.map((item) => item.id), [linhasTabela]);
  const leadsSelecionados = useMemo(() => obterLeadsSelecionados(idsSelecionados, leads), [idsSelecionados, leads]);
  const totalSelecionados = idsSelecionados.length;
  const todosFiltradosSelecionados = leadsFiltrados.length > 0 && leadsFiltrados.every((lead) => idsSelecionados.includes(lead.id));

  const leadsSelecionadosParaRemocao = useMemo(
    () => leads.filter((lead) => idsSelecionados.includes(lead.id)),
    [idsSelecionados, leads],
  );

  const { pdvsPresentesNaSelecao, semPdvSelecionados } = useMemo(
    () => calcularResumoSelecaoDisparo(leadsSelecionados, pdvsPorId),
    [leadsSelecionados, pdvsPorId],
  );

  const abrirVinculo = (lead: ApiLeadContato) => {
    setLeadEmVinculo(lead);
    setNegocioSelecionadoId(lead.id_negocio && negociosPorId.has(lead.id_negocio) ? lead.id_negocio : negocios[0]?.id ?? "");
    setBuscaNegocio("");
    setErroVinculo(null);
    setDialogVinculoAberto(true);
  };

  const fecharVinculo = () => {
    if (vinculando) return;
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
    if (removendoLead) return;
    setLeadParaRemover(null);
    setRemoverNegociosVinculados(false);
    setErroRemocaoLead(null);
  };

  const abrirRemocaoMassa = () => {
    setErroRemocaoLead(null);
    setDialogRemocaoMassaAberto(true);
  };

  const fecharRemocaoMassa = () => {
    if (removendoLeadsEmMassa || !dialogRemocaoMassaAberto) return;
    setDialogRemocaoMassaAberto(false);
    setErroRemocaoLead(null);
  };

  const confirmarRemocaoMassa = async () => {
    if (removendoLeadsEmMassa || leadsSelecionadosParaRemocao.length === 0) return;
    setRemovendoLeadsEmMassa(true);
    setErroRemocaoLead(null);

    try {
      const resultado = await removerLeadsEmMassa({
        lead_ids: leadsSelecionadosParaRemocao.map((l) => l.id),
        remover_negocios_vinculados: removerNegociosVinculados,
      });

      if (!resultado.ok) {
        setErroRemocaoLead(resultado.erro);
        return;
      }

      if (resultado.dados.erros > 0) {
        setErroRemocaoLead(`${resultado.dados.erros} lead(s) n�o puderam ser removidos.`);
      }

      setDialogRemocaoMassaAberto(false);
      setIdsSelecionados([]);
      await carregarDados(true);
      addToast({
        type: "success",
        title: "Leads removidos",
        description: `${resultado.dados.removidos} lead(s) removido(s) com sucesso.`,
      });
    } catch (error) {
      setErroRemocaoLead(error instanceof Error ? error.message : "Não foi possível remover os leads.");
    } finally {
      setRemovendoLeadsEmMassa(false);
    }
  };

  const abrirNovoLead = () => {
    setLeadEmEdicao(null);
    setFormularioNovoLead(criarFormularioNovoLead(funcionarios[0]?.id ?? ""));
    setErroNovoLead(null);
    setDialogNovoLeadAberto(true);
  };

  const abrirImportacaoCsv = () => {
    setErroImportacaoCsv(null);
    setDialogImportacaoAberto(true);
  };

  const fecharImportacaoCsv = () => {
    if (importandoCsv) return;
    setDialogImportacaoAberto(false);
    setErroImportacaoCsv(null);
  };

  const abrirEdicaoLead = (lead: ApiLeadContato) => {
    setLeadEmEdicao(lead);
    setFormularioNovoLead(criarFormularioEdicaoLead(lead));
    setErroNovoLead(null);
    setDialogNovoLeadAberto(true);
  };

  const fecharNovoLead = () => {
    if (criandoLead) return;
    setDialogNovoLeadAberto(false);
    setErroNovoLead(null);
    setLeadEmEdicao(null);
  };

  const atualizarFormularioNovoLead = <Campo extends keyof FormularioNovoLead>(campo: Campo, valor: FormularioNovoLead[Campo]) => {
    setFormularioNovoLead((atual) => ({ ...atual, [campo]: valor }));
  };

  const confirmarRemocaoLead = async () => {
    if (!leadParaRemover || removendoLead) return;
    setRemovendoLead(true);
    setErroRemocaoLead(null);

    try {
      const resultado = await removerLeadContato(leadParaRemover.id, { remover_negocios_vinculados: removerNegociosVinculados });
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
    if (criandoLead) return;
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
        : await criarLeadContato({ ...payloadBase, origem: "MANUAL" });

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

  const importarLeadsCsv: UseLeadsModuleReturn["importarLeadsCsv"] = async (payload) => {
    if (importandoCsv) return;
    setImportandoCsv(true);
    setErroImportacaoCsv(null);

    try {
      const resultado = await importarLeadsCsvApi(payload);
      if (!resultado.ok) {
        setErroImportacaoCsv(resultado.erro);
        return;
      }

      setDialogImportacaoAberto(false);
      await carregarDados(true);
      addToast({
        type: "success",
        title: "Importação concluída",
        description: `${resultado.dados.criados} lead(s) criado(s), ${resultado.dados.ignorados} ignorado(s).`,
      });
    } catch (error) {
      setErroImportacaoCsv(error instanceof Error ? error.message : "Não foi possível importar o CSV.");
    } finally {
      setImportandoCsv(false);
    }
  };

  const confirmarVinculo = async () => {
    if (!leadEmVinculo || !negocioSelecionadoId) {
      setErroVinculo("Selecione um negócio para vincular o lead.");
      return;
    }
    if (vinculando) return;
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
      addToast({ type: "success", title: "Lead vinculado", description: `${leadEmVinculo.nome} foi vinculado a ${negocioInfo.titulo}.` });
    } catch (error) {
      setErroVinculo(error instanceof Error ? error.message : "Não foi possível vincular o lead.");
    } finally {
      setVinculando(false);
    }
  };

  const alternarSelecao = (leadId: string) => {
    setIdsSelecionados((atual) => (atual.includes(leadId) ? atual.filter((id) => id !== leadId) : [...atual, leadId]));
  };

  const alternarSelecaoPagina = () => {
    const todosSelecionados = idsPagina.every((id) => idsSelecionados.includes(id));
    if (todosSelecionados) {
      setIdsSelecionados((atual) => atual.filter((id) => !idsPagina.includes(id)));
      return;
    }
    setIdsSelecionados((atual) => Array.from(new Set([...atual, ...idsPagina])));
  };

  const selecionarTodosFiltrados = () => {
    setIdsSelecionados(Array.from(new Set(leadsFiltrados.map((item) => item.id))));
  };

  const limparSelecao = () => setIdsSelecionados([]);

  const abrirDialogDisparo = () => {
    const base = criarFormularioCampanhaBase(idsSelecionados);
    const pdvInstancias = pdvsPresentesNaSelecao
      .map((pdv) => {
        const leadPdv = leads.find((lead) => idsSelecionados.includes(lead.id) && lead.id_pdv === pdv.id);
        if (!leadPdv) return null;
        return { pdvId: pdv.id, instanciaId: "" };
      })
      .filter((item): item is { pdvId: string; instanciaId: string } => item !== null);

    setFormularioDisparo({
      ...base,
      pdvInstancias,
      filtrosSnapshot: { busca, totalFiltrados: leadsFiltrados.length },
    });
    setErroDisparo(null);
    setDialogDisparoAberto(true);
  };

  const fecharDialogDisparo = () => {
    if (disparandoCampanha) return;
    setDialogDisparoAberto(false);
  };

  const atualizarFormularioDisparo = <Campo extends keyof PayloadCriarCampanhaDisparo>(campo: Campo, valor: PayloadCriarCampanhaDisparo[Campo]) => {
    setFormularioDisparo((atual) => ({ ...atual, [campo]: valor }));
  };

  const atualizarInstanciaPdvDisparo = (pdvId: string, instanciaId: string) => {
    setFormularioDisparo((atual) => ({
      ...atual,
      pdvInstancias: atual.pdvInstancias.map((item) => (item.pdvId === pdvId ? { ...item, instanciaId } : item)),
    }));
  };

  const submitCampanhaDisparo = async () => {
    setDisparandoCampanha(true);
    setErroDisparo(null);

    try {
      const payload: PayloadCriarCampanhaDisparo = {
        ...formularioDisparo,
        leadIds: leadsSelecionados.map((lead) => lead.id),
        pdvInstancias: formularioDisparo.pdvInstancias.filter((item) => item.instanciaId),
        fallbackInstanciaSemPdvId: formularioDisparo.fallbackInstanciaSemPdvId || undefined,
      };

      const resultado = await criarCampanhaDisparoLeadsApi(payload);
      if (!resultado.ok) {
        setErroDisparo(resultado.erro);
        return;
      }

      addToast({
        type: "success",
        title: "Campanha criada",
        description: `${resultado.dados.resumo.elegiveisTotal} leads foram agendados para disparo.`,
      });

      setDialogDisparoAberto(false);
      setIdsSelecionados([]);
      await carregarCampanhas();
    } catch (error) {
      setErroDisparo(error instanceof Error ? error.message : "Não foi possível criar a campanha.");
    } finally {
      setDisparandoCampanha(false);
    }
  };

  const abrirDetalheCampanha = async (campanhaId: string) => {
    setCampanhaDetalheIdAberta(campanhaId);
    setCarregandoDetalheCampanha(true);
    try {
      const resultado = await detalharCampanhaDisparoLeadsApi(campanhaId);
      if (resultado.ok) {
        setCampanhaDetalhe(resultado.dados.campanha);
        setErroDisparo(null);
      } else {
        setErroDisparo(resultado.erro);
      }
    } catch (error) {
      setErroDisparo(error instanceof Error ? error.message : "Não foi possível carregar o detalhe da campanha.");
    } finally {
      setCarregandoDetalheCampanha(false);
    }
  };

  const fecharDetalheCampanha = () => {
    setCampanhaDetalhe(null);
    setCampanhaDetalheIdAberta(null);
  };

  const cancelarCampanha = async (campanhaId: string) => {
    const resultado = await cancelarCampanhaDisparoLeadsApi(campanhaId);
    if (!resultado.ok) {
      setErroDisparo(resultado.erro);
      return;
    }
    addToast({ type: "success", title: "Campanha cancelada", description: `${resultado.dados.cancelados} envio(s) pendente(s) foram cancelados.` });
    await carregarCampanhas();
    if (campanhaDetalheIdAberta === campanhaId) {
      await abrirDetalheCampanha(campanhaId);
    }
  };

  const abrirDialogConversao = () => {
    // Inicializar formulário com primeiro estágio e primeiro funcionário
    const primeiroEstagio = estagios[0]?.id ?? "";
    const primeiroFuncionario = funcionarios[0]?.id ?? "";
    setFormularioConversao({
      idEstagio: primeiroEstagio,
      idFuncionario: primeiroFuncionario,
      usarResponsavelAutomatico: false,
    });
    setErroConversao(null);
    setAcaoConflito(null);
    setDialogConversaoAberto(true);
  };

  const fecharDialogConversao = () => {
    if (convertendoLeads) return;
    setDialogConversaoAberto(false);
    setDialogConflitoAberto(false);
    setErroConversao(null);
    setAcaoConflito(null);
  };

  const atualizarFormularioConversao = <Campo extends "idEstagio" | "idFuncionario" | "usarResponsavelAutomatico">(
    campo: Campo,
    valor: string | boolean,
  ) => {
    setFormularioConversao((atual) => ({ ...atual, [campo]: valor }));
  };

  const submitConversaoLeadsEmNegocios = async () => {
    if (!formularioConversao.idEstagio) {
      setErroConversao("Selecione um estágio para os negócios.");
      return;
    }
    if (estagios.length === 0) {
      setErroConversao("Nenhum estágio disponível. Configure um funil primeiro.");
      return;
    }
    if (convertendoLeads) return;
    if (leadsSelecionados.length === 0) {
      setErroConversao("Nenhum lead selecionado.");
      return;
    }

    // Separar leads com e sem negócio vinculado
    const comNegocio = leadsSelecionados.filter((lead) => lead.id_negocio);
    const semNegocio = leadsSelecionados.filter((lead) => !lead.id_negocio);

    setLeadsComNegocio(comNegocio);
    setLeadsSemNegocio(semNegocio);

    // Se não há conflitos, proceed directly
    if (comNegocio.length === 0) {
      await executarConversao(semNegocio);
      return;
    }

    // Se há conflitos, abrir tela de resolução
    setDialogConflitoAberto(true);
  };

  const executarConversao = async (leadsParaConverter: ApiLeadContato[]) => {
    if (leadsParaConverter.length === 0) {
      setDialogConversaoAberto(false);
      setDialogConflitoAberto(false);
      setAcaoConflito(null);
      addToast({
        type: "success",
        title: "Leads convertidos",
        description: `Todos os leads foram processados.`,
      });
      setIdsSelecionados([]);
      await carregarDados(true);
      return;
    }

    setConvertendoLeads(true);
    setErroConversao(null);

    try {
      const funilId = negocios.length > 0 ? negocios[0].id_funil : "";

      // Função round-robin para atribuição automática
      const ativos = funcionarios.filter((f) => f.id);
      let indiceRoundRobin = Math.floor(Date.now() / 1000) % Math.max(ativos.length, 1);

      const getProximoFuncionario = () => {
        if (ativos.length === 0) return formularioConversao.idFuncionario;
        const id = ativos[indiceRoundRobin % ativos.length].id;
        indiceRoundRobin++;
        return id;
      };

      // Criar um negócio para cada lead
      for (const lead of leadsParaConverter) {
        const idResponsavel = formularioConversao.usarResponsavelAutomatico
          ? getProximoFuncionario()
          : formularioConversao.idFuncionario;

        const resultado = await criarNegocioApi({
          titulo: lead.nome,
          valor_estimado: 0,
          id_funil: funilId,
          id_estagio: formularioConversao.idEstagio,
          id_funcionario: idResponsavel,
          lead_ids: [lead.id],
        });

        if (!resultado.ok) {
          console.error(`Erro ao converter lead ${lead.nome}:`, resultado.erro);
        }
      }

      addToast({
        type: "success",
        title: "Leads convertidos",
        description: `${leadsParaConverter.length} lead(s) foram convertidos em negócios.`,
      });

      setDialogConversaoAberto(false);
      setDialogConflitoAberto(false);
      setAcaoConflito(null);
      setIdsSelecionados([]);
      await carregarDados(true);
    } catch (error) {
      setErroConversao(error instanceof Error ? error.message : "Não foi possível converter os leads.");
    } finally {
      setConvertendoLeads(false);
    }
  };

  const confirmarConflito = async () => {
    if (!acaoConflito) return;

    const leadsFiltrados = leadsSelecionados;

    // Ação: ignorar - apenas converter leads sem negócio
    if (acaoConflito === "ignorar") {
      await executarConversao(leadsSemNegocio);
      return;
    }

    // Ação: criar_novo - converter todos (novos negócios, independente de já ter vínculo)
    if (acaoConflito === "criar_novo") {
      await executarConversao(leadsFiltrados);
      return;
    }

    // Ação: substituir - para MVP, treat as criar_novo (ignora vínculo anterior)
    if (acaoConflito === "substituir") {
      await executarConversao(leadsFiltrados);
      return;
    }
  };

  const { title, resumoTotal } = criarResumoLeads(leadsFiltrados.length, leads.length);

  return {
    busca,
    setBusca,
    carregando,
    recarregando,
    erro,
    erroDisparo,
    title,
    resumoTotal,
    leadsFiltrados,
    linhasTabela,
    estagios,
    campanhas,
    campanhaDetalhe,
    carregandoCampanhas,
    carregandoDetalheCampanha,
    campanhaDetalheIdAberta,
    disparandoCampanha,
    dialogDisparoAberto,
    podeDispararLote: true,
    idsSelecionados,
    totalSelecionados,
    todosFiltradosSelecionados,
    pdvsPresentesNaSelecao,
    semPdvSelecionados,
    instanciasWhatsapp,
    formularioDisparo,
    funcionarios,
    negociosParaVinculo,
    dialogVinculoAberto,
    leadEmVinculo,
    negocioSelecionadoId,
    buscaNegocio,
    vinculando,
    erroVinculo,
    dialogNovoLeadAberto,
    dialogImportacaoAberto,
    importandoCsv,
    erroImportacaoCsv,
    criandoLead,
    erroNovoLead,
    formularioNovoLead,
    leadEmEdicao,
    leadParaRemover,
    removendoLead,
    removerNegociosVinculados,
    erroRemocaoLead,
    negociosRelacionadosAoLead,
    leadsSelecionados,
    carregarDados,
    carregarCampanhas,
    limparBusca: () => setBusca(""),
    abrirDialogDisparo,
    fecharDialogDisparo,
    atualizarFormularioDisparo,
    atualizarInstanciaPdvDisparo,
    alternarSelecao,
    alternarSelecaoPagina,
    selecionarTodosFiltrados,
    limparSelecao,
    submitCampanhaDisparo,
    abrirDetalheCampanha,
    fecharDetalheCampanha,
    cancelarCampanha,
    abrirVinculo,
    fecharVinculo,
    setBuscaNegocio,
    setNegocioSelecionadoId,
    confirmarVinculo,
    abrirNovoLead,
    abrirImportacaoCsv,
    fecharImportacaoCsv,
    importarLeadsCsv,
    abrirEdicaoLead,
    fecharNovoLead,
    atualizarFormularioNovoLead,
    submitNovoLead,
    abrirRemocaoLead,
    fecharRemocaoLead,
    setRemoverNegociosVinculados,
    confirmarRemocaoLead,
    dialogRemocaoMassaAberto,
    removendoLeadsEmMassa,
    leadsSelecionadosParaRemocao,
    abrirRemocaoMassa,
    fecharRemocaoMassa,
    confirmarRemocaoMassa,
    // Conversão em massa de leads para negócios
    dialogConversaoAberto,
    convertendoLeads,
    erroConversao,
    formularioConversao,
    leadsComNegocio,
    leadsSemNegocio,
    dialogConflitoAberto,
    acaoConflito,
    abrirDialogConversao,
    fecharDialogConversao,
    atualizarFormularioConversao,
    setAcaoConflito,
    submitConversaoLeadsEmNegocios,
    confirmarConflito,
  };
}
