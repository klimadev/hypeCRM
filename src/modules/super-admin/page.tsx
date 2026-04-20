"use client";

import { useState, useEffect } from "react";

type Usuario = {
  id: string;
  tipo: "empresa" | "funcionario";
  nome: string;
  email: string;
  isSuperAdmin: boolean;
  status: string;
  criado_em: string;
  empresaNome?: string;
};

export function ModuloSuperAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<"all" | "empresa" | "funcionario">("all");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [modalEditar, setModalEditar] = useState<Usuario | null>(null);
  const [modalSenha, setModalSenha] = useState<Usuario | null>(null);
  const [modalExcluir, setModalExcluir] = useState<Usuario | null>(null);

  const carregarUsuarios = async () => {
    setCarregando(true);
    const res = await fetch(`/api/super-admin/usuarios?tipo=${tipoFiltro}&pagina=${pagina}&limite=20`);
    const data = await res.json();
    if (data.usuarios) {
      setUsuarios(data.usuarios);
      setTotalPaginas(data.totalPaginas);
    }
    setCarregando(false);
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditar) return;
    const formData = new FormData(e.target as HTMLFormElement);
    await fetch(`/api/super-admin/usuarios/${modalEditar.id}?tipo=${modalEditar.tipo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: formData.get("nome"),
        email: formData.get("email"),
        tipo: modalEditar.tipo,
      }),
    });
    setModalEditar(null);
    carregarUsuarios();
  };

  const handleSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSenha) return;
    const formData = new FormData(e.target as HTMLFormElement);
    await fetch(`/api/super-admin/usuarios/${modalSenha.id}/senha?tipo=${modalSenha.tipo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        novaSenha: formData.get("senha"),
        tipo: modalSenha.tipo,
      }),
    });
    setModalSenha(null);
  };

  const handleExcluir = async () => {
    if (!modalExcluir) return;
    await fetch(`/api/super-admin/usuarios/${modalExcluir.id}?tipo=${modalExcluir.tipo}`, {
      method: "DELETE",
    });
    setModalExcluir(null);
    carregarUsuarios();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Painel Super Admin</h1>
          <button
            onClick={carregarUsuarios}
            className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            Atualizar
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {(["all", "empresa", "funcionario"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTipoFiltro(t);
                setPagina(1);
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                tipoFiltro === t ? "bg-[#2563eb] text-white" : "bg-[#1a1a1a] text-gray-400 hover:text-white"
              }`}
            >
              {t === "all" ? "Todos" : t === "empresa" ? "Empresas" : "Funcionários"}
            </button>
          ))}
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#333]">
                <th className="text-left p-4 text-gray-400 font-medium">Nome</th>
                <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                <th className="text-left p-4 text-gray-400 font-medium">Tipo</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Admin</th>
                <th className="text-left p-4 text-gray-400 font-medium">Criado em</th>
                <th className="text-left p-4 text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">Carregando...</td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">Nenhum usuário encontrado</td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-[#333] hover:bg-[#222] transition-colors">
                    <td className="p-4">{u.nome}</td>
                    <td className="p-4 text-gray-400">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${u.tipo === "empresa" ? "bg-[#2563eb]/20 text-[#60a5fa]" : "bg-[#7c3aed]/20 text-[#a78bfa]"}`}>
                        {u.tipo === "empresa" ? "Empresa" : "Funcionário"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${u.status === "ATIVO" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.isSuperAdmin && <span className="text-yellow-400">★ Super Admin</span>}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">{new Date(u.criado_em).toLocaleDateString("pt-BR")}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => setModalEditar(u)} className="px-3 py-1 text-sm bg-[#333] hover:bg-[#444] rounded transition-colors">
                          Editar
                        </button>
                        <button onClick={() => setModalSenha(u)} className="px-3 py-1 text-sm bg-[#333] hover:bg-[#444] rounded transition-colors">
                          Senha
                        </button>
                        <button onClick={() => setModalExcluir(u)} className="px-3 py-1 text-sm bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded transition-colors">
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPagina(p)}
                className={`w-10 h-10 rounded-lg transition-colors ${pagina === p ? "bg-[#2563eb] text-white" : "bg-[#1a1a1a] text-gray-400 hover:text-white"}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {modalEditar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setModalEditar(null)}>
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Editar Usuário</h2>
            <form onSubmit={handleEditar}>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Nome</label>
                <input name="nome" defaultValue={modalEditar.nome} className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg p-3 text-white focus:border-[#2563eb] outline-none" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Email</label>
                <input name="email" type="email" defaultValue={modalEditar.email} className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg p-3 text-white focus:border-[#2563eb] outline-none" required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModalEditar(null)} className="flex-1 py-3 bg-[#333] hover:bg-[#444] rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalSenha && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setModalSenha(null)}>
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Redefinir Senha</h2>
            <form onSubmit={handleSenha}>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Nova Senha</label>
                <input name="senha" type="password" minLength={6} className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg p-3 text-white focus:border-[#2563eb] outline-none" required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModalSenha(null)} className="flex-1 py-3 bg-[#333] hover:bg-[#444] rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg transition-colors">Alterar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalExcluir && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setModalExcluir(null)}>
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4 text-red-400">Confirmar Exclusão</h2>
            <p className="text-gray-400 mb-4">Tem certeza que deseja excluir o usuário <strong className="text-white">{modalExcluir.nome}</strong>? Esta ação não pode ser desfeita.</p>
            <p className="text-gray-400 mb-4 text-sm">Digite <strong className="text-red-400">EXCLUIR</strong> para confirmar:</p>
            <input id="confirmExcluir" type="text" className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg p-3 text-white mb-4 focus:border-red-500 outline-none" />
            <div className="flex gap-3">
              <button onClick={() => setModalExcluir(null)} className="flex-1 py-3 bg-[#333] hover:bg-[#444] rounded-lg transition-colors">Cancelar</button>
              <button onClick={() => { if ((document.getElementById("confirmExcluir") as HTMLInputElement).value === "EXCLUIR") handleExcluir(); }} className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}