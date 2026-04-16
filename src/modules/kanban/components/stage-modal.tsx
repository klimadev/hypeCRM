"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import type { TipoEstagio } from "../types";
import { TypeSelector } from "./type-selector";

interface StageModalProps {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  onSubmit: (data: { nome: string; tipo: TipoEstagio }) => Promise<void>;
  trigger?: ReactNode;
  modoEdicao?: boolean;
  dadosIniciais?: { nome: string; tipo: TipoEstagio };
  carregando?: boolean;
}

export function StageModal({
  open,
  onOpenChange,
  onSubmit,
  trigger,
  modoEdicao = false,
  dadosIniciais,
  carregando = false,
}: StageModalProps) {
  const [nome, setNome] = useState(dadosIniciais?.nome ?? "");
  const [tipo, setTipo] = useState<TipoEstagio>(dadosIniciais?.tipo ?? "ABERTO");
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro("Nome do estágio é obrigatório.");
      return;
    }

    await onSubmit({ nome: nome.trim(), tipo });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {modoEdicao ? "Editar Estágio" : "Adicionar Estágio"}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Nome do Estágio
            </label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Novo Lead"
              disabled={carregando}
              required
              maxLength={100}
              className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Tipo
            </label>
            <TypeSelector value={tipo} onChange={setTipo} disabled={carregando} />
          </div>

          {erro && <p className="text-sm text-rose-500">{erro}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={carregando}
              className="rounded-xl border-[var(--border-subtle)]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={carregando}
              className="rounded-xl bg-[var(--brand)]"
            >
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {modoEdicao ? "Salvar Alterações" : "Adicionar"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}