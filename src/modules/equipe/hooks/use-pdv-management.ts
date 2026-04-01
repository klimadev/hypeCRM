"use client";

import { useCallback, useEffect, useState } from "react";
import type { Pdv, WhatsappInstancia } from "../types";
import {
  criarPdv as criarPdvApi,
  editarPdv as editarPdvApi,
  excluirPdv as excluirPdvApi,
  listarInstanciasWhatsapp,
  listarPdvs,
} from "@/lib/api/equipe";

type UsePdvManagementReturn = {
  pdvs: Pdv[];
  carregandoPdvs: boolean;
  criandoPdv: boolean;
  pdvEmEdicao: { id: string; nome: string; id_whatsapp_instancia?: string | null } | null;
  setPdvEmEdicao: React.Dispatch<React.SetStateAction<{ id: string; nome: string; id_whatsapp_instancia?: string | null } | null>>;
  salvandoPdvId: string | null;
  pdvParaExcluir: { id: string; nome: string } | null;
  setPdvParaExcluir: React.Dispatch<React.SetStateAction<{ id: string; nome: string } | null>>;
  excluindoPdvId: string | null;
  erroGestaoPdvs: string | null;
  instancias: WhatsappInstancia[];
  criarPdv: (nome: string) => Promise<boolean>;
  editarPdv: (id: string, nome: string, id_whatsapp_instancia?: string | null) => Promise<boolean>;
  trocarInstanciaPdv: (idPdv: string, idNovaInstancia: string | null) => Promise<boolean>;
  excluirPdv: (id: string) => Promise<void>;
  carregarPdvs: () => Promise<void>;
};

