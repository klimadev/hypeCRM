"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Usuario } from "../../types";

type SuperAdminUsersDialogsProps = {
  modalEditar: Usuario | null;
  modalSenha: Usuario | null;
  modalExcluir: Usuario | null;
  onFecharEditar: () => void;
  onFecharSenha: () => void;
  onFecharExcluir: () => void;
  onEditarSubmit: (e: React.FormEvent) => void;
  onSenhaSubmit: (e: React.FormEvent) => void;
  onExcluirConfirm: () => void;
};

export function SuperAdminUsersDialogs({
  modalEditar,
  modalSenha,
  modalExcluir,
  onFecharEditar,
  onFecharSenha,
  onFecharExcluir,
  onEditarSubmit,
  onSenhaSubmit,
  onExcluirConfirm,
}: SuperAdminUsersDialogsProps) {
  const [digitoConfirmacao, setDigitoConfirmacao] = useState("");

  const podeExcluir = digitoConfirmacao.trim().toUpperCase() === "EXCLUIR";

  const handleExcluirConfirm = () => {
    if (podeExcluir) {
      onExcluirConfirm();
      setDigitoConfirmacao("");
    }
  };

  const handleFecharExcluir = () => {
    onFecharExcluir();
    setDigitoConfirmacao("");
  };

  return (
    <>
      <Dialog open={!!modalEditar} onOpenChange={(open) => !open && onFecharEditar()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Atualize os dados do usuário selecionado.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onEditarSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="nome" className="text-sm font-medium text-[var(--text-primary)]">
                  Nome
                </label>
                <Input id="nome" name="nome" defaultValue={modalEditar?.nome} required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium text-[var(--text-primary)]">
                  Email
                </label>
                <Input id="email" name="email" type="email" defaultValue={modalEditar?.email} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onFecharEditar}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!modalSenha} onOpenChange={(open) => !open && onFecharSenha()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>Digite a nova senha para o usuário.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSenhaSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="senha" className="text-sm font-medium text-[var(--text-primary)]">
                  Nova Senha
                </label>
                <Input id="senha" name="senha" type="password" minLength={6} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onFecharSenha}>
                Cancelar
              </Button>
              <Button type="submit">Alterar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!modalExcluir} onOpenChange={(open) => !open && handleFecharExcluir()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--danger)]">Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário{" "}
              <span className="font-semibold text-[var(--text-primary)]">{modalExcluir?.nome}</span>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Digite <span className="font-semibold text-[var(--danger)]">EXCLUIR</span> para confirmar:
            </p>
            <Input
              value={digitoConfirmacao}
              onChange={(e) => setDigitoConfirmacao(e.target.value)}
              placeholder="Digite EXCLUIR"
              className="border-[var(--danger)] focus:border-[var(--danger)]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleFecharExcluir}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleExcluirConfirm}
              disabled={!podeExcluir}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}