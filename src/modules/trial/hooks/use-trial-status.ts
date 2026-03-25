"use client";

import { useCallback, useEffect, useState } from "react";
import type { EstadoTrial } from "../types";

type UseTrialStatusReturn = {
  dados: EstadoTrial | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
};

export function useTrialStatus(): UseTrialStatusReturn {
  const [dados, setDados] = useState<EstadoTrial | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/trial/status");
      if (!resposta.ok) {
        throw new Error("Falha ao buscar status do trial.");
      }
      setDados((await resposta.json()) as EstadoTrial);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro desconhecido.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return { dados, carregando, erro, recarregar: buscar };
}
