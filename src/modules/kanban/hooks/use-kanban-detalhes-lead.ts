import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { atualizarNegocioKanban } from "@/lib/api/kanban";
import { listarLeadsApi, type ApiLeadContato } from "@/lib/api/leads";
import { listarProdutos, type Produto } from "@/lib/api/produtos";
import {
  atualizarVinculosNegocio as atualizarVinculosNegocioApi,
  converterNegocioResumoParaCard,
  removerNegocio as removerNegocioApi,
} from "@/lib/api/negocios";
import type { Lead, StatusSalvamentoDetalhesNegocio } from "../types";
import { useToast } from "@/components/ui/toast";
import { useAutoSave } from "./use-auto-save";

type UseKanbanDetalhesNegocioParams = {
  negocioSelecionado: Lead | null;
  setNegocioSelecionado: Dispatch<SetStateAction<Lead | null>>;
  setNegocios: Dispatch<SetStateAction<Lead[]>>;
};

export function useKanbanDetalhesNegocio({
  negocioSelecionado,
  setNegocioSelecionado,
  setNegocios,
}: UseKanbanDetalhesNegocioParams) {
  const { addToast } = useToast();
  const [erroDetalhesNegocio, setErroDetalhesNegocio] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [salvandoAutomaticamente, setSalvandoAutomaticamente] = useState(false);
  const [ultimaAtualizacaoSalvaEm, setUltimaAtualizacaoSalvaEm] = useState<Date | null>(null);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([]);
  const [carregandoProdutosDisponiveis, setCarregandoProdutosDisponiveis] = useState(false);
  const [leadsDisponiveis, setLeadsDisponiveis] = useState<ApiLeadContato[]>([]);
  const [carregandoLeadsDisponiveis, setCarregandoLeadsDisponiveis] = useState(false);
  const [salvandoVinculos, setSalvandoVinculos] = useState(false);
  const [removendoNegocio, setRemovendoNegocio] = useState(false);
  const [erroVinculos, setErroVinculos] = useState<string | null>(null);
  const salvarAutomaticamenteRef = useRef<(negocioAtualizado: Lead) => Promise<void>>(async () => {});

  const { autoSavePendente, agendarAutoSave, cancelarAutoSave } = useAutoSave<Lead>({
    delayMs: 1800,
    enabled: Boolean(negocioSelecionado),
    onSave: async (negocioAtualizado) => {
      await salvarAutomaticamenteRef.current(negocioAtualizado);
    },
  });

  const salvarDetalhesNegocio = useCallback(
    async (negocio: Lead) => {
      cancelarAutoSave();
      setSalvando(true);
      setSalvandoAutomaticamente(false);
      setSalvo(false);
      setErroDetalhesNegocio(null);

      try {
        const resposta = await atualizarNegocioKanban(negocio.id, {
          observacoes_comerciais: negocio.observacoes,
          valor_estimado: Number(negocio.valor_oportunidade),
          id_funcionario: negocio.id_funcionario,
          id_produto_principal: negocio.id_produto_principal ?? null,
        });

        if (!resposta.ok) {
          setErroDetalhesNegocio(resposta.erro);
          setSalvando(false);
          setSalvandoAutomaticamente(false);
          return;
        }

        if (resposta.dados.negocio) {
          const negocioAtualizado = resposta.dados.negocio;
          setNegocios((atual) => atual.map((item) => (item.id === negocioAtualizado.id ? negocioAtualizado : item)));
          setNegocioSelecionado((atual) => (atual && atual.id === negocioAtualizado.id ? negocioAtualizado : atual));
        }

        setSalvando(false);
        setSalvandoAutomaticamente(false);
        setSalvo(true);
        setUltimaAtualizacaoSalvaEm(new Date());

        addToast({
          type: "success",
          title: "Negócio atualizado",
          description: "As alterações do negócio foram salvas com sucesso.",
        });

        setTimeout(() => setSalvo(false), 2000);
      } catch {
        setErroDetalhesNegocio("Erro ao salvar negócio.");
        setSalvando(false);
        setSalvandoAutomaticamente(false);
      }
    },
    [addToast, cancelarAutoSave, setNegocios, setNegocioSelecionado],
  );

  const carregarLeadsDisponiveis = useCallback(async () => {
    setCarregandoLeadsDisponiveis(true);
    setErroVinculos(null);
    try {
      const resultado = await listarLeadsApi();
      if (!resultado.ok) {
        setLeadsDisponiveis([]);
        setErroVinculos(resultado.erro);
        return;
      }

      const leadsApi = resultado.dados.leads ?? [];
      const leadsJaVinculados = (negocioSelecionado?.leads_vinculados ?? []).map((lead) => ({
        id: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        id_negocio: lead.id_negocio ?? negocioSelecionado?.id ?? null,
        id_estagio: negocioSelecionado?.id_estagio ?? "",
        id_funcionario: negocioSelecionado?.id_funcionario ?? "",
        valor_oportunidade: 0,
        atualizado_em: negocioSelecionado?.atualizado_em ?? new Date().toISOString(),
      }));

      const merged = new Map<string, ApiLeadContato>();
      for (const lead of leadsJaVinculados) {
        merged.set(lead.id, lead);
      }
      for (const lead of leadsApi) {
        merged.set(lead.id, { ...merged.get(lead.id), ...lead });
      }

      setLeadsDisponiveis(Array.from(merged.values()));
    } catch {
      setLeadsDisponiveis([]);
      setErroVinculos("Erro ao carregar leads disponiveis.");
    } finally {
      setCarregandoLeadsDisponiveis(false);
    }
  }, [negocioSelecionado]);

  const carregarProdutosDisponiveis = useCallback(async () => {
    setCarregandoProdutosDisponiveis(true);

    try {
      const resultado = await listarProdutos();

      if (!resultado.ok) {
        setProdutosDisponiveis([]);
        addToast({
          type: "error",
          title: "Produtos indisponíveis",
          description: resultado.erro,
        });
        return;
      }

      setProdutosDisponiveis(resultado.dados.produtos);
    } catch {
      setProdutosDisponiveis([]);
      addToast({
        type: "error",
        title: "Produtos indisponíveis",
        description: "Erro ao carregar produtos disponíveis.",
      });
    } finally {
      setCarregandoProdutosDisponiveis(false);
    }
  }, [addToast]);

  const atualizarVinculosNegocio = useCallback(
    async (leadIds: string[]) => {
      if (!negocioSelecionado) return;

      setSalvandoVinculos(true);
      setErroVinculos(null);

      try {
        const resposta = await atualizarVinculosNegocioApi(negocioSelecionado.id, leadIds);

        if (!resposta.ok) {
          setErroVinculos(resposta.erro);
          return;
        }

        if (resposta.dados.negocio) {
          const negocioAtualizado = converterNegocioResumoParaCard(resposta.dados.negocio);
          setNegocios((atual) => atual.map((item) => (item.id === negocioAtualizado.id ? negocioAtualizado : item)));
          setNegocioSelecionado((atual) => (atual && atual.id === negocioAtualizado.id ? negocioAtualizado : atual));
        }

        addToast({
          type: "success",
          title: "Vínculos atualizados",
          description: "Os leads do negócio foram atualizados com sucesso.",
        });
      } catch {
        setErroVinculos("Erro ao atualizar vínculos do negócio.");
      } finally {
        setSalvandoVinculos(false);
      }
    },
    [addToast, negocioSelecionado, setNegocios, setNegocioSelecionado],
  );

  const removerNegocio = useCallback(
    async ({ removerLeadsVinculados }: { removerLeadsVinculados: boolean }) => {
      if (!negocioSelecionado || removendoNegocio) {
        return false;
      }

      setRemovendoNegocio(true);
      setErroDetalhesNegocio(null);
      setErroVinculos(null);
      cancelarAutoSave();

      try {
        const resposta = await removerNegocioApi(negocioSelecionado.id, {
          remover_leads_vinculados: removerLeadsVinculados,
        });

        if (!resposta.ok) {
          setErroDetalhesNegocio(resposta.erro);
          return false;
        }

        setNegocios((atual) => atual.filter((item) => item.id !== negocioSelecionado.id));
        setNegocioSelecionado(null);

        addToast({
          type: "success",
          title: "Negócio removido",
          description: removerLeadsVinculados
            ? "O negócio e seus leads vinculados foram removidos."
            : "O negócio foi removido e os leads vinculados foram desvinculados.",
        });

        return true;
      } catch {
        setErroDetalhesNegocio("Erro ao remover negócio.");
        return false;
      } finally {
        setRemovendoNegocio(false);
      }
    },
    [addToast, cancelarAutoSave, negocioSelecionado, removendoNegocio, setNegocios, setNegocioSelecionado],
  );

  useEffect(() => {
    salvarAutomaticamenteRef.current = async (negocioAtualizado) => {
      await salvarDetalhesNegocio(negocioAtualizado);
    };
  }, [salvarDetalhesNegocio]);

  const aoMudarNegocio = useCallback(
    (negocioAtualizado: Lead) => {
      setNegocioSelecionado(negocioAtualizado);

      if (erroDetalhesNegocio) {
        setErroDetalhesNegocio(null);
      }

      setSalvo(false);
      agendarAutoSave(negocioAtualizado);
    },
    [agendarAutoSave, erroDetalhesNegocio, setNegocioSelecionado],
  );

  useEffect(() => {
    if (negocioSelecionado) {
      void carregarLeadsDisponiveis();
      void carregarProdutosDisponiveis();
      return;
    }

    setProdutosDisponiveis([]);
    setLeadsDisponiveis([]);
    setErroVinculos(null);
    cancelarAutoSave();
  }, [carregarLeadsDisponiveis, carregarProdutosDisponiveis, cancelarAutoSave, negocioSelecionado]);

  const statusSalvamentoDetalhes = useMemo<StatusSalvamentoDetalhesNegocio>(() => {
    if (erroDetalhesNegocio) return "erro";
    if (salvandoAutomaticamente) return "salvando_automaticamente";
    if (salvando) return "salvando_manual";
    if (salvo) return "salvo";
    if (autoSavePendente) return "pendente";
    return "ocioso";
  }, [autoSavePendente, erroDetalhesNegocio, salvando, salvandoAutomaticamente, salvo]);

  return {
    erroDetalhesNegocio,
    setErroDetalhesNegocio,
    salvando,
    salvo,
    salvandoAutomaticamente,
    salvamentoAutomaticoPendente: autoSavePendente,
    ultimaAtualizacaoSalvaEm,
    statusSalvamentoDetalhes,
    salvarDetalhesNegocio,
    aoMudarNegocio,
    produtosDisponiveis,
    carregandoProdutosDisponiveis,
    leadsDisponiveis,
    carregandoLeadsDisponiveis,
    salvandoVinculos,
    removendoNegocio,
    erroVinculos,
    setErroVinculos,
    atualizarVinculosNegocio,
    removerNegocio,
  };
}
