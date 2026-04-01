"use client";

import { useMemo, useState } from "react";
import type { UseEquipeModuleReturn } from "../types";
import { EquipeLojaDrawer } from "./equipe-loja-drawer";
import { EquipeLojaGrid } from "./equipe-loja-grid";
import { abrirPainelPdv, fecharPainelPdv, resolverLojaSelecionada } from "./pdv-management-panel.utils";

type PdvManagementPanelProps = {
  vm: UseEquipeModuleReturn;
  drawerNovoPdvAberto: boolean;
  setDrawerNovoPdvAberto: (aberto: boolean) => void;
};

export function PdvManagementPanel({ vm, drawerNovoPdvAberto, setDrawerNovoPdvAberto }: PdvManagementPanelProps) {
  const [drawerLojaAberto, setDrawerLojaAberto] = useState(false);
  const [lojaSelecionadaId, setLojaSelecionadaId] = useState<string | null>(null);

  const lojaSelecionada = useMemo(
    () => resolverLojaSelecionada(vm.pdvs, lojaSelecionadaId),
    [lojaSelecionadaId, vm.pdvs],
  );

  const handleAbrirLoja = (lojaId: string) => {
    const proximoEstado = abrirPainelPdv(lojaId);
    setDrawerLojaAberto(proximoEstado.drawerAberto);
    setLojaSelecionadaId(proximoEstado.lojaSelecionadaId);
  };

  const handleFecharLoja = () => {
    const proximoEstado = fecharPainelPdv();
    setDrawerLojaAberto(proximoEstado.drawerAberto);
    setLojaSelecionadaId(proximoEstado.lojaSelecionadaId);
  };

  return (
    <>
      <EquipeLojaGrid
        vm={vm}
        drawerNovaLojaAberto={drawerNovoPdvAberto}
        setDrawerNovaLojaAberto={setDrawerNovoPdvAberto}
        onAbrirLoja={(loja) => handleAbrirLoja(loja.id)}
      />

      <EquipeLojaDrawer
        vm={vm}
        loja={lojaSelecionada}
        aberto={drawerLojaAberto}
        onFechar={handleFecharLoja}
      />
    </>
  );
}