export function usePdvManagement(): UsePdvManagementReturn {
  const [pdvs, setPdvs] = useState<Pdv[]>([]);
  const [carregandoPdvs, setCarregandoPdvs] = useState(false);
  const [criandoPdv, setCriandoPdv] = useState(false);
  const [pdvEmEdicao, setPdvEmEdicao] = useState<{ id: string; nome: string; id_whatsapp_instancia?: string | null } | null>(null);
  const [salvandoPdvId, setSalvandoPdvId] = useState<string | null>(null);
  const [pdvParaExcluir, setPdvParaExcluir] = useState<{ id: string; nome: string } | null>(null);
  const [excluindoPdvId, setExcluindoPdvId] = useState<string | null>(null);
  const [erroGestaoPdvs, setErroGestaoPdvs] = useState<string | null>(null);
  const [instancias, setInstancias] = useState<WhatsappInstancia[]>([]);

  const enriquecerPdvsComAlertas = useCallback((listaPdvs: Pdv[]) => {
    return listaPdvs.map((pdv) => ({
      ...pdv,
      whatsapp_instancia: pdv.id_whatsapp_instancia
        ? {
            id: pdv.id_whatsapp_instancia,
            nome: pdv.whatsapp_instancia?.nome ?? "Instância",
            status: pdv.whatsapp_instancia?.status,
          }
        : undefined,
      alerta_configuracao: !pdv.id_whatsapp_instancia
        ? {
            tipo: "sem_instancia" as const,
            mensagem: "Sem instância WhatsApp vinculada. Este PDV será ignorado na sincronização automática.",
          }
        : null,
    }));
  }, []);

  const carregarPdvs = useCallback(async () => {
    setCarregandoPdvs(true);
    setErroGestaoPdvs(null);
    try {
      const resposta = await listarPdvs();
      if (!resposta.ok) {
        setErroGestaoPdvs(resposta.erro);
        return;
      }
      setPdvs(enriquecerPdvsComAlertas(resposta.dados.pdvs));
    } finally {
      setCarregandoPdvs(false);
    }
  }, [enriquecerPdvsComAlertas]);

  const carregarInstancias = useCallback(async () => {
    try {
      const resposta = await listarInstanciasWhatsapp();
      if (resposta.ok) {
        setInstancias(resposta.dados.instancias);
      } else {
        setErroGestaoPdvs("Erro ao carregar configuracoes WhatsApp. Tente novamente.");
      }
    } catch {
      setErroGestaoPdvs("Erro ao carregar configuracoes WhatsApp. Verifique a conexao.");
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    const carregarRecursos = async () => {
      if (!ativo) return;
      await Promise.all([carregarPdvs(), carregarInstancias()]);
    };

    void carregarRecursos();

    return () => {
      ativo = false;
    };
  }, [carregarInstancias, carregarPdvs]);

  const criarPdv = useCallback(
    async (nome: string) => {
      const nomeNormalizado = nome.trim();
      if (!nomeNormalizado) {
        setErroGestaoPdvs("Nome do PDV e obrigatorio.");
        return false;
      }

      setErroGestaoPdvs(null);
      setCriandoPdv(true);

      try {
        const resposta = await criarPdvApi(nomeNormalizado);
        if (!resposta.ok) {
          setErroGestaoPdvs(resposta.erro);
          return false;
        }

        await carregarPdvs();
        return true;
      } catch {
        setErroGestaoPdvs("Erro ao criar PDV.");
        return false;
      } finally {
        setCriandoPdv(false);
      }
    },
    [carregarPdvs],
  );

  const editarPdv = useCallback(
    async (id: string, nome: string, id_whatsapp_instancia?: string | null) => {
      const nomeNormalizado = nome.trim();
      if (!nomeNormalizado) {
        setErroGestaoPdvs("Nome do PDV e obrigatorio.");
        return false;
      }

      const pdvAnterior = pdvs.find((item) => item.id === id);
      if (!pdvAnterior) {
        return false;
      }

      setErroGestaoPdvs(null);
      setSalvandoPdvId(id);
      setPdvs((atual) =>
        atual.map((item) =>
          item.id === id
            ? {
                ...item,
                nome: nomeNormalizado,
                id_whatsapp_instancia: id_whatsapp_instancia ?? null,
                whatsapp_instancia:
                  id_whatsapp_instancia != null
                    ? instancias.find((instancia) => instancia.id === id_whatsapp_instancia) ?? null
                    : null,
                alerta_configuracao:
                  id_whatsapp_instancia != null
                    ? null
                    : {
                        tipo: "sem_instancia",
                        mensagem: "Sem instancia WhatsApp vinculada. Este PDV sera ignorado na sincronizacao automatica.",
                      },
              }
            : item,
        ),
      );

      try {
        const resposta = await editarPdvApi(id, nomeNormalizado, id_whatsapp_instancia);

        if (!resposta.ok) {
          setErroGestaoPdvs(resposta.erro);
          setPdvs((atual) => atual.map((item) => (item.id === id ? pdvAnterior : item)));
          return false;
        }
        return true;
      } catch {
        setErroGestaoPdvs("Erro ao editar PDV.");
        setPdvs((atual) => atual.map((item) => (item.id === id ? pdvAnterior : item)));
        return false;
      } finally {
        setSalvandoPdvId(null);
      }
    },
    [instancias, pdvs],
  );

  const trocarInstanciaPdv = useCallback(
    async (idPdv: string, idNovaInstancia: string | null) => {
      const pdvAtual = pdvs.find((item) => item.id === idPdv);
      if (!pdvAtual) {
        setErroGestaoPdvs("PDV nao encontrado.");
        return false;
      }

      return editarPdv(idPdv, pdvAtual.nome, idNovaInstancia);
    },
    [pdvs, editarPdv],
  );

  const excluirPdv = useCallback(
    async (id: string) => {
      const pdvAnterior = pdvs.find((item) => item.id === id);

      setErroGestaoPdvs(null);
      setExcluindoPdvId(id);
      setPdvs((atual) => atual.filter((item) => item.id !== id));

      try {
        const resposta = await excluirPdvApi(id);

        if (!resposta.ok) {
          setErroGestaoPdvs(resposta.erro);
          if (pdvAnterior) {
            setPdvs((atual) => [...atual, pdvAnterior]);
          }
        }
      } catch {
        setErroGestaoPdvs("Erro ao excluir PDV.");
        if (pdvAnterior) {
          setPdvs((atual) => [...atual, pdvAnterior]);
        }
      } finally {
        setExcluindoPdvId(null);
      }
    },
    [pdvs],
  );

  return {
    pdvs,
    carregandoPdvs,
    criandoPdv,
    pdvEmEdicao,
    setPdvEmEdicao,
    salvandoPdvId,
    pdvParaExcluir,
    setPdvParaExcluir,
    excluindoPdvId,
    erroGestaoPdvs,
    instancias,
    criarPdv,
    editarPdv,
    trocarInstanciaPdv,
    excluirPdv,
    carregarPdvs,
  };
}
