import type { Pdv } from "../types";

export type EstadoPainelPdv = {
  drawerAberto: boolean;
  lojaSelecionadaId: string | null;
};

export function resolverLojaSelecionada(pdvs: Pdv[], lojaSelecionadaId: string | null) {
  if (!lojaSelecionadaId) {
    return null;
  }

  return pdvs.find((pdv) => pdv.id === lojaSelecionadaId) ?? null;
}

export function abrirPainelPdv(lojaSelecionadaId: string): EstadoPainelPdv {
  return {
    drawerAberto: true,
    lojaSelecionadaId,
  };
}

export function fecharPainelPdv(): EstadoPainelPdv {
  return {
    drawerAberto: false,
    lojaSelecionadaId: null,
  };
}
