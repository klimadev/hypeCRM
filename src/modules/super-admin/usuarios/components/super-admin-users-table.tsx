"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Usuario } from "../../types";
import type { FiltroTipo } from "../hooks/use-super-admin-users";

type SuperAdminUsersTableProps = {
  usuarios: Usuario[];
  carregando: boolean;
  erro: string | null;
  filtroTipo: FiltroTipo;
  pagina: number;
  totalPaginas: number;
  setFiltroTipo: (tipo: FiltroTipo) => void;
  setPagina: (pagina: number) => void;
  onEditar: (u: Usuario) => void;
  onSenha: (u: Usuario) => void;
  onExcluir: (u: Usuario) => void;
  onRecarregar: () => void;
};

export function SuperAdminUsersTable({
  usuarios,
  carregando,
  erro,
  filtroTipo,
  pagina,
  totalPaginas,
  setFiltroTipo,
  setPagina,
  onEditar,
  onSenha,
  onExcluir,
  onRecarregar,
}: SuperAdminUsersTableProps) {
  const opcoesFiltro: { value: FiltroTipo; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "empresa", label: "Empresas" },
    { value: "funcionario", label: "Funcionários" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {opcoesFiltro.map((op) => (
            <Button
              key={op.value}
              variant={filtroTipo === op.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroTipo(op.value)}
              className={cn(
                "h-8 px-3 text-xs",
                filtroTipo === op.value
                  ? "bg-[var(--brand)] text-[var(--primary-foreground)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
              )}
            >
              {op.label}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRecarregar}
          disabled={carregando}
          className="h-8 gap-2 border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", carregando && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-soft)]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Admin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Criado em
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
                  </td>
                </tr>
              ) : erro ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--danger)]">
                    {erro}
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--text-tertiary)]">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-elevated)]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{u.nome}</span>
                        {u.tipo === "funcionario" && u.empresaNome && (
                          <span className="text-xs text-[var(--text-tertiary)]">{u.empresaNome}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs font-medium",
                          u.tipo === "empresa"
                            ? "border-[color:rgba(37,99,235,0.24)] bg-[color:rgba(37,99,235,0.12)] text-[#60a5fa]"
                            : "border-[color:rgba(124,58,237,0.24)] bg-[color:rgba(124,58,237,0.12)] text-[#a78bfa]"
                        )}
                      >
                        {u.tipo === "empresa" ? "Empresa" : "Funcionário"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs font-medium",
                          u.status === "ATIVO" || u.status === "ATIVA"
                            ? "border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.12)] text-[var(--success)]"
                            : "border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.12)] text-[var(--danger)]"
                        )}
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.isSuperAdmin && (
                        <span className="text-xs font-semibold text-[var(--warning)]">★ Super Admin</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-tertiary)]">
                      {new Date(u.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditar(u)}
                          className="h-7 px-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSenha(u)}
                          className="h-7 px-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          Senha
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onExcluir(u)}
                          className="h-7 px-2 text-xs text-[var(--danger)] hover:bg-[color:rgba(244,63,94,0.12)]"
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={pagina === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPagina(p)}
              className={cn(
                "h-8 w-8",
                pagina === p
                  ? "bg-[var(--brand)] text-[var(--primary-foreground)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)]"
              )}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}