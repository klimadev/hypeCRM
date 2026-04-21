"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { useSuperAdminUsers } from "./hooks/use-super-admin-users";
import { SuperAdminUsersTable } from "./components/super-admin-users-table";
import { SuperAdminUsersDialogs } from "./components/super-admin-users-dialogs";
import type { Usuario } from "../../types";

export function ModuloSuperAdminUsuarios() {
  const vm = useSuperAdminUsers();
  const [modalEditar, setModalEditar] = useState<Usuario | null>(null);
  const [modalSenha, setModalSenha] = useState<Usuario | null>(null);
  const [modalExcluir, setModalExcluir] = useState<Usuario | null>(null);

  const handleRecarregar = async () => {
    await vm.recarregar();
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditar) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const res = await fetch(`/api/super-admin/usuarios/${modalEditar.id}?tipo=${modalEditar.tipo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: formData.get("nome"),
        email: formData.get("email"),
        tipo: modalEditar.tipo,
      }),
    });
    if (res.ok) {
      setModalEditar(null);
      handleRecarregar();
    }
  };

  const handleSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSenha) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const res = await fetch(`/api/super-admin/usuarios/${modalSenha.id}/senha?tipo=${modalSenha.tipo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        novaSenha: formData.get("senha"),
        tipo: modalSenha.tipo,
      }),
    });
    if (res.ok) {
      setModalSenha(null);
    }
  };

  const handleExcluir = async () => {
    if (!modalExcluir) return;
    try {
      const res = await fetch(`/api/super-admin/usuarios/${modalExcluir.id}?tipo=${modalExcluir.tipo}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.erro || "Erro ao excluir");
      }
      setModalExcluir(null);
      handleRecarregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir");
    }
  };

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title="Usuários"
        subtitle="Gerenciamento global de usuários do sistema"
        icon={<Users />}
        iconTone="slate"
      />
      <SuperAdminUsersTable
        usuarios={vm.usuarios}
        carregando={vm.carregando}
        erro={vm.erro}
        filtroTipo={vm.filtroTipo}
        pagina={vm.pagina}
        totalPaginas={vm.totalPaginas}
        setFiltroTipo={vm.setFiltroTipo}
        setPagina={vm.setPagina}
        onEditar={setModalEditar}
        onSenha={setModalSenha}
        onExcluir={setModalExcluir}
        onRecarregar={handleRecarregar}
      />
      <SuperAdminUsersDialogs
        modalEditar={modalEditar}
        modalSenha={modalSenha}
        modalExcluir={modalExcluir}
        onFecharEditar={() => setModalEditar(null)}
        onFecharSenha={() => setModalSenha(null)}
        onFecharExcluir={() => setModalExcluir(null)}
        onEditarSubmit={handleEditar}
        onSenhaSubmit={handleSenha}
        onExcluirConfirm={handleExcluir}
      />
    </ModulePageShell>
  );
}