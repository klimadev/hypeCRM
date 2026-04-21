"use client";

import { useCallback, useEffect, useState } from "react";
import type { Usuario, UsuarioTipo, UsuariosResponse } from "../../types";

export type FiltroTipo = "all" | UsuarioTipo;

export type UseSuperAdminUsersReturn = {
  usuarios: Usuario[];
  carregando: boolean;
  erro: string | null;
  filtroTipo: FiltroTipo;
  pagina: number;
  totalPaginas: number;
  setFiltroTipo: (tipo: FiltroTipo) => void;
  setPagina: (pagina: number) => void;
  recarregar: () => Promise<void>;
};

export function useSuperAdminUsers(): UseSuperAdminUsersReturn {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("all");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const res = await fetch(`/api/super-admin/usuarios?tipo=${filtroTipo}&pagina=${pagina}&limite=20`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.erro || "Falha ao carregar usuários");
      }
      const data: UsuariosResponse = await res.json();
      setUsuarios(data.usuarios);
      setTotalPaginas(data.totalPaginas);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  }, [filtroTipo, pagina]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return {
    usuarios,
    carregando,
    erro,
    filtroTipo,
    pagina,
    totalPaginas,
    setFiltroTipo,
    setPagina,
    recarregar: buscar,
  };
}