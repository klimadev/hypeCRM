"use client";

import { useEffect, useState } from "react";
import { listarEstagiosFunil, listarInstanciasWhatsapp } from "@/lib/api/whatsapp";
import type { EstagioFunilOption, WhatsappInstancia } from "@/modules/whatsapp/types";

export function useAutomacaoWizardData(open: boolean) {
  const [instancias, setInstancias] = useState<WhatsappInstancia[]>([]);
  const [estagios, setEstagios] = useState<EstagioFunilOption[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [erroCarregamentoInstancias, setErroCarregamentoInstancias] = useState<string | null>(null);
  const [erroCarregamentoEstagios, setErroCarregamentoEstagios] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      setCarregandoDados(true);
      setErroCarregamentoInstancias(null);
      setErroCarregamentoEstagios(null);

      const [instanciasResult, estagiosResult] = await Promise.allSettled([
        listarInstanciasWhatsapp(),
        listarEstagiosFunil(),
      ]);

      if (!ativo) {
        return;
      }

      if (instanciasResult.status === "fulfilled") {
        if (instanciasResult.value.ok) {
          setInstancias(instanciasResult.value.dados.instancias);
        } else {
          setErroCarregamentoInstancias(instanciasResult.value.erro || "Nao foi possivel carregar as instancias agora.");
        }
      } else {
        setErroCarregamentoInstancias("Nao foi possivel carregar as instancias agora. Tente novamente em instantes.");
      }

      if (estagiosResult.status === "fulfilled") {
        if (estagiosResult.value.ok) {
          setEstagios(estagiosResult.value.dados.estagios);
        } else {
          setErroCarregamentoEstagios(estagiosResult.value.erro || "Nao foi possivel carregar os estagios agora.");
        }
      } else {
        setErroCarregamentoEstagios("Nao foi possivel carregar os estagios agora. Tente novamente em instantes.");
      }

      setCarregandoDados(false);
    }

    if (open) {
      void carregarDados();
    }

    return () => {
      ativo = false;
    };
  }, [open]);

  return {
    instancias,
    estagios,
    carregandoDados,
    erroCarregamentoInstancias,
    erroCarregamentoEstagios,
  };
}
