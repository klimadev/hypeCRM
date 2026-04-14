import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatarTelefoneChat } from "../helpers";

type ChatOrphanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  telefone: string;
  nomeInicial: string;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  onSubmit: (params: {
    telefone: string;
    nome?: string;
    id_pdv?: string;
    id_funcionario?: string;
    id_estagio?: string;
  }) => void;
};

export function ChatOrphanDialog({
  open,
  onOpenChange,
  title,
  description,
  telefone,
  nomeInicial,
  perfil,
  onSubmit,
}: ChatOrphanDialogProps) {
  const [nome, setNome] = useState(nomeInicial);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Telefone</label>
            <input
              type="text"
              value={formatarTelefoneChat(telefone)}
              disabled
              className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm text-[var(--text-tertiary)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Nome (opcional)</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do contato"
              className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>

          <p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-xs text-[var(--text-secondary)]">
            {perfil === "COLABORADOR"
              ? "O lead será vinculado automaticamente a você."
              : perfil === "GERENTE"
                ? "O responsável será escolhido dentro do seu PDV após o cadastro."
                : "Você poderá complementar PDV e responsável na próxima etapa."}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                telefone,
                nome: nome.trim() || undefined,
              })
            }
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
