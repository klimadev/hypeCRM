import { listarIntegracoesDisponiveis } from "../catalogo";
import type { UseIntegracoesModuleReturn } from "../types";

export function useIntegracoesModule(): UseIntegracoesModuleReturn {
  return {
    integracoes: listarIntegracoesDisponiveis(),
  };
}
